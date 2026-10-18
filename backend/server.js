// ============================================================
// Backend da Barbearia do Jota
//
// O QUE ELE FAZ (duas opcoes, voce escolhe no .env):
//
//   MODO = "link_unico"  (recomendado, funciona com varios clientes ao mesmo tempo)
//     Cria uma cobranca nova da InfinitePay para CADA agendamento.
//     O cliente paga naquele link e o servidor so confere SE AQUELA cobranca caiu.
//
//   MODO = "link_fixo"   (o seu link de sempre, um so para todos)
//     Nao cria cobranca. Todo mundo paga no mesmo link.
//     O servidor guarda como o link estava quando o agendamento comecou
//     e so confirma se o pagamento caiu DEPOIS disso.
//
//   API usada:
//     POST https://api.checkout.infinitepay.io/links          (cria cobranca)
//     POST https://api.checkout.infinitepay.io/payment_check  (confere se caiu)
//
// Roda com:  npm install  &&  npm start
// ============================================================

const fs = require('fs');
const path = require('path');

// le o .env de onde este arquivo esta, nao de onde o comando foi digitado
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT || 3001);

// ---------- configuracoes (todas no .env) ----------
const MODO = (process.env.MODO_PAGAMENTO || 'link_unico').trim();   // link_unico | link_fixo
const API_KEY = (process.env.INFINITYPAY_API_KEY || '').trim();
const HANDLE = (process.env.INFINITEPAY_HANDLE || '').trim();
const LINK_FIXO = (process.env.INFINITEPAY_LINK || '').trim();
const SLUG_FIXO = (process.env.INFINITEPAY_LINK_SLUG || '').trim();
const SIGNAL_VALUE = Number(process.env.SIGNAL_VALUE || 10);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').trim();
const API = 'https://api.checkout.infinitepay.io';
const DB_FILE = path.join(__dirname, 'pagamentos.json');

app.use(cors());
app.use(express.json({ limit: '200kb' }));

// ---------- armazenamento simples em arquivo ----------
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return { pagamentos: {} };
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return db && db.pagamentos ? db : { pagamentos: {} };
  } catch { return { pagamentos: {} }; }
}
function saveDB(db) {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
  catch (e) { console.error('[db] nao consegui salvar:', e.message); }
}
const getPagamento = (id) => loadDB().pagamentos[id] || null;
function setPagamento(id, patch) {
  const db = loadDB();
  const atual = db.pagamentos[id] || { bookingId: id };
  db.pagamentos[id] = { ...atual, ...patch, atualizadoEm: new Date().toISOString() };
  saveDB(db);
  return db.pagamentos[id];
}
const centavos = (v) => Math.round(Number(v || 0) * 100);

// ---------- InfinitePay ----------
async function chamar(metodo, rota, corpo) {
  const res = await fetch(`${API}${rota}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...(corpo ? { body: JSON.stringify(corpo) } : {}),
  });
  const texto = await res.text();
  let dados = {};
  try { dados = texto ? JSON.parse(texto) : {}; } catch { dados = { raw: texto }; }
  if (!res.ok) throw new Error(`InfinitePay ${res.status}: ${dados.message || texto.slice(0, 160)}`);
  return dados;
}

// o link vem como https://checkout.infinitepay.io/<handle>?lenc=<SLUG>.v1.<checksum>
const extrairSlug = (url) => (url && url.split('lenc=')[1] ? url.split('lenc=')[1].split('.v1')[0] : null);

async function linkJaFoiPago(slug) {
  if (!slug) return false;
  const r = await chamar('POST', '/payment_check', { handle: HANDLE, slug });
  return r.success === true || Number(r.paid_amount || 0) > 0;
}

async function criarCobranca({ nsu, descricao }) {
  const link = await chamar('POST', '/links', {
    handle: HANDLE,
    order_nsu: nsu,
    items: [{ quantity: 1, price: centavos(SIGNAL_VALUE), description: descricao.slice(0, 120) }],
    ...(PUBLIC_BASE_URL ? {
      redirect_url: `${PUBLIC_BASE_URL}/?pago=${encodeURIComponent(nsu)}`,
      webhook_url: `${PUBLIC_BASE_URL}/api/webhook/infinitypay`,
    } : {}),
  });
  const url = link.url || null;
  return { url, slug: link.invoice_slug || link.slug || extrairSlug(url) };
}

// ============================================================
// ROTAS
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    modo: MODO,
    infinitepay: API_KEY && HANDLE ? 'configurado' : 'sem credenciais',
    handle: HANDLE || null,
    sinal: SIGNAL_VALUE,
    linkFixo: MODO === 'link_fixo' ? LINK_FIXO : null,
    aguardando: Object.values(loadDB().pagamentos).filter((p) => !p.pago).length,
  });
});

app.get('/api/link', (req, res) => {
  res.json({
    modo: MODO,
    link: MODO === 'link_fixo' ? LINK_FIXO : null,
    valor: centavos(SIGNAL_VALUE),
  });
});

// ============================================================
// Abre a espera do pagamento de um agendamento.
//   link_unico: cria a cobranca agora
//   link_fixo :  guarda como o link esta, para comparar depois
// ============================================================
app.post('/api/aguardar', async (req, res) => {
  try {
    const { bookingId, serviceName, dateLabel, time, clientName } = req.body || {};
    if (!bookingId) return res.status(400).json({ error: 'Falta o bookingId.' });
    if (!API_KEY || !HANDLE) {
      return res.status(503).json({ error: 'SEM_CREDENCIAIS', message: 'Backend sem a chave da InfinitePay.' });
    }

    // ja respondido antes? devolve o mesmo link
    const anterior = getPagamento(bookingId);
    if (anterior && anterior.pago) {
      return res.json({ modo: MODO, link: anterior.link, valor: anterior.valor, pago: true });
    }

    const descricao = `Sinal ${SIGNAL_VALUE.toFixed(2).replace('.', ',')} - ${serviceName || ''} ${dateLabel || ''} ${time || ''} - ${bookingId}`;
    const valor = centavos(SIGNAL_VALUE);

    if (MODO === 'link_fixo') {
      if (!SLUG_FIXO) return res.status(503).json({ error: 'SEM_LINK_FIXO' });
      let jaPagoAntes = false;
      try { jaPagoAntes = await linkJaFoiPago(SLUG_FIXO); }
      catch (e) { console.error('[aguardar]', e.message); }
      const r = setPagamento(bookingId, {
        modo: 'link_fixo', link: LINK_FIXO, slug: SLUG_FIXO,
        jaPagoAntes, pago: false, valor, descricao,
        cliente: clientName || '', criadoEm: new Date().toISOString(),
      });
      console.log(`[pix] aguardando ${bookingId} (link ja estava pago? ${jaPagoAntes})`);
      return res.json({ modo: 'link_fixo', link: r.link, valor });
    }

    // ---- modo link_unico: uma cobranca so para este agendamento ----
    const { url, slug } = await criarCobranca({ nsu: bookingId, descricao });
    const r = setPagamento(bookingId, {
      modo: 'link_unico', link: url, slug, jaPagoAntes: false, pago: false,
      valor, descricao, cliente: clientName || '', criadoEm: new Date().toISOString(),
    });
    console.log(`[pix] cobranca de ${bookingId} criada: ${url}`);
    return res.json({ modo: 'link_unico', link: r.link, valor });
  } catch (e) {
    console.error('[aguardar]', e.message);
    return res.status(500).json({ error: 'ERRO_INFINITEPAY', message: e.message });
  }
});

// ============================================================
// O site chama a cada 5 segundos. Responde pago:true quando caiu.
// ============================================================
app.get('/api/conferir/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const registro = getPagamento(bookingId);
    if (!registro) return res.status(404).json({ pago: false, erro: 'Agendamento nao encontrado.' });
    if (registro.pago) return res.json({ pago: true, valor: registro.valor });

    const caiu = await linkJaFoiPago(registro.slug);
    console.log(`[pix] conferindo ${bookingId} -> caiu=${caiu}`);

    if (caiu && !registro.jaPagoAntes) {
      setPagamento(bookingId, { pago: true, confirmadoEm: new Date().toISOString() });
      console.log(`[pix] PAGO: ${bookingId}`);
      return res.json({ pago: true, valor: registro.valor });
    }
    if (caiu && registro.jaPagoAntes) {
      return res.json({
        pago: false, ambiguo: true, valor: registro.valor,
        aviso: 'Este link ja estava pago antes do seu agendamento. Confirme com a barbearia.',
      });
    }
    return res.json({ pago: false, valor: registro.valor });
  } catch (e) {
    console.error('[conferir]', e.message);
    return res.status(500).json({ pago: false, erro: e.message });
  }
});

// a InfinitePay avisa na hora que cai (se voce configurar o webhook)
app.post('/api/webhook/infinitypay', (req, res) => {
  res.sendStatus(200);
  try {
    const b = req.body || {};
    const slug = b.invoice_slug || b.invoiceSlug || b.slug
      || (b.data && (b.data.invoice_slug || b.data.invoiceSlug || b.data.slug));
    if (!slug) return;
    const achado = Object.values(loadDB().pagamentos).find((p) => p.slug === slug);
    if (!achado) return;
    const pago = b.paid_amount != null
      ? Number(b.paid_amount) >= Number(b.amount || achado.valor)
      : true;
    setPagamento(achado.bookingId, { pago });
    console.log(`[webhook] ${achado.bookingId} pago=${pago}`);
  } catch (e) { console.error('[webhook]', e.message); }
});

app.listen(PORT, () => {
  console.log(`\n  Barbearia do Jota - servidor na porta ${PORT}`);
  console.log(`  Modo: ${MODO}`);
  console.log(`  InfinitePay: ${API_KEY && HANDLE ? `OK (${HANDLE})` : 'SEM CREDENCIAIS'}`);
  if (MODO === 'link_fixo') console.log(`  Link fixo: ${LINK_FIXO}`);
  console.log(`  Sinal: R$ ${SIGNAL_VALUE.toFixed(2)}`);
  console.log('');
});
