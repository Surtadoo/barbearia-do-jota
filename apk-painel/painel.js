// ============================================================
//  PAINEL DO BARBEIRO — Barbearia do Jota
//
//  ESTA TELA TEM 3 COISAS, DE CIMA PARA BAIXO:
//   1. ESTOU ABERTO / ESTOU FECHADO  (entra na hora no app do cliente)
//   2. Horário de funcionamento      (abre as / fecha as)
//   3. Agendamentos que chegam sozinhos pela internet
//
//  Os agendamentos chegam DIRETO do aplicativo "Barbearia do Jota"
//  pelo canal ntfy (internet). O computador NAO precisa estar ligado.
//  Ele serve apenas como EXTRA: confirmacao automatica do Pix e backup.
//  Tudo fica SALVO neste aparelho — fechar o app nao perde nada.
// ============================================================

const CONFIG = {
  APP_VERSION: '1.0.13',

  // Repositório do GitHub onde os APK são publicados.
  GITHUB_USER: 'Surtadoo',
  GITHUB_REPO: 'barbearia-do-jota',
  ASSET_PREFIX: 'Painel',

  BARBER_NAME: 'Barbearia do Jota',

  // Servidores no PC — OPCIONAIS (so Pix automatico e backup)
  API_BASES: [
    'http://localhost:3001',
    'http://192.168.1.73:3001',
  ],

  // PIN padrão (troque também no backend/.env PIN_PAINEL)
  PIN: '1234',
};

// Canal DIRETO entre o app do cliente e este Painel (ntfy — grátis).
// TEM que ser o MESMO nome nos dois apps. Trocar aqui = trocar lá também.
CONFIG.NTFY_URL = 'https://ntfy.sh';
CONFIG.NTFY_TOPIC = 'bjota-ag-7k2m9xI';

const LS_SRV = 'painel_servidor_v1';
const LS_PIN = 'painel_pin_v1';
const LS_ADIA = 'painel_update_adiado';
const LS_AG = 'painel_agendamentos_v1';   // agendamentos salvos no aparelho
const LS_ST = 'painel_status_v1';          // ultimo status aberto/fechado

const $ = (id) => document.getElementById(id);
const BRL = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const minutosDe = (t) => { const [h, m] = String(t || '09:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); };

// ---------- chamada ao servidor do PC (opcional) ----------
let apiBaseAtual = null;

function servidores() {
  const salvo = (localStorage.getItem(LS_SRV) || '').trim().replace(/\/+$/, '');
  return salvo ? [salvo, ...CONFIG.API_BASES] : CONFIG.API_BASES;
}

async function tentarFetch(base, rota, opcoes, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${base}${rota}`, { ...(opcoes || {}), signal: ctrl.signal });
    if (!r.ok) {
      const erro = new Error(`HTTP ${r.status}`);
      erro.status = r.status;
      try { erro.dados = await r.json(); } catch { /* sem corpo */ }
      throw erro;
    }
    return await r.json();
  } finally { clearTimeout(t); }
}

async function chamarApi(rota, opcoes) {
  const lista = apiBaseAtual ? [apiBaseAtual, ...servidores()] : servidores();
  let ultimoErro = null;
  for (const base of lista) {
    try {
      const dados = await tentarFetch(base, rota, opcoes, 12000);
      apiBaseAtual = base;
      return dados;
    } catch (e) { ultimoErro = e; }
  }
  throw ultimoErro || new Error('servidor nao encontrado');
}

const pinAtual = () => (localStorage.getItem(LS_PIN) || CONFIG.PIN).trim();

// ============================================================
//  1. STATUS: ABERTO OU FECHADO (o mais importante)
// ============================================================
function statusIniciado() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_ST) || 'null');
    if (s && s.modo) return s;
  } catch { /* primeiro uso */ }
  return { modo: 'auto', aberto: null, abreAs: '09:00', fechaAs: '21:00', ts: 0 };
}
let statusLoja = statusIniciado();

// esta aberto AGORA? (manual vale a palavra do barbeiro; auto vale o horario)
function calcularAbertoAgora(st) {
  if (!st) return false;
  if (st.modo === 'manual') return st.aberto !== false;
  const agora = new Date();
  if (agora.getDay() === 1) return false; // segunda fechado
  const mins = agora.getHours() * 60 + agora.getMinutes();
  return mins >= minutosDe(st.abreAs) && mins <= minutosDe(st.fechaAs);
}

// pinta a tela com o status atual
function pintarStatus() {
  const aberto = calcularAbertoAgora(statusLoja);
  const g = $('stGrande');
  if (g) {
    g.className = 'st-grande ' + (aberto ? 'ok' : 'no');
    g.textContent = aberto ? '🟢 ABERTO' : '🔴 FECHADO';
  }
  const aviso = $('stAviso');
  if (aviso) {
    let texto = '';
    if (statusLoja.modo === 'manual') {
      texto = 'Você escolheu à mão. Vale até você mudar aqui.';
    } else {
      texto = `Horário automático: ${statusLoja.abreAs || '09:00'} às ${statusLoja.fechaAs || '21:00'} (segunda fechado).`;
    }
    aviso.textContent = texto;
  }
  if ($('mAuto')) $('mAuto').classList.toggle('on', statusLoja.modo !== 'manual');
  if ($('mAberto')) $('mAberto').classList.toggle('on', statusLoja.modo === 'manual' && statusLoja.aberto !== false);
  if ($('mFechado')) $('mFechado').classList.toggle('on', statusLoja.modo === 'manual' && statusLoja.aberto === false);
  if ($('inpAbre') && statusLoja.abreAs) $('inpAbre').value = statusLoja.abreAs;
  if ($('inpFecha') && statusLoja.fechaAs) $('inpFecha').value = statusLoja.fechaAs;
}

// marcar o status: salva aqui, avisa os clientes PELA INTERNET e
// (se estiver ligado) avisa o servidor do PC tambem
async function mandarStatus(corpo) {
  statusLoja = {
    modo: corpo.modo || statusLoja.modo,
    aberto: corpo.aberto === undefined ? statusLoja.aberto : !!corpo.aberto,
    abreAs: corpo.abreAs || statusLoja.abreAs || '09:00',
    fechaAs: corpo.fechaAs || statusLoja.fechaAs || '21:00',
    ts: Date.now(),
  };
  try { localStorage.setItem(LS_ST, JSON.stringify(statusLoja)); } catch { /* ignora */ }
  pintarStatus();
  publicarCanal({ t: 's', s: statusLoja });   // <- chega NO HORA no app do cliente
  try {
    await chamarApi('/api/painel/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinAtual(), ...corpo }),
    });
    toast('✅ Salvo! O site já atualizou.');
  } catch {
    toast('✅ Salvo! (PC desligado — mesmo assim funciona)');
  }
}

$('mAberto').onclick = () => mandarStatus({ modo: 'manual', aberto: true });
$('mFechado').onclick = () => mandarStatus({ modo: 'manual', aberto: false });
$('mAuto').onclick = () => mandarStatus({ modo: 'auto' });
$('btnSalvarHoras').onclick = () => mandarStatus({ abreAs: $('inpAbre').value, fechaAs: $('inpFecha').value });

// ============================================================
//  2. AGENDAMENTOS (salvos no aparelho — nada se perde)
// ============================================================
function lerLocais() {
  try { return JSON.parse(localStorage.getItem(LS_AG) || '{}'); }
  catch { return {}; }
}
function salvarLocais(obj) {
  try { localStorage.setItem(LS_AG, JSON.stringify(obj)); } catch { /* cheio, ignora */ }
}

// registra/agrupa um agendamento que chegou
function registrar(b, { avisaNovo = true } = {}) {
  if (!b || !b.id || typeof b.id !== 'string') return 'nao';
  const loc = lerLocais();
  const atual = loc[b.id];
  let novo = false;
  if (!atual) {
    novo = true;
    loc[b.id] = b;
  } else if (b.pixStatus === 'pago' && atual.pixStatus !== 'pago') {
    loc[b.id] = { ...atual, ...b, pixStatus: 'pago', status: b.status || atual.status };
  } else if (String(b.createdAt || '') >= String(atual.createdAt || '')) {
    loc[b.id] = { ...atual, ...b };
  }
  salvarLocais(loc);
  if (novo && avisaNovo) {
    vibrar();
    toast(`📋 Novo agendamento!\n${b.clientName || ''} — ${b.time || ''} ${b.dateLabel || ''}`);
    pintarLista();
  }
  return novo ? 'novo' : 'atualizou';
}

function listaAtual() {
  return Object.values(lerLocais()).sort((a, b) => {
    const da = `${a.dateKey || ''} ${a.time || ''}`;
    const db = `${b.dateKey || ''} ${b.time || ''}`;
    if (da === db) return (b.createdAt || '').localeCompare(a.createdAt || '');
    return da > db ? 1 : -1;
  });
}

// ---------- pinta a lista com grupos por dia ----------
function racharDia(b) {
  const chaveDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hoje = new Date();
  const amanha = new Date(); amanha.setDate(hoje.getDate() + 1);
  if (b.dateKey === chaveDia(hoje)) return 'HOJE';
  if (b.dateKey === chaveDia(amanha)) return 'AMANHÃ';
  return (b.dateLabel || b.dateKey || '').replace(/,/g, '');
}

function badgePagamento(b) {
  if (b.payMethod === 'pix') {
    if (b.pixStatus === 'pago') return ['💰 Sinal pago', 'pago'];
    return ['⏳ Sinal pendente', 'espera'];
  }
  return ['💵 Pago no local (dinheiro)', 'dinheiro'];
}

function cardAg(b) {
  const [rotulo, classe] = badgePagamento(b);
  const digits = String(b.clientPhone || '').replace(/\D/g, '');
  const wpp = digits ? `https://wa.me/55${digits.length <= 11 ? '55' + digits : digits}?text=${encodeURIComponent('Olá! Sobre seu agendamento na Barbearia do Jota.')}` : null;
  const obs = b.note ? `<small>💬 "${esc(String(b.note).slice(0, 80))}"</small>` : '';
  return `<div class="ag">
    <div class="ag-hora">${esc(b.time) || '--:--'}</div>
    <div class="ag-meio">
      <b>${esc(b.clientName) || '?'}</b>
      <small>✂️ ${esc(b.serviceName)}</small>
      <small>📅 ${esc(b.dateLabel) || esc(b.dateKey)}</small>
      ${obs}
      ${wpp ? `<a class="wpp-mini" href="${wpp}" target="_blank" rel="noopener">📞 Falar no WhatsApp</a>` : ''}
    </div>
    <div class="ag-lado">
      <span class="badge ${classe}">${rotulo}</span>
      <span class="preco">${b.price ? BRL(b.price) : ''}</span>
    </div>
  </div>`;
}

function pintarLista() {
  const box = $('listaAg');
  if (!box) return;
  const lista = listaAtual();
  const hoje = lista.filter((b) => racharDia(b) === 'HOJE');
  if ($('agContador')) {
    $('agContador').textContent = lista.length
      ? `${hoje.length} hoje · ${lista.length} no total`
      : '';
  }
  if (!lista.length) {
    box.innerHTML = '<div class="vazio">Ninguém agendou ainda.<br>Quando um cliente agendar no aplicativo, <b>aparece aqui e o celular vibra</b>.</div>';
    return;
  }
  let html = '';
  let ultimoGrupo = null;
  for (const b of lista) {
    const g = racharDia(b);
    if (g !== ultimoGrupo) {
      html += `<div class="grupo">📅 ${g}</div>`;
      ultimoGrupo = g;
    }
    html += cardAg(b);
  }
  box.innerHTML = html;
}

// ============================================================
//  CANAL DIRETO ntfy — agendamentos entram SOZINHOS aqui
// ============================================================
let sse = null;
let canalOk = false;
let anunciouStatus = false;

function publicarCanal(corpo) {
  try {
    fetch(`${CONFIG.NTFY_URL}/${CONFIG.NTFY_TOPIC}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(corpo),
    }).catch(() => {});
  } catch { /* ignora */ }
}

function ligarCanal() {
  try { if (sse) sse.close(); } catch { /* nada */ }
  try {
    sse = new EventSource(`${CONFIG.NTFY_URL}/${CONFIG.NTFY_TOPIC}/sse`);
    sse.onopen = () => {
      canalOk = true;
      const aviso = $('stAviso');
      // ao abrir o canal, avisa os clientes "sou eu, o status atual e este"
      if (!anunciouStatus) {
        anunciouStatus = true;
        setTimeout(() => publicarCanal({ t: 's', s: { ...statusLoja, ts: statusLoja.ts || Date.now() } }), 900);
      }
      if (aviso && !aviso.textContent) pintarStatus();
    };
    sse.onerror = () => { canalOk = false; };
    sse.onmessage = (ev) => {
      let m = null, p = null;
      try { m = JSON.parse(ev.data); if (m.event !== 'message' || !m.message) return; } catch { return; }
      try { p = JSON.parse(m.message); } catch { return; }
      if (p.t === 'b' && p.b) registrar(p.b, { avisaNovo: true });        // agendamento novo do app do cliente
      else if (p.t === 'p' && p.b) registrar(p.b, { avisaNovo: false });  // sinal do Pix caiu
      else if (p.t === 's' && p.s && Number(p.s.ts || 0) > Number(statusLoja.ts || 0)) {
        // outro aparelho com o PAINEL mudou o status — reflete aqui também
        statusLoja = p.s;
        try { localStorage.setItem(LS_ST, JSON.stringify(statusLoja)); } catch { /* ignora */ }
        pintarStatus();
      }
    };
  } catch { /* sem internet — tenta de novo na proxima volta */ }
}

function vibrar() {
  try { navigator.vibrate && navigator.vibrate([300, 120, 300]); } catch { /* fora */ }
}

// ============================================================
//  SERVIDOR DO PC (EXTRA): pega o estado central do Pix pago
// ============================================================
async function atualizarPainel() {
  try {
    const d = await chamarApi('/api/painel?pin=' + encodeURIComponent(pinAtual()));
    // os agendamentos centrais entram (sem vibrar; o vibrar e so para NOVOS do canal)
    for (const b of (d.agendamentos || [])) registrar(b, { avisaNovo: false });
  } catch {
    // sem PC: sem problema, o canal da internet cobre a lista
  }
  pintarLista();
}

// ============================================================
//  AJUSTES (PIN + servidor do PC opcional)
// ============================================================
$('btnCfg').onclick = () => {
  $('painelVersao').textContent = CONFIG.APP_VERSION;
  $('inpServidorPainel').value = (localStorage.getItem(LS_SRV) || '').trim();
  $('inpPin').value = pinAtual();
  $('cfgAviso').textContent = '—';
  $('modalCfg').classList.remove('hidden');
};
$('btnFecharCfg').onclick = () => $('modalCfg').classList.add('hidden');
$('btnSalvarCfg').onclick = async () => {
  const srv = $('inpServidorPainel').value.trim().replace(/\/+$/, '');
  const pin = $('inpPin').value.trim() || CONFIG.PIN;
  localStorage.setItem(LS_SRV, srv);
  localStorage.setItem(LS_PIN, pin);
  apiBaseAtual = null;
  $('cfgAviso').textContent = 'Testando...';
  try {
    const r = await chamarApi('/api/painel?pin=' + encodeURIComponent(pin));
    $('cfgAviso').textContent = '✅ Servidor do PC conectado (opcional, só para o Pix).';
    for (const b of (r.agendamentos || [])) registrar(b, { avisaNovo: false });
    toast('✅ Salvo!');
    setTimeout(() => $('modalCfg').classList.add('hidden'), 900);
  } catch (e) {
    $('cfgAviso').textContent = '⚠️ (Tudo bem—os agendamentos chegam pela internet mesmo assim.) ' + (e.status === 401 ? 'PIN errado.' : 'PC não responde.');
  }
};

// ============================================================
//  TOAST
// ============================================================
let timerToast = null;
function toast(msg) {
  let t = $('toastPainel');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toastPainel';
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--gold);color:#111;font-weight:800;padding:12px 18px;border-radius:12px;z-index:99;box-shadow:0 6px 24px rgba(0,0,0,.45);max-width:90vw;text-align:center;white-space:pre-line';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(timerToast);
  timerToast = setTimeout(() => { t.style.display = 'none'; }, 4000);
}

// correcao de texto com < > "
const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ============================================================
//  ATUALIZACAO DO APLICATIVO (baixa o APK "Painel-vX.X.X.apk")
// ============================================================
function versaoParaNumero(v) {
  return String(v || '0').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
}
function versaoEhMaior(nova, atual) {
  const a = versaoParaNumero(nova);
  const b = versaoParaNumero(atual);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}
async function checarAtualizacao({ silencioso = true } = {}) {
  try {
    const resp = await fetch(`https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!resp.ok) throw new Error(`GitHub ${resp.status}`);
    const rel = await resp.json();
    if (!rel || !rel.tag_name) return null;
    const nova = String(rel.tag_name).replace(/^v/i, '');
    const notas = String(rel.body || '');
    const forcar = /\[FORCAR\]|\[FORCE\]/i.test(notas);
    if (!forcar && !versaoEhMaior(nova, CONFIG.APP_VERSION)) return null;
    const adiado = Number(localStorage.getItem(LS_ADIA) || 0);
    if (!forcar && silencioso && adiado > Date.now() - 5 * 60 * 1000) return null;
    const asset = (rel.assets || []).find((a) => new RegExp('^' + CONFIG.ASSET_PREFIX + '.*\\.apk$', 'i').test(a.name));
    mostrarAtualizacao(nova, notas, asset, forcar);
    return nova;
  } catch (e) {
    console.warn('[painel-update] ', e.message);
    if (!silencioso) $('updStatus').textContent = 'Não consegui checar: ' + e.message;
    return null;
  }
}
function mostrarAtualizacao(versao, notas, asset, forcar) {
  $('updVersao').textContent = `Nova versão: ${versao}`;
  $('updAtual').textContent = `Você está na versão ${CONFIG.APP_VERSION}`;
  $('updNotas').innerHTML = notas ? notas.replace(/</g, '&lt;').replace(/\n/g, '<br>') : 'Correções e melhorias nesta versão.';
  const url = asset ? asset.browser_download_url : 'https://github.com/' + CONFIG.GITHUB_USER + '/' + CONFIG.GITHUB_REPO + '/releases';
  $('btnAtualizar').textContent = '⬇️ Atualizar agora';
  $('btnAtualizar').disabled = false;
  $('btnAtualizar').onclick = () => baixarEInstalar(url);
  $('btnDepois').textContent = forcar ? 'Fechar' : 'Depois';
  $('btnDepois').onclick = () => {
    if (forcar) { $('modalUpdate').classList.add('hidden'); return; }
    localStorage.setItem(LS_ADIA, String(Date.now()));
    $('modalUpdate').classList.add('hidden');
  };
  $('modalUpdate').classList.remove('hidden');
}
function baixarEInstalar(url) {
  if (!url) return;
  localStorage.removeItem(LS_ADIA);
  const nativo = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.ApkUpdate;
  if (!nativo) { window.open(url, '_blank', 'noopener'); return; }
  $('updNotas').textContent = 'Baixando a atualização. Ela será instalada em seguida...';
  $('btnAtualizar').disabled = true;
  $('btnAtualizar').textContent = '⏳ Baixando...';
  nativo.instalar({ url })
    .then(() => {
      $('btnAtualizar').textContent = '📥 Abrir pasta de downloads';
      $('btnAtualizar').disabled = false;
      $('btnAtualizar').onclick = () => nativo.abrirDownloads().catch(() => {});
      $('updNotas').textContent = 'Download iniciado. Se a instalação não abrir sozinha, toque no arquivo na pasta Downloads.';
    })
    .catch((e) => {
      $('btnAtualizar').disabled = false;
      $('btnAtualizar').textContent = '⬇️ Atualizar agora';
      $('btnAtualizar').onclick = () => baixarEInstalar(url);
      $('updNotas').textContent = 'Não consegui baixar: ' + (e && e.message ? e.message : 'erro') + '. Tente de novo com a internet ligada.';
    });
}
$('btnVerificarUpdate').onclick = async () => {
  $('updStatus').textContent = 'Procurando...';
  $('modalCfg').classList.add('hidden');
  const achou = await checarAtualizacao({ silencioso: false });
  if (!achou && document.getElementById('modalUpdate').classList.contains('hidden')) {
    $('updStatus').textContent = `Você está na versão mais recente (${CONFIG.APP_VERSION}).`;
    $('modalCfg').classList.remove('hidden');
  }
};

// ============================================================
//  INICIO
// ============================================================
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  pintarStatus();       // status salvo aparece na hora
  pintarLista();        // agendamentos salvos aparecem na hora
  atualizarPainel();    // (extra: estado do Pix vindo do PC)
  ligarCanal();         // canal da internet: agendamentos ENTAM sozinhos
  setInterval(atualizarPainel, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pintarLista();
      atualizarPainel();
      // reavisa os clientes do status atual (cobre desconexoes longas)
      publicarCanal({ t: 's', s: { ...statusLoja, ts: statusLoja.ts || Date.now() } });
    }
  });
  document.title = 'Painel — ' + CONFIG.BARBER_NAME;
  // procura versao nova so dentro do APK
  const ehApk = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (ehApk) {
    setTimeout(() => checarAtualizacao({ silencioso: true }), 1000);
    setInterval(() => checarAtualizacao({ silencioso: true }), 2 * 60 * 1000);
  }
});
