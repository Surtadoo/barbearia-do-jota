// ===== CONFIG CENTRAL — edite aqui =====
const CONFIG = {
  // Versão do aplicativo. Aumente este número toda vez que publicar um APK novo.
  APP_VERSION: '1.0.02',

  // Repositório do GitHub onde os APK são publicados.
  // Precisa ser PUBLICO, senão o aplicativo não consegue ler as versões.
  GITHUB_USER: 'Surtadoo',
  GITHUB_REPO: 'barbearia-do-jota',

  BARBER_NAME: 'Barbearia do Jota',
  BARBER_ADDRESS: 'Rua Javata, 1506 - Anchieta',
  BARBER_WHATSAPP: '5521990772663', // +55 21 99077-2663 (só dígitos)

  // Endereço do servidor que confere o Pix.
  // No computador: http://localhost:3001
  // No celular / APK: troque localhost pelo IP do PC na mesma rede (ex.: http://192.168.1.73:3001)
  // Se publicar o backend na internet, cole aqui o endereço https://... e apague os de baixo.
  API_BASES: [
    'http://localhost:3001',
    'http://192.168.1.73:3001',
  ],
  SIGNAL_VALUE: 10.00,
  // Chave Pix cadastrada na InfinitePay (chave aleatória)
  PIX_KEY: 'c02767e5-8d53-44d2-a93f-ff3534b1b4ce',

  // Link fixo de pagamento do sinal. O site NAO cria cobranca nova:
  // o cliente paga nesse link e o servidor so confere se o dinheiro caiu.
  PIX_LINK: 'https://link.infinitepay.io/yago-assumpcao-y9d/VC1B-ZROqZmZFD4-10,00',
  CLOSED_WEEKDAY: 1,
  ABOUT: 'Na Barbearia do Jota, cuidar do visual é mais do que fazer um corte — é oferecer uma experiência de qualidade, com atendimento de respeito, praticidade e aquele cuidado que você merece.\n\nTrabalhamos com cortes modernos, barba na navalha e serviços pensados para deixar você sempre no estilo. Nosso objetivo é proporcionar um atendimento rápido, profissional e sem complicação.\n\nAqui você escolhe o serviço, o dia e o horário que deseja. Em poucos minutos, seu atendimento já fica agendado e você pode chegar à barbearia sabendo que sua vaga está garantida.\n\nSeu horário, do seu jeito\nChega de perder tempo esperando. Com nosso sistema de agendamento, você escolhe o melhor horário e já deixa tudo organizado antes de sair de casa.\n\nPagamento em dinheiro: a confirmação é feita diretamente pelo WhatsApp.\nPagamento via Pix: você paga um sinal de R$ 10,00 para garantir sua vaga. O valor do sinal é descontado do preço total do serviço.\n\nVaga garantida: após a confirmação do pagamento, seu horário fica reservado para você.\n\nOnde estamos\nBarbearia do Jota\nRua Javata, 1506 - Anchieta\n\nAtendimento: Terça a domingo, das 09h às 21h\nSegunda-feira: fechado\n\nVenha conhecer a Barbearia do Jota e tenha um atendimento de qualidade, com horário marcado e sem complicação.\n\nCorte certo, na hora certa.',
};

// ===== serviços =====
const SERVICES = [
  { id: 'corte', name: 'Corte normal', desc: 'só máquina', price: 30, duration: 60, icon: '✂️' },
  { id: 'corte-simples', name: 'Corte Simples', desc: 'Corte rápido e prático', price: 22, duration: 30, icon: '✂️' },
  { id: 'barba', name: 'Barba', desc: 'Barba completa com navalha', price: 15, duration: 30, icon: '🧔' },
  { id: 'cavanhaque', name: 'Cavanhaque', desc: 'Cavanhaque com navalha', price: 12, duration: 30, icon: '🪒' },
  { id: 'pe', name: 'Pé', desc: 'Fazer o pezinho do cabelo', price: 10, duration: 20, icon: '🦶' },
  { id: 'barba-retirar-tudo', name: 'Barba (retirar tudo)', desc: 'Remoção completa de barba', price: 12, duration: 30, icon: '🪒' },
  { id: 'sobrancelha', name: 'Sobrancelha', desc: 'Design + navalha', price: 7, duration: 15, icon: '🤨' },
  { id: 'pigmentacao', name: 'Pigmentação', desc: 'Pigmentação capilar', price: 15, duration: 30, icon: '🎨' },
  { id: 'pigmentacao-barba', name: 'Pigmentação na Barba', desc: 'Pigmentação na barba', price: 10, duration: 30, icon: '🎨' },
  { id: 'reflexo', name: 'Reflexo', desc: 'Reflexo com matização', price: 45, duration: 90, icon: '🎨' },
  { id: 'nevou', name: 'Nevou', desc: 'Efeito nevado nos cabelos', price: 50, duration: 90, icon: '❄️' },
  { id: 'corte-kids', name: 'Corte Kids', desc: 'Corte para crianças', price: 35, duration: 60, icon: '👦' },
];

const TIME_SLOTS = ['09:00','09:40','10:20','11:00','11:40','12:20','13:00','13:40','14:20','15:00','15:40','16:20','17:00','17:40','18:20','19:00','19:40','20:20','21:00'];
const LS_KEY = 'barbearia_bookings_v1';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];

const $ = (id) => document.getElementById(id);
const BRL = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
const getService = (id) => SERVICES.find((s) => s.id === id);
const getServices = (ids) => SERVICES.filter((s) => ids.includes(s.id));
const getTotalPrice = (ids) => ids.reduce((sum, id) => sum + (getService(id)?.price || 0), 0);
const getTotalDuration = (ids) => ids.reduce((sum, id) => sum + (getService(id)?.duration || 0), 0);
const pad = (n) => String(n).padStart(2, '0');
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
function parseKey(key) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); }
function fmtFull(key) { return parseKey(key).toLocaleDateString('pt-BR'); }
function dowOf(key) { return DIAS[parseKey(key).getDay()]; }
const signalOf = (price) => Math.min(Number(CONFIG.SIGNAL_VALUE) || 0, Number(price) || 0);

// ===== estado =====
let currentStep = 1;
let serviceIds = [];
let dayKey = null;
let time = null;
let name = '';
let phone = '';
let note = '';
let payMethod = 'dinheiro';
let pixBooking = null;
let mpPaymentId = null;
let pollTimer = null;
let viewY, viewM;

// ===== storage =====
function loadBookings() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}
function saveBookings(list) { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
function updateBooking(id, patch) {
  const list = loadBookings().map((b) => (b.id === id ? { ...b, ...patch } : b));
  saveBookings(list);
  return list.find((b) => b.id === id);
}
function bookingEnd(b) { const dur = getTotalDuration(b.serviceIds || [b.serviceId || 0]); return new Date(`${b.dateKey}T${b.time}:00`).getTime() + dur * 60000; }
function bookingHoldsSlot(b) {
  if (b.status === 'cancelado' || b.status === 'expirado') return false;
  return new Date() < bookingEnd(b);
}
function newId() { return 'BK' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90 + 10); }

// ===== whatsapp =====
function payLabel(b) {
  if (b.payMethod === 'pix') {
    const signal = signalOf(b.price); const rest = b.price - signal;
    if (b.pixStatus === 'pago') return `Pix sinal ${BRL(signal)} PAGO ✔ · restante ${BRL(rest)}`;
    if (b.pixStatus === 'aguardando') return `Pix sinal ${BRL(signal)} aguardando · restante ${BRL(rest)}`;
    return `Pix sinal ${BRL(signal)} · restante ${BRL(rest)}`;
  }
  return 'Dinheiro no local';
}
function buildMsg(b) {
  const signal = b.payMethod === 'pix' ? signalOf(b.price) : 0;
  const rest = b.price - signal;
  return [
    `💈 *${CONFIG.BARBER_NAME}* — Novo agendamento`,
    ``,
    `🔖 Código: ${b.id}`,
    `👤 Nome: ${b.clientName}`,
    `📞 WhatsApp: ${b.clientPhone}`,
    `✂️ Serviço: ${b.serviceName} — ${BRL(b.price)}`,
    `📅 Data: ${b.dateLabel} (${b.dow}) às ${b.time}`,
    b.note ? `📝 Observação: ${b.note}` : null,
    `💳 Pagamento: ${payLabel(b)}`,
    b.payMethod === 'pix' ? `💰 Total: ${BRL(b.price)} · Sinal: ${BRL(signal)} · Restante: ${BRL(rest)}` : `💰 Total no local: ${BRL(b.price)}`,
    b.mpPaymentId ? `🧾 MP: ${b.mpPaymentId}` : null,
    ``,
    `Aguardo confirmação! 🙏`,
  ].filter(Boolean).join('\n');
}
function openWhatsApp(booking) {
  const url = `https://wa.me/${String(CONFIG.BARBER_WHATSAPP).replace(/\D/g, '')}?text=${encodeURIComponent(buildMsg(booking))}`;
  window.open(url, '_blank');
}

// ===== ui helpers =====
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// a rolagem animada só funciona com a aba visível
const podeAnimar = () => document.visibilityState === 'visible' && typeof requestAnimationFrame === 'function';

// ===== rolagem suave (funciona em qualquer navegador) =====
function rolarPara(y) {
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const destino = Math.max(0, Math.min(Number(y) || 0, maxY));
  const inicio = window.pageYOffset;
  const dist = destino - inicio;
  if (Math.abs(dist) < 2) return;
  // aba oculta / sem animação: vai direto
  if (!podeAnimar()) {
    window.scrollTo(0, destino);
    return;
  }
  const dur = Math.min(600, Math.max(280, Math.abs(dist) * 0.45));
  const t0 = performance.now();
  const passo = (agora) => {
    const p = Math.min(1, (agora - t0) / dur);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    window.scrollTo(0, Math.round(inicio + dist * e));
    if (p < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

// ===== etapas =====
function irParaEtapas() {
  const barra = $('passos');
  if (!barra) return;
  const cabecalho = document.querySelector('.topbar');
  const folga = (cabecalho ? cabecalho.offsetHeight : 0) + 12;
  rolarPara(barra.getBoundingClientRect().top + window.pageYOffset - folga);
}

function showStep(n) {
  currentStep = n;
  document.querySelectorAll('.step').forEach((el) => el.classList.remove('active'));
  const id = n === 1 ? 'servicos' : n === 2 ? 'etapa-dia' : n === 3 ? 'etapa-hora' : n === 4 ? 'etapa-dados' : 'etapa-pix';
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.step-dot').forEach((el) => {
    const s = Number(el.dataset.s);
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
  });
  irParaEtapas();
}

// ===== serviços =====
function renderServices() {
  $('servicesGrid').innerHTML = SERVICES.map((s) => `
    <div class="card ${serviceIds.includes(s.id) ? 'selected' : ''}" data-id="${s.id}">
      <div class="icon">${s.icon}</div>
      <div><b>${s.name}</b><small>${s.desc} · ⏱ ${s.duration} min · ${BRL(s.price)}</small></div>
    </div>`).join('');
  document.querySelectorAll('#servicesGrid .card').forEach((el) =>
    el.onclick = () => {
      const id = el.dataset.id;
      if (serviceIds.includes(id)) {
        serviceIds = serviceIds.filter((i) => i !== id);
      } else {
        serviceIds.push(id);
      }
      el.classList.toggle('selected', serviceIds.includes(id));
      renderResume();
    });
}
function renderAll() { renderServices(); renderCalendar(); renderTimes(); renderPay(); renderResume(); }

// ===== calendário =====
function initCalendar() {
  const n = new Date();
  viewY = n.getFullYear(); viewM = n.getMonth();
  const d = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  while (d.getDay() === CONFIG.CLOSED_WEEKDAY) d.setDate(d.getDate() + 1);
  dayKey = toKey(d.getFullYear(), d.getMonth(), d.getDate());
  viewY = d.getFullYear(); viewM = d.getMonth();
}
function renderCalendar() {
  $('calTitle').textContent = `${MESES[viewM]} ${viewY}`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const first = new Date(viewY, viewM, 1);
  const lastDay = new Date(viewY, viewM + 1, 0).getDate();
  let html = '';
  for (let i = 0; i < first.getDay(); i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(viewY, viewM, d);
    const key = toKey(viewY, viewM, d);
    const closed = date.getDay() === CONFIG.CLOSED_WEEKDAY;
    const disabled = date < today || closed;
    const cls = 'cal-day' + (disabled ? ' disabled' : '') + (!disabled && key === dayKey ? ' selected' : '');
    html += '<div class="' + cls + '" data-key="' + key + '"><small>' + DIAS[date.getDay()] + '</small><b>' + d + '</b></div>';
  }
  $('daysRow').innerHTML = html;
  document.querySelectorAll('#daysRow .cal-day[data-key]:not(.disabled)').forEach((el) =>
    el.onclick = () => {
      if (dayKey === el.dataset.key) return;
      dayKey = el.dataset.key;
      time = null;
      renderCalendar();   // redesenha para atualizar o destaque do dia escolhido
      renderTimes();
      renderResume();
    });
}

// ===== horários (etapa 3) =====
async function renderTimes() {
  const box = $('timesGrid');
  if (!dayKey) { box.innerHTML = '<span class="tiny">Escolha um dia na etapa anterior.</span>'; return; }
  const now = new Date();
  const tkey = toKey(now.getFullYear(), now.getMonth(), now.getDate());
  const isToday = dayKey === tkey;
  const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 99999;
  const list = await loadBookings();
  box.innerHTML = TIME_SLOTS.map((t) => {
    const [h, m] = t.split(':').map(Number);
    const slotMinutes = h * 60 + m;
    const busy = list.some((b) => b.dateKey === dayKey && b.time === t && bookingHoldsSlot(b));
    const expired = isToday && slotMinutes < currentMinutes;
    if (expired) return '';
    return `<button class="slot ${t === time ? 'selected' : ''} ${busy ? 'busy' : ''}" ${busy ? 'disabled' : ''}>${t}</button>`;
  }).join('');
  box.querySelectorAll('.slot:not(.busy)').forEach((el) => {
    el.onclick = async () => {
      time = el.textContent;
      await renderTimes();
      renderResume();
    };
  });
  const hint = $('busyHint');
  const total = box.querySelectorAll('.slot').length;
  if (hint) {
    hint.textContent = !total
      ? 'Não há mais horários livres neste dia. Escolha outra data.'
      : isToday
        ? `Mostrando só os horários que ainda vão acontecer hoje. ${total} vaga(s) livre(s).`
        : `${total} horário(s) disponível(is) neste dia.`;
  }
}

// ===== pagamento / resume =====
function renderPay() {
  document.querySelectorAll('.payopt').forEach((el) => {
    const active = el.dataset.pay === payMethod;
    el.classList.toggle('selected', active);
    el.querySelector('.radio').textContent = active ? '●' : '○';
  });
  const isPix = payMethod === 'pix';
  $('boxDinheiro').classList.toggle('hidden', isPix);
  $('boxPix').classList.toggle('hidden', !isPix);
}

function renderResume() {
  const services = getServices(serviceIds);
  $('resumeService').textContent = services.map(s => `✂️ ${s.name}`).join(' · ');
  $('resumeWhen').textContent = `📅 ${dayKey ? fmtFull(dayKey) + ' (' + dowOf(dayKey) + ')' : '—'} às ${time || '—'}`;
  $('resumeClient').textContent = `👤 ${name || '—'} · 📞 ${phone || '—'}`;
  const total = getTotalPrice(serviceIds);
  const totalDuration = getTotalDuration(serviceIds);
  $('resumePrice').textContent = BRL(total);
  const isPix = payMethod === 'pix';
  const signal = signalOf(total);
  $('resumeDiscount').classList.toggle('hidden', !isPix);
  if (isPix) {
    $('resumeSignalValue').textContent = `− ${BRL(signal)}`;
    $('resumeRest').textContent = BRL(total - signal);
    $('resumeSignal').textContent = `Sinal de ${BRL(signal)} via Pix descontado do total · Restante de ${BRL(total - signal)} paga no local`;
  } else {
    $('resumeSignal').textContent = 'Pagamento total em dinheiro no local';
  }
}

// ===== validação =====
function collectOrToast() {
  if (serviceIds.length === 0) { toast('Escolha pelo menos um corte.'); return null; }
  if (name.trim().length < 3) { toast('Digite seu nome completo.'); return null; }
  if (phone.replace(/\D/g, '').length < 10) { toast('Digite seu WhatsApp com DDD.'); return null; }
  if (!dayKey) { toast('Escolha o dia.'); return null; }
  if (!time) { toast('Escolha a hora.'); return null; }
  return { name: name.trim(), phone: phone.trim(), note: note.trim() };
}

// ===== FLUXO DINHEIRO =====
async function confirmMoney() {
  const d = collectOrToast(); if (!d) return;
  const services = getServices(serviceIds);
  const booking = {
    id: newId(), serviceIds: serviceIds, serviceName: services.map(s => s.name).join(' + '), price: getTotalPrice(serviceIds),
    clientName: d.name, clientPhone: d.phone, note: d.note,
    dateKey: dayKey, dateLabel: fmtFull(dayKey), dow: dowOf(dayKey), time,
    payMethod: 'dinheiro', pixStatus: null, mpPaymentId: null,
    status: 'confirmado', createdAt: new Date().toISOString(),
  };
  const list = loadBookings(); list.unshift(booking); saveBookings(list);
  await renderTimes();
  toast('Agendamento salvo! Abrindo WhatsApp...');
  openWhatsApp(booking);
  showStep(1);
}

// ===== GERAÇÃO DO PIX (BR Code EMV com valor travado) =====
function tlv(id, value) {
  let v = String(value);
  return id + String(v.length).padStart(2, '0') + v;
}
function normalizeKey(key) {
  return String(key || '').replace(/\s+/g, '').trim();
}
function buildPixPayload(key, amount, txid) {
  const k = normalizeKey(key);
  if (!k) return '';
  const value = Number(amount).toFixed(2);
  const tx = String(txid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25).toUpperCase() || '***';

  // merchant account: chave aleatória / CPF-CNPJ / email / telefone
  let account;
  if (/^\+?[0-9]{10,14}$/.test(k)) {
    account = tlv('00', 'br.gov.bcb.pix') + tlv('01', k);
  } else if (/^[0-9]{11,14}$/.test(k)) {
    account = tlv('00', 'br.gov.bcb.pix') + tlv('01', k);
  } else if (k.includes('@')) {
    account = tlv('00', 'br.gov.bcb.pix') + tlv('01', k);
  } else {
    account = tlv('00', 'br.gov.bcb.pix') + tlv('01', k);
  }

  const mai =
    tlv('00', '01') +
    tlv('26', account) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', value) +
    tlv('58', 'BR') +
    tlv('59', CONFIG.BARBER_NAME.slice(0, 25)) +
    tlv('60', 'SAO PAULO') +
    tlv('62', tlv('05', tx));

  return mai + '6304' + crc16(mai + '6304');
}
function crc16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
// QR Code via serviço publico (funciona para qualquer app de banco).
// Se a imagem nao carregar, o copia-e-cola abaixo continua funcionando.
function showPixQr(payload) {
  const box = $('pixQrBox');
  if (!box) return;
  box.innerHTML = '';
  if (!payload) {
    box.innerHTML = '<span class="qr-msg">Use o código copia e cola ao lado</span>';
    return;
  }
  const src = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=' + encodeURIComponent(payload);
  const newImg = document.createElement('img');
  newImg.src = src;
  newImg.alt = 'QR Code Pix';
  newImg.onerror = () => {
    box.innerHTML = '<span class="qr-msg">Use o código copia e cola ao lado</span>';
  };
  box.appendChild(newImg);
}

// ===== FLUXO PIX: cria o agendamento e passa a conferir o pagamento =====
async function generatePixBooking() {
  const d = collectOrToast(); if (!d) return;
  const services = getServices(serviceIds);
  pixBooking = {
    id: newId(), serviceIds: serviceIds, serviceName: services.map(s => s.name).join(' + '), price: getTotalPrice(serviceIds),
    clientName: d.name, clientPhone: d.phone, note: d.note,
    dateKey: dayKey, dateLabel: fmtFull(dayKey), dow: dowOf(dayKey), time,
    payMethod: 'pix', pixStatus: 'aguardando', pixUrl: null,
    status: 'aguardando pagamento', createdAt: new Date().toISOString(),
  };
  const list = loadBookings(); list.unshift(pixBooking); saveBookings(list);
  showStep(5);
  renderPixArea();

  try {
    // o servidor cria a cobranca deste agendamento (ou usa o link fixo)
    const r = await avisarServidor(pixBooking);
    const link = (r && r.link) || (await buscarLink());
    if (!link) mostrarOffline('servidor nao devolveu o link de pagamento');
    else mostrarCobranca(link);
  } catch (e) {
    mostrarOffline(e.message);
  }
}

// Chave Pix precisa ser real (CPF, CNPJ, e-mail, telefone ou chave aleatória)
const PIX_KEY_OK = () => {
  const k = normalizeKey(CONFIG.PIX_KEY);
  return !!k && k !== 'sua-chave-pix-aqui' && !k.startsWith('COLOQUE');
};

// ============================================================
//  ATUALIZAÇÃO DO APLICATIVO
//
//  O APK pergunta no GitHub se existe uma versao nova.
//  Se tiver, mostra o popup com "Atualizar" e "Depois".
//
//  Para ligar, escreva no ⚙️ (campo "Repositorio"):
//     seu-usuario/barbearia-do-jota
//  ou preencha GITHUB_USER e GITHUB_REPO no topo deste arquivo.
// ============================================================
const LS_REPO = 'barbearia_repo_v1';
const LS_UPDATE_PARA = 'barbearia_update_adiado';

// "1.2.10" vira [1,2,10] para comparar numero por numero
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

// aceita "usuario/repo", "https://github.com/usuario/repo" ou ""
function repoSalvo() {
  const salvo = (localStorage.getItem(LS_REPO) || '').trim();
  if (salvo) {
    const partes = salvo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '').split('/');
    if (partes.length >= 2 && partes[0] && partes[1]) return { user: partes[0], repo: partes[1] };
  }
  if (CONFIG.GITHUB_USER && CONFIG.GITHUB_REPO) return { user: CONFIG.GITHUB_USER, repo: CONFIG.GITHUB_REPO };
  return null;
}

async function buscarUltimaVersao() {
  const r = repoSalvo();
  if (!r) return null;
  const url = `https://api.github.com/repos/${encodeURIComponent(r.user)}/${encodeURIComponent(r.repo)}/releases/latest`;
  const resp = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (resp.status === 404) {
    throw new Error('repositório não encontrado ou privado (404)');
  }
  if (resp.status === 403) {
    throw new Error('limite de consultas do GitHub atingido (403)');
  }
  if (!resp.ok) throw new Error(`GitHub respondeu ${resp.status}`);
  return await resp.json();
}

// explica o que precisa fazer quando o GitHub nao responde
function explicarErroGithub(erro, silencioso) {
  const msg = erro && erro.message ? erro.message : String(erro);
  const r = repoSalvo();
  const alvo = r ? `${r.user}/${r.repo}` : '(vazio)';

  if (/404/.test(msg)) {
    return 'Não achei o repositório ' + alvo + '.\n'
      + 'Ele precisa ser PÚBLICO no GitHub:\n'
      + 'Settings → Danger Zone → Change visibility → Public.\n'
      + 'E precisa existir uma Release (tag v1.0.0 ou maior).';
  }
  if (/403/.test(msg)) {
    return 'O GitHub bloqueou por excesso de consultas.\nTente de novo em alguns minutos.';
  }
  if (/Failed to fetch|NetworkError/i.test(msg)) {
    return 'O celular está sem internet.\nAs atualizações só funcionam com internet.';
  }
  if (!r) {
    return 'Nenhum repositório configurado.\\nPreencha em ⚙️ → Repositório do GitHub.';
  }
  return msg;
}

async function checarAtualizacao({ silencioso = true } = {}) {
  if (!repoSalvo()) {
    if (!silencioso) toast('Preencha o repositório do GitHub nos ajustes.');
    return null;
  }
  try {
    const rel = await buscarUltimaVersao();
    if (!rel || !rel.tag_name) return null;
    const nova = String(rel.tag_name).replace(/^v/i, '');
    if (!versaoEhMaior(nova, CONFIG.APP_VERSION)) return null;

    const adiado = Number(localStorage.getItem(LS_UPDATE_PARA) || 0);
    if (silencioso && adiado > Date.now() - 60 * 60 * 1000) return null;   // "Depois" lembra por 1 hora

    const asset = (rel.assets || []).find((a) => /\.apk$/i.test(a.name));
    mostrarAtualizacao(nova, rel, asset);
    return nova;
  } catch (e) {
    console.warn('[update] nao consegui checar:', e.message);
    if (!silencioso) mostrarAvisoUpdate(explicarErroGithub(e, silencioso));
    return null;
  }
}

// popup de aviso de problema (sem ser o de "atualizacao disponivel")
function mostrarAvisoUpdate(texto) {
  $('updVersao').textContent = 'Não consegui procurar atualização';
  $('updAtual').textContent = `Versão ${CONFIG.APP_VERSION}`;
  $('updNotas').innerHTML = String(texto).replace(/</g, '&lt;').replace(/\n/g, '<br>');
  $('btnAtualizar').onclick = () => {
    const r = repoSalvo();
    if (r) window.open(`https://github.com/${r.user}/${r.repo}/releases`, '_blank', 'noopener');
  };
  $('btnAtualizar').textContent = '🔗 Abrir o GitHub';
  $('btnDepois').onclick = () => $('modalUpdate').classList.add('hidden');
  $('modalUpdate').classList.remove('hidden');
}

function mostrarAtualizacao(versao, release, asset) {
  const notas = (release.body || '').trim().slice(0, 400);
  $('updVersao').textContent = `Versão ${versao} disponível`;
  $('updAtual').textContent = `Você está na versão ${CONFIG.APP_VERSION}`;
  $('updNotas').innerHTML = notas
    ? notas.replace(/</g, '&lt;').replace(/\n/g, '<br>')
    : 'Correções e melhorias nesta versão.';
  const link = asset ? asset.browser_download_url : release.html_url;
  $('btnAtualizar').textContent = '⬇️ Atualizar agora';
  $('btnAtualizar').onclick = () => {
    localStorage.removeItem(LS_UPDATE_PARA);
    window.open(link, '_blank', 'noopener');
  };
  $('btnDepois').onclick = () => {
    localStorage.setItem(LS_UPDATE_PARA, String(Date.now()));
    $('modalUpdate').classList.add('hidden');
  };
  $('modalUpdate').classList.remove('hidden');
}

// ============================================================
//  AJUSTES — o barbeiro troca o endereco do servidor pelo proprio
//  app, sem precisar refazer o APK. Fica salvo no aparelho.
// ============================================================
const LS_SERVIDOR = 'barbearia_servidor_v1';

function servidores() {
  const salvo = (localStorage.getItem(LS_SERVIDOR) || '').trim().replace(/\/+$/, '');
  return salvo ? [salvo, ...CONFIG.API_BASES] : CONFIG.API_BASES;
}

function abrirAjustes() {
  $('inpServidor').value = localStorage.getItem(LS_SERVIDOR) || CONFIG.API_BASES[0];
  $('inpRepo').value = localStorage.getItem(LS_REPO) || `${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}`.replace(/^\//, '');
  $('appVersao').textContent = CONFIG.APP_VERSION;
  const r = repoSalvo();
  $('updStatus').textContent = r
    ? `Repositório: ${r.user}/${r.repo}`
    : 'Sem repositório — atualizações automáticas desligadas.';
  $('ajustesStatus').textContent = apiBaseAtual
    ? `Conectado em ${apiBaseAtual}`
    : 'Ainda não testado';
  $('modalAjustes').classList.remove('hidden');
}

function fecharAjustes() { $('modalAjustes').classList.add('hidden'); }

async function testarServidor() {
  const valor = $('inpServidor').value.trim().replace(/\/+$/, '');
  if (!valor) return;
  $('ajustesStatus').textContent = 'Testando...';
  try {
    const r = await tentarFetch(valor, '/api/health', null, 8000);
    apiBaseAtual = valor;
    $('ajustesStatus').textContent = `✅ Conectado! Modo: ${r.modo || '-'} · Sinal: R$ ${Number(r.sinal || 10).toFixed(2)}`;
  } catch (e) {
    apiBaseAtual = null;
    $('ajustesStatus').textContent = `❌ Não respondeu (${e.message}). Confira o endereço e se o servidor está ligado.`;
  }
}

function salvarServidor() {
  const valor = $('inpServidor').value.trim().replace(/\/+$/, '');
  if (!valor) { toast('Digite o endereço do servidor.'); return; }
  localStorage.setItem(LS_SERVIDOR, valor);
  apiBaseAtual = null;
  toast('Endereço salvo!');
  testarServidor();
}

// liga/desliga as atualizacoes automaticas e confere na hora
async function salvarRepo() {
  const valor = $('inpRepo').value.trim();
  if (valor) localStorage.setItem(LS_REPO, valor);
  else localStorage.removeItem(LS_REPO);
  const r = repoSalvo();
  if (!r) {
    $('updStatus').textContent = 'Sem repositório — atualizações desligadas.';
    toast('Atualizações desligadas.');
    return;
  }
  $('updStatus').textContent = 'Procurando atualização...';
  const achou = await checarAtualizacao({ silencioso: false });
  $('updStatus').textContent = achou
    ? `Atualização ${achou} disponível!`
    : (document.getElementById('modalUpdate').classList.contains('hidden')
        ? `Você está na versão mais recente (${CONFIG.APP_VERSION}).`
        : '');
}

// ---------- chamada ao backend ----------
// tenta os enderecos da lista e fica no primeiro que responder
let apiBaseAtual = null;

async function tentarFetch(base, rota, opcoes, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${base}${rota}`, { ...(opcoes || {}), signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
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

// ---------- abre a espera do pagamento no link fixo ----------
async function avisarServidor(b) {
  return chamarApi('/api/aguardar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId: b.id,
      serviceName: b.serviceName,
      dateLabel: b.dateLabel,
      time: b.time,
      clientName: b.clientName,
    }),
  });
}

// ---------- confere sozinho se o Pix caiu ----------
async function conferirPagamento() {
  if (!pixBooking || pixBooking.pixStatus === 'pago') return pararConferencia();
  try {
    const r = await chamarApi(`/api/conferir/${encodeURIComponent(pixBooking.id)}`);
    if (r && r.pago) {
      pixBooking = updateBooking(pixBooking.id, { pixStatus: 'pago', status: 'confirmado' });
      pararConferencia();
      renderPixArea();
      toast('✅ Pagamento confirmado! Pode enviar no WhatsApp.');
      return;
    }
    if (r && r.ambiguo) {
      pararConferencia();
      renderAmbiguo(r.aviso);
    }
  } catch { /* sem internet: tenta de novo no proximo ciclo */ }
}

// link que o cliente paga, vem do servidor
async function buscarLink() {
  const r = await chamarApi('/api/link');
  if (r && r.link) return r.link;
  if (r && r.modo === 'link_unico') return '';   // o link so existe depois de /api/aguardar
  return CONFIG.PIX_LINK;
}

function iniciarConferencia() {
  pararConferencia();
  conferirPagamento();
  pollTimer = setInterval(conferirPagamento, 5000);
}
function pararConferencia() { clearInterval(pollTimer); pollTimer = null; }

// ---------- desenha a etapa 5 ----------
function renderPixArea() {
  const b = pixBooking;
  if (!b) return;
  const signal = signalOf(b.price);
  const pago = b.pixStatus === 'pago';

  $('pixText2').textContent =
    `Sinal de ${BRL(signal)} — ${b.serviceName} · ${b.dateLabel} às ${b.time}`;
  $('pixValor').textContent = BRL(signal);

  if (pago) {
    pararConferencia();
    $('pixGerando').classList.add('hidden');
    $('pixPronto').classList.remove('hidden');
    $('pixOffline').classList.add('hidden');
    $('pixEspera').innerHTML = '✅ <b>Pagamento confirmado pela InfinitePay</b>';
    $('btnPagarAgora').classList.add('hidden');
    $('pixCode').value = 'PAGAMENTO CONFIRMADO';
  }

  const res = $('pixResultado');
  res.classList.remove('hidden');
  res.classList.toggle('pagavel', !pago);
  $('btnWppFinal').classList.toggle('hidden', !pago);

  if (pago) {
    $('pixResultadoTexto').textContent =
      'Pagamento confirmado! Agora envie seu agendamento no WhatsApp para a barbearia reservar sua vaga.';
    showFloatWpp(b);
  } else {
    $('pixResultadoTexto').textContent =
      'Assim que o Pix cair, esta tela muda sozinha e o botão do WhatsApp aparece.';
  }
}

// ---------- link ja estava pago antes: precisa falar com a barbearia ----------
function renderAmbiguo(aviso) {
  $('pixGerando').classList.add('hidden');
  $('pixPronto').classList.add('hidden');
  $('pixEspera').textContent = '⚠️ Não foi possível confirmar automaticamente.';
  const res = $('pixResultado');
  res.classList.remove('hidden');
  res.classList.remove('pagavel');
  $('btnWppFinal').classList.remove('hidden');   // falar com a barbearia, não é confirmar
  $('pixResultadoTexto').textContent =
    (aviso || 'Este link de pagamento já estava marcado como pago.')
    + ' Fale com a barbearia pelo WhatsApp para confirmar o seu sinal.';
  showFloatWpp(pixBooking);
}

// ---------- link de pagamento pronto ----------
function mostrarCobranca(url) {
  pixBooking = updateBooking(pixBooking.id, { pixUrl: url });
  $('pixGerando').classList.add('hidden');
  $('pixPronto').classList.remove('hidden');
  $('pixOffline').classList.add('hidden');

  $('btnPagarAgora').href = url;
  $('pixCode').value = url;
  $('imgQrGrande').src = qrDe(url, 420);
  $('linkQrGrande').href = url;
  showPixQr(url);
  iniciarConferencia();
}

// ---------- QR grande em uma janela só ----------
function abrirQrGrande() {
  const url = $('pixCode').value;
  if (!url) return;
  $('imgQrGrande').src = qrDe(url, 420);
  $('linkQrGrande').href = url;
  $('modalQr').classList.remove('hidden');
}

// monta a imagem do QR Code a partir do link
function qrDe(texto, tamanho) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=' + tamanho + 'x' + tamanho
    + '&margin=6&data=' + encodeURIComponent(texto);
}

// ---------- backend fora do ar: modo manual, sem liberar nada sozinho ----------
function mostrarOffline(motivo) {
  pararConferencia();
  $('pixGerando').classList.add('hidden');
  $('pixPronto').classList.add('hidden');
  $('pixOffline').classList.remove('hidden');
  $('pixOfflineMsg').innerHTML =
    '<b>O Pix automático não está funcionando agora.</b><br>'
    + 'O site não conseguiu falar com o servidor de pagamento.<br>'
    + 'Se você está no computador: abra <b>iniciar-tudo.bat</b>.<br>'
    + 'Se você está no aplicativo: toque na <b>engrenagem ⚙️</b> lá em cima e confira o endereço do servidor.<br><br>'
    + 'Enquanto isso você pode pagar direto na chave abaixo:';
  const chave = PIX_KEY_OK() ? CONFIG.PIX_KEY : '';
  $('pixManual').classList.toggle('hidden', !chave);
  $('pixChaveManual').value = chave;
  if (!chave) {
    $('pixOfflineMsg').innerHTML =
      '<b>O Pix automático não está funcionando agora.</b><br>'
      + 'Fale com a barbearia pelo WhatsApp para concluir seu agendamento.';
  }
  $('pixDebug').textContent = `Motivo: ${motivo} · endereços tentados: ${servidores().join(', ')}`;
  showPixQr('');
  console.warn('[pix] backend indisponivel:', motivo);
}

// testa a conexão com o servidor e avisa no console o que achou
async function checarServidor() {
  for (const base of servidores()) {
    try {
      const r = await tentarFetch(base, '/api/health', null, 6000);
      console.log('[servidor] ok em', base, r);
      apiBaseAtual = base;
      return true;
    } catch (e) {
      console.warn('[servidor] sem resposta em', base, e.message);
    }
  }
  return false;
}

// Cliente não pagou (ou desistiu): volta para a etapa 4 sem confirmar nada
function clientNotPaid() {
  pararConferencia();
  showStep(4);
  renderResume();
}

// Botão flutuante que reaparece quando o cliente volta ao site
function showFloatWpp(b) {
  const f = $('pixFloat');
  if (!f || !b) return;
  pixBooking = b;
  $('pixFloatText').textContent =
    `Pagamento de ${BRL(signalOf(b.price))} confirmado! Envie seu agendamento no WhatsApp para garantir a vaga.`;
  f.classList.add('show');
}

// Cliente não pagou ainda
function clientNotPaid() {
  renderPixArea();
  toast('Tudo bem. Pague o Pix quando puder e volte aqui.');
}

// ===== quando volta ao site: reconfere o pagamento pendente =====
// Só libera o WhatsApp depois que a InfinitePay confirmar. Nunca sozinho.
function checkPixOnLoad() {
  const list = loadBookings();
  const pago = list.find((b) => b.payMethod === 'pix' && b.pixStatus === 'pago');
  if (pago) { showFloatWpp(pago); return; }

  const pendente = list.find((b) => b.payMethod === 'pix' && b.pixStatus !== 'pago' && b.pixUrl);
  if (!pendente) return;
  pixBooking = pendente;
  showStep(5);
  renderPixArea();
  mostrarCobranca(pendente.pixUrl);
  toast('Conferindo seu pagamento...');
}

// ===== GALERIA DE FOTOS (carrossel) =====
function initCarrossel() {
  const track = $('carTrack');
  if (!track) return;
  const items = [...track.querySelectorAll('.car-item')];
  const dots = $('carDots');
  if (!items.length) return;

  // remove fotos que não existirem no servidor
  items.forEach((fig) => {
    const img = fig.querySelector('img');
    img.addEventListener('error', () => {
      img.classList.add('erro');
      fig.remove();
    });
  });

  const validos = () => [...track.querySelectorAll('.car-item')];

  // índice da foto que está mais centralizada
  const indiceAtual = () => {
    const list = validos();
    const centro = track.scrollLeft + track.clientWidth / 2;
    let melhor = 0, dist = Infinity;
    list.forEach((el, i) => {
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - centro);
      if (d < dist) { dist = d; melhor = i; }
    });
    return melhor;
  };

  // Rola SÓ o carrossel na horizontal — nunca mexe na rolagem da página
  const irPara = (i, suave = true) => {    const list = validos();
    if (!list.length) return;
    const el = list[Math.max(0, Math.min(list.length - 1, i))];
    const left = el.offsetLeft - (track.clientWidth - el.clientWidth) / 2;
    if (suave && podeAnimar()) track.scrollTo({ left, behavior: 'smooth' });
    else track.scrollTo({ left, behavior: 'auto' });
    setTimeout(() => paintDots(), 700);
  };
  const nav = (dir) => { pararAuto(); irPara(indiceAtual() + dir); };

  let dotsTimer = null;
  const paintDots = () => {
    const list = validos();
    dots.innerHTML = list.map((_, i) => `<button class="car-dot" data-i="${i}"></button>`).join('');
    [...dots.children].forEach((d) => (d.onclick = () => { pararAuto(); irPara(Number(d.dataset.i)); }));
    const atual = indiceAtual();
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === atual));
  };
  // atualiza as bolinhas depois que a rolagem terminar (com ou sem evento de scroll)
  const agendarDots = () => { clearTimeout(dotsTimer); dotsTimer = setTimeout(paintDots, 120); };

  // avanço automático: só enquanto a galeria estiver visível na tela
  let timer = null;
  const estado = { visivel: false };
  const iniciarAuto = () => {
    clearInterval(timer);
    if (!estado.visivel) return;
    timer = setInterval(() => {
      const list = validos();
      if (!list.length) return;
      irPara((indiceAtual() + 1) % list.length);
    }, 5000);
  };
  const pararAuto = () => { clearInterval(timer); timer = null; };

  $('carPrev').onclick = () => nav(-1);
  $('carNext').onclick = () => nav(1);

  track.addEventListener('scroll', agendarDots, { passive: true });
  track.addEventListener('pointerenter', pararAuto);
  track.addEventListener('pointerleave', iniciarAuto);
  track.addEventListener('touchstart', pararAuto, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        estado.visivel = e.isIntersecting;
        if (e.isIntersecting) iniciarAuto(); else pararAuto();
      });
    }, { threshold: 0.25 }).observe(track);
  } else {
    estado.visivel = true;
    iniciarAuto();
  }

  paintDots();
}

// ===== CARTÃO "HORÁRIOS HOJE" (topo do site) =====
const slotMinutesOf = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const OPEN_MIN = slotMinutesOf('09:00');
const CLOSE_MIN = slotMinutesOf('21:00');

async function renderToday() {
  const label = $('todayLabel');
  const box = $('todaySlots');
  if (!label || !box) return;
  const now = new Date();
  const hojeKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());
  const mins = now.getHours() * 60 + now.getMinutes();

  label.textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  if (now.getDay() === CONFIG.CLOSED_WEEKDAY) {
    box.innerHTML = '<span class="closed-big">🔴 Fechado hoje</span><p class="tiny">Voltamos amanhã às 09:00</p>';
    return;
  }
  if (mins < OPEN_MIN) {
    box.innerHTML = `<span class="closed-big">🔴 Abre às 09:00</span><p class="tiny">Volte em ${Math.floor((OPEN_MIN - mins) / 60)}h${String((OPEN_MIN - mins) % 60).padStart(2, '0')}</p>`;
    return;
  }
  if (mins > CLOSE_MIN) {
    box.innerHTML = '<span class="closed-big">🔴 Encerrado</span><p class="tiny">Voltamos amanhã às 09:00</p>';
    return;
  }

  const futuras = TIME_SLOTS.filter((t) => slotMinutesOf(t) > mins);
  if (!futuras.length) {
    box.innerHTML = '<span class="closed-big">🔴 Encerrado</span><p class="tiny">Sem mais vagas hoje</p>';
    return;
  }
  const list = await loadBookings();
  box.innerHTML = futuras.map((t) => {
    const busy = list.some((b) => b.dateKey === hojeKey && b.time === t && bookingHoldsSlot(b));
    return `<button class="slot ${busy ? 'busy' : ''}" data-t="${t}" ${busy ? 'disabled' : ''}>${t}</button>`;
  }).join('');
  box.querySelectorAll('.slot:not(.busy)').forEach((el) => (el.onclick = () => {
    if (serviceIds.length === 0) { toast('Escolha o corte primeiro.'); document.getElementById('servicos').scrollIntoView({ behavior: 'smooth' }); return; }
    dayKey = hojeKey;
    time = el.dataset.t;
    showStep(3);
    renderTimes();
    renderResume();
    toast(`Horário ${el.dataset.t} selecionado.`);
  }));
}
document.querySelectorAll('.payopt').forEach((el) =>
  el.onclick = () => { payMethod = el.dataset.pay; renderPay(); renderResume(); });
$('btnNext1').onclick = () => {
  if (serviceIds.length === 0) { toast('Escolha pelo menos um corte.'); return; }
  showStep(2);
};
$('btnBack2').onclick = () => showStep(1);
$('btnNext2').onclick = () => {
  if (!dayKey) { toast('Escolha um dia.'); return; }
  showStep(3);
};
$('btnBack3').onclick = () => showStep(2);
$('btnNext3').onclick = () => {
  if (!time) { toast('Escolha uma hora.'); return; }
  showStep(4);
};
$('btnBack4').onclick = () => showStep(3);
$('btnBack5').onclick = () => showStep(4);
$('btnMoney').onclick = confirmMoney;
$('btnNextPix').onclick = generatePixBooking;
$('btnCopiarChave').onclick = async () => {
  const chave = $('pixChaveManual').value;
  if (!chave) return;
  try { await navigator.clipboard.writeText(chave); toast('Chave copiada!'); }
  catch { $('pixChaveManual').select(); toast('Segure e copie a chave.'); }
};
$('btnCopyPix').onclick = async () => {
  const code = $('pixCode').value;
  if (!code) return toast('Sem código para copiar.');
  try { await navigator.clipboard.writeText(code); toast('Link de pagamento copiado!'); }
  catch { $('pixCode').select(); toast('Segure e copie o link.'); }
};
$('btnFloatWpp').onclick = () => {
  if (pixBooking) openWhatsApp(pixBooking);
  $('pixFloat').classList.remove('show');
};
$('btnWppFinal').onclick = () => {
  if (pixBooking) openWhatsApp(pixBooking);
};
$('btnFalarBarbearia').href = `https://wa.me/${String(CONFIG.BARBER_WHATSAPP).replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Preciso de ajuda com um agendamento.')}`;
$('btnAjustes').onclick = abrirAjustes;
$('btnFecharAjustes').onclick = fecharAjustes;
$('btnTestarServidor').onclick = testarServidor;
$('btnSalvarServidor').onclick = salvarServidor;
$('btnSalvarRepo').onclick = salvarRepo;
$('btnVerQr').onclick = abrirQrGrande;
$('btnFecharQr').onclick = () => $('modalQr').classList.add('hidden');
document.querySelectorAll('.payopt').forEach((el) => el.onclick = () => { payMethod = el.dataset.pay; renderPay(); renderResume(); });
$('calPrev').onclick = () => shiftMonth(-1);
$('calNext').onclick = () => shiftMonth(1);
['inpName','inpPhone','inpNote'].forEach((id) => {
  $(id).addEventListener('input', (e) => {
    if (id === 'inpName') name = e.target.value;
    if (id === 'inpPhone') phone = e.target.value;
    if (id === 'inpNote') note = e.target.value;
    renderResume();
  });
});
$('locAddress').textContent = `${CONFIG.BARBER_ADDRESS} · Ter–Dom 09h–21h · Seg fechada`;
$('aboutText').textContent = CONFIG.ABOUT;
$('aboutHours').textContent = `📍 ${CONFIG.BARBER_ADDRESS} · ⏰ Ter–Dom 09h–21h · Seg fechada`;
const btnMaps = document.getElementById('btnMaps');
if (btnMaps) {
  btnMaps.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${CONFIG.BARBER_NAME} ${CONFIG.BARBER_ADDRESS}`);
}
// links "Agendar" vão direto para a barra de etapas (sem pular pro meio da página)
document.querySelectorAll('a[href="#servicos"]').forEach((a) => {
  a.addEventListener('click', (e) => { e.preventDefault(); showStep(1); });
});
// ===== tarja do topo =====
// No APK, o Android às vezes desenha o site por baixo da barra de notificação
// e o navegador não avisa a altura. Quando isso acontece reservamos um mínimo,
// senão o logo e o menu ficam escondidos atrás dos ícones do celular.
function ajustarTarjaDoTopo() {
  const ehApk = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (!ehApk) return;
  const atual = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topo-seguro')) || 0;
  if (atual < 24) {
    document.documentElement.style.setProperty('--topo-seguro', '28px');
    document.documentElement.classList.add('em-apk');
  }
}

// ===== iniciar =====
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  ajustarTarjaDoTopo();
  initCalendar();
  initCarrossel();
  renderAll();
  renderToday();
  checkPixOnLoad();
  checarServidor();
  // procura versao nova no GitHub (silencioso: so mostra se existir)
  setTimeout(() => checarAtualizacao({ silencioso: true }), 2500);
  // e de novo a cada 6 horas, enquanto o app estiver aberto
  setInterval(() => checarAtualizacao({ silencioso: true }), 6 * 60 * 60 * 1000);
});
window.addEventListener('resize', ajustarTarjaDoTopo);
window.addEventListener('orientationchange', ajustarTarjaDoTopo);
// mantém o card do topo e os horários frescos se a aba ficar aberta
setInterval(() => { renderToday(); }, 60000);
document.title = `${CONFIG.BARBER_NAME} — Agendamento Online`;
