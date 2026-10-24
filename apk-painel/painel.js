// ============================================================
//  PAINEL DO BARBEIRO — Barbearia do Jota
//
//  - mostra TODOS os agendamentos que chegam do site
//  - o barbeiro liga/desliga (aberto/fechado) e muda os horarios
//    (abre as / fecha as) para o que quiser — o site obedece
//  - apito/vibra quando chega agendamento novo
//
//  Funciona junto com o servidor do computador (backend/server.js).
//  O celular precisa estar na mesma rede do PC (ou o servidor
//  publicado na internet).
// ============================================================

const CONFIG = {
  APP_VERSION: '1.0.11',

  // mesmo repositorio do app da barbearia; os APK do painel
  // sao anexados nas releases com nome comecando por "Painel"
  GITHUB_USER: 'Surtadoo',
  GITHUB_REPO: 'barbearia-do-jota',
  ASSET_PREFIX: 'Painel',

  BARBER_NAME: 'Barbearia do Jota',

  // endereco(s) do servidor no PC. O mesmo usado pelo site.
  API_BASES: [
    'http://localhost:3001',
    'http://192.168.1.73:3001',
  ],

  // PIN padrao (voce pode trocar aqui e no Ajustes do Painel;
  // para valer de verdade troque também no backend/.env PIN_PAINEL)
  PIN: '1234',
};

const LS_SRV = 'painel_servidor_v1';
const LS_PIN = 'painel_pin_v1';
const LS_ADIA = 'painel_update_adiado';

const $ = (id) => document.getElementById(id);
const BRL = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

// ---------- chamada ao servidor ----------
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
//  LISTA DE AGENDAMENTOS
// ============================================================
let verAntes = new Set();
let primeiraVez = true;

function rotuloPagamento(b) {
  if (b.payMethod === 'pix') {
    if (b.pixStatus === 'pago') return ['💰 Sinal PAGO', 'pago'];
    return ['⏳ Sinal aguardando', 'espera'];
  }
  if (b.payMethod === 'dinheiro') return ['💵 Dinheiro no local', 'dinheiro'];
  return ['·', 'dinheiro'];
}

function cardAg(b) {
  const [rotulo, classe] = rotuloPagamento(b);
  const digits = String(b.clientPhone || '').replace(/\D/g, '');
  const wpp = digits ? `https://wa.me/55${digits.length <= 11 ? '55' + digits : digits}?text=${encodeURIComponent('Olá! Sobre seu agendamento na Barbearia do Jota.')}` : null;
  return `<div class="ag" data-id="${b.id}">
    <div class="ag-ico">💈</div>
    <div>
      <b>${b.time || ''} — ${b.serviceName || ''}</b>
      <small>${b.dateLabel || ''} · ${b.clientName || ''}${b.note ? ' — "' + String(b.note).slice(0, 60) + '"' : ''}</small>
      ${wpp ? `<a class="wpp-mini" href="${wpp}" target="_blank" rel="noopener">📞 Falar no WhatsApp</a>` : ''}
    </div>
    <div class="ag-lado">
      <span class="${classe}">${rotulo}</span>
      <small>${b.price ? BRL(b.price) : ''}</small>
    </div>
  </div>`;
}

function pintarLista(agendamentos) {
  const box = $('listaAg');
  if (!agendamentos.length) {
    box.innerHTML = '<div class="vazio">Nenhum agendamento ainda.<br>Quando alguém agendar no site, aparece aqui.</div>';
    return;
  }
  box.innerHTML = agendamentos.map(cardAg).join('');
}

function vibrar() {
  try { navigator.vibrate && navigator.vibrate([300, 120, 300]); } catch { /* fora */ }
}

async function atualizarPainel() {
  try {
    const d = await chamarApi('/api/painel?pin=' + encodeURIComponent(pinAtual()));
    pintarStatus(d);
    pintarLista(d.agendamentos || []);

    // chegou agendamento novo? avisa com vibracao
    const agora = new Set((d.agendamentos || []).map((b) => b.id));
    if (!primeiraVez) {
      const novos = (d.agendamentos || []).filter((b) => !verAntes.has(b.id));
      if (novos.length) {
        vibrar();
        toast(`📋 ${novos.length === 1 ? 'Novo agendamento' : novos.length + ' agendamentos novos'} — ${novos[0].clientName || ''} ${novos[0].time || ''}`);
        // marca os novos cards
        for (const n of novos) {
          const el = document.querySelector(`.ag[data-id="${n.id}"]`);
          if (el) { el.classList.add('novo'); setTimeout(() => el.classList.remove('novo'), 15000); }
        }
      }
    }
    verAntes = agora;
    primeiraVez = false;
  } catch (e) {
    $('listaAg').innerHTML = '<div class="vazio">⚠️ Servidor fora do ar.<br>Ligue o computador (iniciar-tudo.bat) ou confira o endereço em ⚙️ Ajustes.<br><small>' + (e && e.message ? e.message : '') + '</small></div>';
    $('stAviso').textContent = 'Sem conexão com o servidor.';
  }
}

// ============================================================
//  ABERTO / FECHADO + HORARIOS
// ============================================================
function pintarStatus(d) {
  const st = d.status || {};
  const aberto = !!d.aberto;
  const g = $('stGrande');
  g.className = 'st-grande ' + (aberto ? 'ok' : 'no');
  g.textContent = aberto ? '🟢 ABERTO' : '🔴 FECHADO';

  const sub = [];
  if (st.modo === 'manual') sub.push(st.aberto === false ? 'fechado a força pelo barbeiro' : 'aberto a força pelo barbeiro');
  if (st.abreAs && st.fechaAs) sub.push(`janela ${st.abreAs} às ${st.fechaAs}`);
  $('stAviso').textContent = 'Você escolhe: ' + sub.join(' · ');

  // marca o modo ativo
  $('mAuto').classList.toggle('on', st.modo !== 'manual');
  $('mAberto').classList.toggle('on', st.modo === 'manual' && st.aberto !== false);
  $('mFechado').classList.toggle('on', st.modo === 'manual' && st.aberto === false);

  if (st.abreAs) $('inpAbre').value = st.abreAs;
  if (st.fechaAs) $('inpFecha').value = st.fechaAs;
}

async function mandarStatus(corpo) {
  try {
    const r = await chamarApi('/api/painel/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinAtual(), ...corpo }),
    });
    if (r && r.error === undefined) {
      pintarStatus({ status: r.status, aberto: r.aberto });
      toast('✅ Atualizado no site!');
    }
  } catch (e) {
    toast('❌ Não consegui falar com o servidor.');
  }
}

$('mAuto').onclick = () => mandarStatus({ modo: 'auto' });
$('mAberto').onclick = () => mandarStatus({ modo: 'manual', aberto: true });
$('mFechado').onclick = () => mandarStatus({ modo: 'manual', aberto: false });
$('btnSalvarHoras').onclick = () => mandarStatus({ abreAs: $('inpAbre').value, fechaAs: $('inpFecha').value });

// ============================================================
//  AJUSTES (servidor + PIN)
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
    $('cfgAviso').textContent = '✅ Conectado! Tudo funcionando.';
    pintarStatus(r);
    toast('✅ Salvo!');
    setTimeout(() => $('modalCfg').classList.add('hidden'), 800);
  } catch (e) {
    $('cfgAviso').textContent = e.status === 401
      ? '❌ Chegou no servidor, mas o PIN está errado.'
      : '❌ O servidor não responde. Ligue o PC (iniciar-tudo.bat) e confira o endereço.';
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
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--gold);color:#111;font-weight:800;padding:12px 18px;border-radius:12px;z-index:99;box-shadow:0 6px 24px rgba(0,0,0,.45);max-width:90vw;text-align:center';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(timerToast);
  timerToast = setTimeout(() => { t.style.display = 'none'; }, 4000);
}

// ============================================================
//  ATUALIZACAO DO APLICATIVO (mesma mecanica do app do site,
//  mas baixa o APK cujo nome comeca por "Painel")
// ============================================================
function repoSalvo() {
  if (CONFIG.GITHUB_USER && CONFIG.GITHUB_REPO) return { user: CONFIG.GITHUB_USER, repo: CONFIG.GITHUB_REPO };
  return null;
}
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
  const r = repoSalvo();
  if (!r) return null;
  try {
    const resp = await fetch(`https://api.github.com/repos/${r.user}/${r.repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
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
  atualizarPainel();
  // a lista se atualiza sozinha a cada 5 segundos
  setInterval(atualizarPainel, 5000);
  // ao voltar para o app, atualiza na hora
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') atualizarPainel();
  });
  // procura versao nova so dentro do APK
  const ehApk = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (ehApk) {
    setTimeout(() => checarAtualizacao({ silencioso: true }), 1000);
    setInterval(() => checarAtualizacao({ silencioso: true }), 2 * 60 * 1000);
  }
  document.title = 'Painel — ' + CONFIG.BARBER_NAME;
});
