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

// ============================================================
//  PAINEL DO BARBEIRO
//  - guarda TODOS os agendamentos que o site mandar (painel.json)
//  - manda o aberto/fechado e os horarios que o barbeiro escolher
//  - o Painel (APK do barbeiro) ler com um PIN para nao expor os
//    clientes para qualquer um.
const PIN_PAINEL = String(process.env.PIN_PAINEL || '1234').trim(); // <- troque pelo .env ou aqui
const PAINEL_FILE = path.join(__dirname, 'painel.json');
const NTFY_URL = String(process.env.NTFY_URL || 'https://ntfy.sh').trim();
const NTFY_TOPIC = String(process.env.NTFY_TOPIC || 'bjota-ag-7k2m9xI').trim();

// avisa o Painel pelo canal da internet (funciona mesmo se o servidor
// esta longe do celular do barbeiro)
function publicarCanal(corpo) {
  try {
    fetch(`${NTFY_URL}/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(corpo),
    }).catch(() => {});
  } catch { /* ignora */ }
}
// ============================================================

const STATUS_PADRAO = { modo: 'auto', aberto: null, abreAs: '09:00', fechaAs: '21:00', atualizadoEm: null };
function loadPainel() {
  try {
    if (!fs.existsSync(PAINEL_FILE)) return { status: { ...STATUS_PADRAO }, agendamentos: {} };
    const d = JSON.parse(fs.readFileSync(PAINEL_FILE, 'utf8'));
    if (!d || typeof d !== 'object') throw new Error('arquivo ruim');
    if (!d.agendamentos || typeof d.agendamentos !== 'object') d.agendamentos = {};
    d.status = { ...STATUS_PADRAO, ...(d.status || {}) };
    return d;
  } catch {
    return { status: { ...STATUS_PADRAO }, agendamentos: {} };
  }
}
function savePainel(d) {
  try { fs.writeFileSync(PAINEL_FILE, JSON.stringify(d, null, 2)); }
  catch (e) { console.error('[painel] nao consegui salvar:', e.message); }
}
// diz se esta aberto agora, pelo statusdo painel
function calcularAberto(st) {
  if (!st) return false;
  if (st.modo === 'manual') return st.aberto !== false; // quando forcado, vale a palavra do barbeiro
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= minutosDe(st.abreAs) && mins <= minutosDe(st.fechaAs);
}
const minutosDe = (t) => {
  const [h, m] = String(t || '09:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const pinOk = (req) => {
  const q = (req.query && req.query.pin) != null ? req.query.pin : ((req.body || {}).pin);
  return String(q || '') === PIN_PAINEL;
};

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
//  PAINEL: status publico (site usa para abrir/fechar e horarios)
// ============================================================
app.get('/api/status', (req, res) => {
  const st = loadPainel().status;
  const now = new Date();
  res.json({
    modo: st.modo,
    aberto: calcularAberto(st),
    abreAs: st.abreAs,
    fechaAs: st.fechaAs,
    weekday: now.getDay(),
    atualizadoEm: st.atualizadoEm,
  });
});

// Painel (APK do barbeiro, com PIN): tudo — status + agendamentos
app.get('/api/painel', (req, res) => {
  if (!pinOk(req)) return res.status(401).json({ error: 'PIN errado.' });
  const p = loadPainel();
  const agendamentos = Object.values(p.agendamentos).sort((a, b) => {
    const da = `${a.dateKey || ''} ${a.time || ''}`;
    const db = `${b.dateKey || ''} ${b.time || ''}`;
    if (da === db) return (b.createdAt || '').localeCompare(a.createdAt || '');
    return da > db ? 1 : -1;
  });
  res.json({ status: p.status, aberto: calcularAberto(p.status), agendamentos });
});

// Painel: o barbeiro confirmou o Pix na mao (visto na conta dele)
app.post('/api/painel/pago', (req, res) => {
  if (!pinOk(req)) return res.status(401).json({ error: 'PIN errado.' });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'falta o id' });
  const p = loadPainel();
  if (!p.agendamentos[id]) return res.status(404).json({ error: 'agendamento nao existe' });
  if (p.agendamentos[id].pixStatus !== 'pago') {
    p.agendamentos[id].pixStatus = 'pago';
    p.agendamentos[id].status = 'confirmado';
    p.agendamentos[id].confirmadoPor = 'barbeiro';
    savePainel(p);
  }
  // se houver registro de cobranca, marca pago tambem (evita confirmacao dupla)
  const registro = getPagamento(id);
  if (!registro || !registro.pago) {
    setPagamento(id, { pago: true, confirmadoEm: new Date().toISOString(), confirmadoPor: 'barbeiro' });
  }
  // avisa o APLICATIVO do cliente pelo canal — o dele muda na hora
  publicarCanal({ t: 'p', b: { id, pixStatus: 'pago', status: 'confirmado' } });
  console.log(`[painel] pago confirmado na mao: ${id}`);
  res.json({ ok: true });
});

// Painel: o barbeiro marca aberto/fechado e os horarios
app.post('/api/painel/status', (req, res) => {
  if (!pinOk(req)) return res.status(401).json({ error: 'PIN errado.' });
  const { modo, aberto, abreAs, fechaAs } = req.body || {};
  const p = loadPainel();
  if (modo === 'auto' || modo === 'manual') p.status.modo = modo;
  if (modo === 'manual' && aberto != null) p.status.aberto = !!aberto;
  if (abreAs && /^\d{1,2}:\d{2}$/.test(String(abreAs))) p.status.abreAs = String(abreAs).padStart(5, '0');
  if (fechaAs && /^\d{1,2}:\d{2}$/.test(String(fechaAs))) p.status.fechaAs = String(fechaAs).padStart(5, '0');
  p.status.atualizadoEm = new Date().toISOString();
  savePainel(p);
  console.log(`[painel] status: modo=${p.status.modo} aberto=${calcularAberto(p.status)} janela ${p.status.abreAs}-${p.status.fechaAs}`);
  res.json({ ok: true, status: p.status, aberto: calcularAberto(p.status) });
});

// O site manda cada agendamento novo para ficar salvo no Painel
app.post('/api/agendar', (req, res) => {
  const b = req.body || {};
  if (!b.id) return res.status(400).json({ error: 'falta o id' });
  const p = loadPainel();
  const jaTinha = !!p.agendamentos[b.id];
  p.agendamentos[b.id] = {
    ...p.agendamentos[b.id], ...b,
    recebidoEm: jaTinha ? p.agendamentos[b.id].recebidoEm : new Date().toISOString(),
  };
  savePainel(p);
  console.log(`[painel] agendamento ${b.id} — ${b.clientName || '?'} · ${b.dateLabel || '?'} ${b.time || ''} (${b.payMethod || '?'})`);
  res.json({ ok: true });
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

    // garante que o agendamento aparece no painel do barbeiro
    const pPainel = loadPainel();
    if (!pPainel.agendamentos[bookingId]) {
      pPainel.agendamentos[bookingId] = {
        id: bookingId, clientName: clientName || '', clientPhone: (req.body || {}).clientPhone || '',
        serviceName: serviceName || '', dateLabel: dateLabel || '', time: time || '',
        payMethod: 'pix', pixStatus: 'aguardando',
        createdAt: new Date().toISOString(), recebidoEm: new Date().toISOString(),
      };
      savePainel(pPainel);
    }

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
      // marca pago no painel do barbeiro tambem (e no canal direto)
      const pPainel = loadPainel();
      if (pPainel.agendamentos[bookingId]) {
        pPainel.agendamentos[bookingId].pixStatus = 'pago';
        pPainel.agendamentos[bookingId].status = 'confirmado';
        savePainel(pPainel);
      }
      publicarCanal({ t: 'p', b: { id: bookingId, pixStatus: 'pago', status: 'confirmado' } });
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
