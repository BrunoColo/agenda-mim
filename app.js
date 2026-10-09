'use strict';

// La escribe publicar.sh en cada publicación; se compara con version.txt para actualizarse sola
const VERSION = '2026-10-09.2024';

// ---------- Utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const mins = (t) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
const hhmm = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_C = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const INSTRUMENTOS = ['Piano', 'Guitarra', 'Canto', 'Batería', 'Percusión', 'Saxofón', 'Ensamble', 'Iniciación musical'];
const COLORES = ['#1F5F4A', '#2B4C7E', '#8A4B1F', '#6B3F6E', '#3D5A5B', '#7A2E3A'];
const ASIST = { vino: 'Vino', falto: 'Faltó', aviso: 'Avisó antes' };

// ?ahora=2026-10-09T16:35 fija la hora, para mostrar la app o probarla
const AHORA = new URLSearchParams(location.search).get('ahora');
// Modo prueba (solo con los datos de ejemplo): simula un momento del día con clases,
// para poder ver "Hoy" en acción a cualquier hora. Queda guardado en el teléfono.
const KEY_SIM = 'mim-agenda-sim';
const SIMS = { antes: 'Antes de empezar', clase: 'En plena clase', entre: 'Entre dos clases', fin: 'Al terminar el día' };
let sim = '', simF = '';
try { [sim = '', simF = ''] = (localStorage.getItem(KEY_SIM) || '').split('|'); } catch { /* sin almacenamiento */ }
let simCache = null;
function momentoSim() {
  const base = iso(new Date());
  const k = `${sim}|${simF}|${yoId}|${base}|${db.clases.length}|${Object.keys(db.exc).length}`;
  if (simCache?.k === k) return simCache.d;
  // El día simulado es el primero, desde hoy, con varias clases mías todavía sin tocar
  const delDia = (x) => ocurrencias(x).filter((o) => o.c.profeId === yoId && !o.cancelada);
  const dias = Array.from({ length: 8 }, (_, i) => addDays(base, i));
  const limpio = (x) => delDia(x).every((o) => !db.reg[o.key]);
  // Una vez elegido el día se mantiene, aunque después anotes clases en él
  if (!simF || simF < base || !delDia(simF).length) {
    simF = dias.find((x) => delDia(x).length >= 3 && limpio(x)) || dias.find((x) => delDia(x).length && limpio(x)) || dias.find((x) => delDia(x).length) || base;
    try { localStorage.setItem(KEY_SIM, `${sim}|${simF}`); } catch { /* sin almacenamiento */ }
  }
  const f = simF, ocs = delDia(f);
  let d = null;
  if (ocs.length) {
    const m = ocs.map((o) => [mins(o.inicio), mins(o.inicio) + o.c.dur]);
    const ult = m[m.length - 1], seg = m[Math.min(1, m.length - 1)];
    const t = sim === 'antes' ? m[0][0] - 30 : sim === 'clase' ? seg[0] + 20 : sim === 'entre' ? ult[0] - 10 : ult[1] + 10;
    d = parse(f); d.setMinutes(t);
  }
  simCache = { k: `${sim}|${simF}|${yoId}|${base}|${db.clases.length}|${Object.keys(db.exc).length}`, d };
  return d;
}
const now = () => (AHORA ? new Date(AHORA) : (sim && db?.demo && yoId && momentoSim()) || new Date());
const hoyIso = () => iso(now());

const fechaLarga = (s) => { const d = parse(s); return `${cap(DIAS[d.getDay()])} ${d.getDate()} de ${MESES[d.getMonth()]}`; };
const fechaCorta = (s) => { const d = parse(s); return `${DIAS_C[d.getDay()].toLowerCase()} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`; };
const fechaRel = (s) => { const hoy = hoyIso(); return s === hoy ? 'hoy' : s === addDays(hoy, -1) ? 'ayer' : s === addDays(hoy, 1) ? 'mañana' : fechaLarga(s).toLowerCase(); };
const durTxt = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60}` : `${m / 60} h`);

const ICONOS = {
  chevR: '<path d="M9 6l6 6-6 6"/>',
  chevL: '<path d="M15 6l-6 6 6 6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/>',
  lapiz: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  chat: '<path d="M20 11.5a8 8 0 01-11.8 7L4 20l1.4-4A8 8 0 1120 11.5z"/>',
  tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/>',
};
const ico = (n, s = 20) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONOS[n]}</svg>`;

// ---------- Datos (se guardan en este teléfono) ----------
const KEY = 'mim-agenda-v1';
const KEY_YO = 'mim-agenda-yo';
let db;
let yoId = leer(KEY_YO);

function leer(k) { try { return localStorage.getItem(k); } catch { return null; } }
function escribir(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento: sigue en memoria */ } }
function cargar() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.v === 1 && !(d.demo && d.semillaV !== SEMILLA_V)) return d; } catch { /* datos rotos o sin acceso */ }
  return semilla();
}
function guardar() { escribir(KEY, JSON.stringify(db)); render(); }

db = cargar();

// ---------- Consultas ----------
const profe = (id) => db.profes.find((p) => p.id === id);
const alumno = (id) => db.alumnos.find((a) => a.id === id);
const clase = (id) => db.clases.find((c) => c.id === id);
const alumnosDe = (c) => c.alumnoIds.map(alumno).filter(Boolean);
function tituloClase(c) {
  if (c.titulo) return c.titulo;
  const n = alumnosDe(c).map((a) => a.nombre);
  if (!n.length) return c.instrumento;
  return n.length <= 2 ? n.join(' y ') : `${n[0]}, ${n[1]} y ${n.length - 2} más`;
}

function ocDe(key) {
  const [id, origen] = key.split('|');
  const c = clase(id);
  if (!c) return null;
  const exc = db.exc[key];
  const movida = exc?.tipo === 'movida';
  return { c, key, origen, fecha: movida ? exc.fecha : origen, inicio: movida ? exc.inicio : c.inicio, movida, cancelada: exc?.tipo === 'cancelada', exc };
}
function ocurrencias(fecha) {
  const wd = parse(fecha).getDay();
  const out = [];
  for (const c of db.clases) {
    const toca = c.fecha ? c.fecha === fecha : c.dia === wd && (!c.desde || c.desde <= fecha);
    if (!toca) continue;
    const o = ocDe(`${c.id}|${fecha}`);
    if (!o.movida) out.push(o);
  }
  for (const [key, e] of Object.entries(db.exc)) {
    if (e.tipo !== 'movida' || e.fecha !== fecha) continue;
    const o = ocDe(key);
    if (o) out.push(o);
  }
  return out.sort((a, b) => a.inicio.localeCompare(b.inicio));
}
function horas(o) {
  const ini = parse(o.fecha); ini.setMinutes(mins(o.inicio));
  return { ini, fin: new Date(ini.getTime() + o.c.dur * 60000) };
}
function estado(o) {
  if (o.cancelada) return 'cancelada';
  if (db.reg[o.key]) return 'anotada';
  const n = now(), { ini, fin } = horas(o);
  return n >= fin ? 'pendiente' : n >= ini ? 'encurso' : 'futura';
}
function pendientes(profeId) {
  const hoy = hoyIso(), out = [];
  // En modo prueba solo cuentan las del día simulado
  const atras = sim && db.demo && !AHORA ? 0 : 14;
  for (let i = 0; i <= atras; i++) out.push(...ocurrencias(addDays(hoy, -i)).filter((o) => o.c.profeId === profeId && estado(o) === 'pendiente').reverse());
  return out;
}
function ultimaNota(c, antes) {
  const uno = c.alumnoIds.length === 1;
  return Object.values(db.reg)
    .filter((r) => (r.nota || r.practicar) && (uno ? r.alumnoIds.length === 1 && r.alumnoIds[0] === c.alumnoIds[0] && r.instrumento === c.instrumento : r.claseId === c.id) && r.fecha + r.inicio < antes)
    .sort((a, b) => (b.fecha + b.inicio).localeCompare(a.fecha + a.inicio))[0];
}
const historial = (alumnoId) => Object.values(db.reg).filter((r) => r.alumnoIds.includes(alumnoId)).sort((a, b) => (b.fecha + b.inicio).localeCompare(a.fecha + a.inicio));
const horariosDe = (alumnoId) => db.clases.filter((c) => c.alumnoIds.includes(alumnoId) && (!c.fecha || c.fecha >= hoyIso())).sort((a, b) => (a.fecha ? 9 : a.dia) - (b.fecha ? 9 : b.dia) || a.inicio.localeCompare(b.inicio));
const horarioTxt = (c) => `${c.fecha ? cap(fechaCorta(c.fecha)) : cap(DIAS[c.dia])} ${c.inicio}`;

// Clases del mismo profe o con un mismo alumno que se pisan en ese día
function choques(lista, nueva) {
  const a0 = mins(nueva.inicio), a1 = a0 + nueva.dur, out = [];
  for (const x of lista) {
    if (x.id === nueva.id) continue;
    const b0 = mins(x.inicio);
    if (a0 >= b0 + x.dur || b0 >= a1) continue;
    if (x.profeId === nueva.profeId) out.push(`${profe(x.profeId)?.nombre || 'El profe'} ya tiene clase a las ${x.inicio} (${x.titulo.replace(/\.$/, '')})`);
    for (const id of nueva.alumnoIds) if (x.alumnoIds.includes(id)) out.push(`${alumno(id)?.nombre} ya tiene ${x.instrumento} a las ${x.inicio}`);
  }
  return out;
}
const comoChoque = (o) => ({ id: o.c.id, profeId: o.c.profeId, inicio: o.inicio, dur: o.c.dur, alumnoIds: o.c.alumnoIds, instrumento: o.c.instrumento, titulo: tituloClase(o.c) });

function waLink(tel, txt) {
  let n = String(tel || '').replace(/\D/g, '');
  if (n.startsWith('0')) n = '598' + n.slice(1); else if (n.length === 8 && n.startsWith('9')) n = '598' + n;
  return `https://wa.me/${n}?text=${encodeURIComponent(txt)}`;
}

// ---------- Estado de pantalla ----------
let tab = ['hoy', 'semana', 'alumnos'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'hoy';
let semSel = hoyIso();
let semFiltro = 'mias';
let alumnoQ = '';
let instalar = null;

// ---------- Capas (pantallas encima y hojas desde abajo) ----------
const capas = [];
function abrir(kind, html, opt = {}) {
  const el = document.createElement('div');
  el.className = `layer layer--${kind}`;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<button class="layer__scrim" ${opt.fijo ? '' : 'data-act="cerrar"'} aria-label="Cerrar" tabindex="-1"></button><div class="layer__panel" tabindex="-1"></div>`;
  const capa = { el, html, kind, fijo: !!opt.fijo };
  $('#layers').append(el); capas.push(capa);
  pintarCapa(capa);
  if (!opt.fijo && !opt.reemplazo) history.pushState({ depth: capas.length }, '');
  inertes();
  $('.layer__panel', el).focus({ preventScroll: true });
}
function reemplazar(kind, html) { quitarTop(); abrir(kind, html, { reemplazo: true }); }
function pintarCapa(capa) {
  const panel = $('.layer__panel', capa.el);
  if (typeof capa.html !== 'function') {
    // Los formularios se pintan una sola vez, para no pisar lo que se está escribiendo
    if (!capa.pintada) { panel.innerHTML = (capa.kind === 'sheet' ? '<div class="sheet__grab"></div>' : '') + capa.html; capa.pintada = true; }
    return true;
  }
  const out = capa.html();
  if (out == null) return false;
  const y = panel.scrollTop;
  panel.innerHTML = (capa.kind === 'sheet' ? '<div class="sheet__grab"></div>' : '') + out;
  panel.scrollTop = y;
  return true;
}
function quitarTop() { const c = capas.pop(); if (c) { pararDictado(); c.el.remove(); } inertes(); }
function cerrar(n = 1) { const top = capas[capas.length - 1]; if (!top) return; if (top.fijo) { quitarTop(); render(); } else history.go(-n); }
function inertes() {
  $('#app').inert = capas.length > 0;
  capas.forEach((c, i) => { c.el.inert = i < capas.length - 1; });
}
addEventListener('popstate', (e) => {
  const depth = e.state?.depth || 0;
  while (capas.length > depth && !capas[capas.length - 1].fijo) quitarTop();
  render();
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && capas.length) cerrar();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
});

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
}

// ---------- Piezas comunes ----------
const avatar = (p, lg) => `<span class="avatar${lg ? ' avatar--lg' : ''}" style="background:${h(p?.color || '#4E5B55')}">${h((p?.nombre || '?').charAt(0).toUpperCase())}</span>`;
const PILL = { anotada: ['pill--ok', 'Anotada'], pendiente: ['pill--warn', 'Falta anotar'], cancelada: ['pill--off', 'Cancelada'], encurso: ['pill--ok', 'En curso'] };
const sinNota = (key) => { const r = db.reg[key]; return !!r && !r.nota && !r.practicar; };
const pill = (est, key) => (PILL[est] ? `<span class="pill ${PILL[est][0]}">${est === 'anotada' && sinNota(key) ? 'Dada' : PILL[est][1]}</span>` : '');

function notaPrevia(o) {
  const r = ultimaNota(o.c, o.fecha + o.inicio);
  if (!r) return `<div class="lastnote"><div class="lastnote__when">La vez pasada</div><div class="lastnote__txt muted">Todavía no hay notas de clases anteriores.</div></div>`;
  return `<div class="lastnote"><div class="lastnote__when">La vez pasada · ${h(fechaLarga(r.fecha).toLowerCase())}</div>
    ${r.nota ? `<div class="lastnote__txt">${h(r.nota)}</div>` : ''}
    ${r.practicar ? `<div class="lastnote__hw"><b>Quedó para practicar:</b> ${h(r.practicar)}</div>` : ''}</div>`;
}
function filaClase(o, opt = {}) {
  const est = estado(o);
  const p = profe(o.c.profeId);
  const sub = [o.c.instrumento, opt.conProfe ? p?.nombre : (o.c.alumnoIds.length > 1 ? `${o.c.alumnoIds.length} alumnos` : durTxt(o.c.dur)), o.movida ? 'movida' : ''].filter(Boolean).join(' · ');
  const cls = est === 'cancelada' ? ' row--off' : est === 'anotada' ? ' row--done' : '';
  return `<button class="row${cls}" data-act="${est === 'pendiente' ? 'anotar' : 'clase'}" data-key="${h(o.key)}">
    <span class="row__time">${h(o.inicio)}</span>
    ${opt.conProfe ? `<span class="dot" style="background:${h(p?.color || '#4E5B55')}"></span>` : ''}
    <span class="row__body"><span class="row__name">${h(tituloClase(o.c))}</span><span class="row__sub">${h(sub)}</span></span>
    ${pill(est, o.key)}</button>`;
}

// ---------- Vista: Hoy ----------
function vistaHoy() {
  const hoy = hoyIso(), yo = profe(yoId), n = now();
  const mias = ocurrencias(hoy).filter((o) => o.c.profeId === yoId);
  const sigue = mias.find((o) => ['encurso', 'futura'].includes(estado(o)));
  const pend = pendientes(yoId);
  const resto = mias.filter((o) => o !== sigue && estado(o) !== 'pendiente');
  const hm = (d) => hhmm(d.getHours() * 60 + d.getMinutes());

  let hero;
  if (sigue) {
    const enCurso = estado(sigue) === 'encurso', { ini, fin } = horas(sigue);
    const falta = Math.max(1, Math.round((ini - n) / 60000));
    const cuando = enCurso ? `hasta las ${hm(fin)}` : falta < 60 ? `en ${falta} min` : `en ${Math.floor(falta / 60)} h${falta % 60 ? ' ' + (falta % 60) : ''}`;
    const r = ultimaNota(sigue.c, sigue.fecha + sigue.inicio);
    // La tarjeta muestra lo justo; al tocarla se abre la clase con todo el detalle
    hero = `<section class="card hero" data-act="clase" data-key="${h(sigue.key)}" role="button" tabindex="0" aria-label="Ver la clase de ${h(tituloClase(sigue.c))}">
      <div class="hero__top"><span class="hero__tag">${enCurso ? 'Ahora' : 'Sigue'}</span><span class="pill">${h(cuando)}</span></div>
      <div class="hero__main"><div style="min-width:0"><div class="hero__name">${h(tituloClase(sigue.c))}</div>
        <div class="hero__sub">${h(sigue.c.instrumento)} · ${h(sigue.inicio)} a ${h(hm(fin))}</div></div>${ico('chevR', 22)}</div>
      ${r ? `<p class="hero__nota"><b>La vez pasada:</b> ${h(r.nota || r.practicar)}</p>` : ''}
      ${enCurso ? `<button class="btn btn--primary" data-act="anotar" data-key="${h(sigue.key)}">Anotar clase</button>` : ''}
    </section>`;
  } else {
    let prox = null;
    for (let i = 1; i <= 7 && !prox; i++) prox = ocurrencias(addDays(hoy, i)).find((o) => o.c.profeId === yoId && !o.cancelada);
    const dadas = mias.filter((o) => !o.cancelada).length;
    hero = `<section class="card">
      <div class="hero__top"><span class="hero__tag">${dadas ? 'Listo por hoy' : 'Hoy libre'}</span></div>
      <div class="hero__name">${dadas ? 'No te quedan clases' : 'Hoy no tenés clases'}</div>
      <div class="hero__sub">${prox ? `Tu próxima clase: ${h(fechaRel(prox.fecha))} a las ${h(prox.inicio)} · ${h(tituloClase(prox.c))}` : 'No hay clases agendadas en los próximos días.'}</div>
      ${prox ? '' : `<div class="btns"><button class="btn btn--primary" data-act="nueva-clase">Agendar una clase</button></div>`}
    </section>`;
  }

  const p0 = pend[0];
  return `
    <header class="head">
      <div><div class="head__date">${h(fechaLarga(hoy))}</div><h1>Tu día${yo ? `, ${h(yo.nombre)}` : ''}</h1></div>
      <button class="chip-yo" data-act="cuenta" aria-label="Cambiar de profe y opciones">${avatar(yo)}${h(yo?.nombre || 'Elegir')}</button>
    </header>
    ${sim && db.demo && !AHORA ? `<div class="banner"><span><b>Modo prueba:</b> ${h(SIMS[sim].toLowerCase())}, ${h(hm(n))}</span><button class="link" data-act="sim" data-v="">Hora real</button></div>` : ''}
    ${hero}
    ${p0 ? `<button class="pend" data-act="${pend.length === 1 ? 'anotar' : 'pendientes'}" data-key="${h(p0.key)}">
      <span class="pend__ico">${ico('lapiz')}</span>
      <span class="pend__txt">${pend.length === 1
        ? `<b>Falta anotar: ${h(tituloClase(p0.c))}</b><span>${h(p0.c.instrumento)} · ${h(fechaRel(p0.fecha))} ${h(p0.inicio)}</span>`
        : `<b>${pend.length} clases sin anotar</b><span>Tocá para anotarlas o dejarlas sin nota</span>`}</span>
      ${ico('chevR', 18)}</button>` : ''}
    ${resto.length ? `<section style="display:flex;flex-direction:column;gap:8px">
      <h2 class="label" style="margin-top:4px">${sigue ? 'Resto del día' : 'Las de hoy'}</h2>
      <div class="card card--flat">${resto.map((o) => filaClase(o)).join('')}</div></section>` : ''}`;
}

// ---------- Hoja: clases sin anotar ----------
function hojaPendientes() {
  const pend = pendientes(yoId);
  if (!pend.length) return null;
  return `<h2 class="sheet__title">Clases sin anotar</h2>
    <p class="muted" style="font-size:14.5px">Anotalas ahora, o dejalas sin nota si no hace falta.</p>
    <div>${pend.map((o) => `<div class="row" style="align-items:center">
      <span class="row__body"><span class="row__name">${h(tituloClase(o.c))}</span><span class="row__sub">${h(o.c.instrumento)} · ${h(fechaRel(o.fecha))} ${h(o.inicio)}</span></span>
      <button class="btn btn--sm" data-act="sin-nota" data-key="${h(o.key)}">Sin nota</button>
      <button class="btn btn--sm btn--primary" data-act="anotar" data-key="${h(o.key)}">Anotar</button></div>`).join('')}</div>
    ${pend.length > 1 ? `<button class="btn btn--ghost" data-act="sin-nota-todas" style="flex:none">Dejar todas sin nota</button>` : ''}`;
}
function marcarDada(key) {
  const o = ocDe(key);
  if (!o || db.reg[key]) return;
  db.reg[key] = { key, claseId: o.c.id, fecha: o.fecha, inicio: o.inicio, alumnoIds: [...o.c.alumnoIds], instrumento: o.c.instrumento, profeId: o.c.profeId, asist: Object.fromEntries(o.c.alumnoIds.map((id) => [id, 'vino'])), nota: '', practicar: '', ts: Date.now() };
}

// ---------- Vista: Semana ----------
const lunesDe = (s) => { const d = parse(s); return addDays(s, -((d.getDay() + 6) % 7)); };
function vistaSemana() {
  const lun = lunesDe(semSel), hoy = hoyIso();
  const dias = Array.from({ length: 7 }, (_, i) => addDays(lun, i));
  const filtra = (o) => semFiltro === 'todas' || o.c.profeId === yoId;
  const a = parse(dias[0]), b = parse(dias[6]);
  const titulo = a.getMonth() === b.getMonth() ? `${a.getDate()} al ${b.getDate()} de ${MESES[b.getMonth()]}` : `${a.getDate()} de ${MESES[a.getMonth()].slice(0, 3)} al ${b.getDate()} de ${MESES[b.getMonth()].slice(0, 3)}`;
  const lista = ocurrencias(semSel).filter(filtra);
  const activos = lista.filter((o) => !o.cancelada).map(comoChoque);
  const pisan = [...new Set(activos.flatMap((x) => choques(activos, x)))];
  return `
    <header class="head"><h1>Semana</h1>${semSel !== hoy ? `<button class="btn btn--sm" data-act="sem-hoy">Ir a hoy</button>` : ''}</header>
    <div class="weeknav">
      <button class="icon-btn" data-act="sem-mover" data-n="-7" aria-label="Semana anterior">${ico('chevL')}</button>
      <h2 style="text-align:center">${h(titulo)}</h2>
      <button class="icon-btn" data-act="sem-mover" data-n="7" aria-label="Semana siguiente">${ico('chevR')}</button>
    </div>
    <div class="days">${dias.map((f) => {
      const d = parse(f), hay = ocurrencias(f).some((o) => filtra(o) && !o.cancelada);
      return `<button class="day${hay ? ' has' : ''}${f === hoy ? ' is-today' : ''}" data-act="sem-dia" data-f="${f}" aria-pressed="${f === semSel}" aria-label="${h(fechaLarga(f))}${hay ? ', con clases' : ''}"><small>${DIAS_C[d.getDay()]}</small><b>${d.getDate()}</b><i></i></button>`;
    }).join('')}</div>
    <div class="seg" role="group" aria-label="Qué clases mostrar">
      <button data-act="sem-filtro" data-v="mias" aria-pressed="${semFiltro === 'mias'}">Mis clases</button>
      <button data-act="sem-filtro" data-v="todas" aria-pressed="${semFiltro === 'todas'}">Toda la escuela</button>
    </div>
    <h2 class="label" style="margin-top:4px">${h(fechaLarga(semSel))}${semSel === hoy ? ' · hoy' : ''}</h2>
    ${pisan.length ? `<div class="warnbox">Se pisan horarios: ${h(pisan.join('. '))}.</div>` : ''}
    ${lista.length ? `<div class="card card--flat">${lista.map((o) => filaClase(o, { conProfe: semFiltro === 'todas' })).join('')}</div>` : `<div class="empty">No hay clases este día.</div>`}
    <button class="fab" data-act="nueva-clase">${ico('mas', 18)} Clase</button>`;
}

// ---------- Vista: Alumnos ----------
function listaAlumnos() {
  const q = alumnoQ.trim().toLowerCase();
  const lista = db.alumnos.filter((a) => !q || a.nombre.toLowerCase().includes(q)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  if (!lista.length) return `<div class="empty">${db.alumnos.length ? 'Nadie con ese nombre.' : 'Todavía no cargaste alumnos. Tocá “+ Alumno” para empezar.'}</div>`;
  return `<div class="card card--flat">${lista.map((a) => {
    const hs = horariosDe(a.id);
    const sub = hs.length ? hs.slice(0, 2).map((c) => `${horarioTxt(c)} · ${c.instrumento}`).join(' / ') : 'Sin horario fijo';
    return `<button class="row" data-act="ficha" data-id="${h(a.id)}">
      <span class="row__body"><span class="row__name">${h(a.nombre)}</span><span class="row__sub">${h(sub)}</span></span>
      ${a.creditos > 0 ? `<span class="pill pill--warn">${a.creditos} a recuperar</span>` : ''}${ico('chevR', 18)}</button>`;
  }).join('')}</div>`;
}
function vistaAlumnos() {
  return `
    <header class="head"><h1>Alumnos</h1><span class="muted" style="font-weight:700" id="alumnos-n">${db.alumnos.length}</span></header>
    <input class="search" type="search" id="alumno-q" placeholder="Buscar por nombre" aria-label="Buscar alumno" value="${h(alumnoQ)}" autocomplete="off">
    <div id="alumnos-lista">${listaAlumnos()}</div>
    <button class="fab" data-act="nuevo-alumno">${ico('mas', 18)} Alumno</button>`;
}

function render() {
  if (!$('#alumno-q') || tab !== 'alumnos') $('#view').innerHTML = tab === 'hoy' ? vistaHoy() : tab === 'semana' ? vistaSemana() : vistaAlumnos();
  else { $('#alumnos-lista').innerHTML = listaAlumnos(); $('#alumnos-n').textContent = db.alumnos.length; }
  document.querySelectorAll('.nav button').forEach((b) => (b.dataset.tab === tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  for (let i = capas.length - 1; i >= 0; i--) if (!pintarCapa(capas[i]) && i === capas.length - 1) cerrar();
}

// ---------- Hoja: detalle de una clase ----------
function hojaClase(key) {
  return () => {
    const o = ocDe(key);
    if (!o) return null;
    const est = estado(o), { fin } = horas(o), r = db.reg[key], uno = o.c.alumnoIds.length === 1;
    const p = profe(o.c.profeId);
    return `
      <h2 class="sheet__title">${h(tituloClase(o.c))}</h2>
      <div><div style="font-weight:700">${h(fechaLarga(o.fecha))} · ${h(o.inicio)} a ${h(hhmm(fin.getHours() * 60 + fin.getMinutes()))}</div>
        <div class="muted" style="font-size:14.5px;font-weight:600">${h(o.c.instrumento)} con ${h(p?.nombre || '')}${o.c.fecha ? ' · clase suelta' : ` · todos los ${h(DIAS[o.c.dia].replace(/o$/, 'os'))}`}</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${pill(est, key)}${o.movida ? `<span class="pill pill--off">Movida del ${h(fechaCorta(o.origen))}</span>` : ''}${o.cancelada && o.exc.recupera ? '<span class="pill pill--warn">Se recupera</span>' : ''}</div>
      ${o.c.alumnoIds.length > 1 ? `<div class="muted" style="font-size:14.5px">${h(alumnosDe(o.c).map((a) => a.nombre).join(', '))}</div>` : ''}
      ${r ? `<div class="card" style="gap:6px;padding:14px 16px"><div class="lastnote__when">Nota de esta clase</div>
          <div class="lastnote__txt">${r.nota ? h(r.nota) : '<span class="muted">Sin nota.</span>'}</div>
          ${r.practicar ? `<div class="lastnote__hw"><b>Para practicar:</b> ${h(r.practicar)}</div>` : ''}</div>`
        : `<div class="card" style="padding:0 16px 14px;gap:0">${notaPrevia(o).replace('class="lastnote"', 'class="lastnote" style="border-top:0"')}</div>`}
      <div class="stack">
        ${o.cancelada ? `<button class="btn btn--primary" data-act="descancelar" data-key="${h(key)}">Deshacer la cancelación</button>` : `
          ${est !== 'futura' ? `<button class="btn btn--primary" data-act="anotar" data-key="${h(key)}">${r ? (sinNota(key) ? 'Agregar una nota' : 'Editar la nota') : 'Anotar clase'}</button>` : ''}
          ${est === 'pendiente' ? `<button class="btn" data-act="sin-nota" data-key="${h(key)}">Dejarla sin nota</button>` : ''}
          ${est === 'futura' || est === 'encurso' ? `<button class="btn" data-act="recordar" data-key="${h(key)}">${ico('chat', 18)} Recordar por WhatsApp</button>` : ''}
          ${!r ? `<button class="btn" data-act="mover" data-key="${h(key)}">Mover solo este día</button>
          <button class="btn btn--danger" data-act="cancelar" data-key="${h(key)}">Cancelar solo este día</button>` : ''}
          ${o.movida ? `<button class="btn" data-act="desmover" data-key="${h(key)}">Volver al horario habitual</button>` : ''}`}
        ${uno ? `<button class="btn btn--ghost" data-act="ficha" data-id="${h(o.c.alumnoIds[0])}">Ver ficha e historial</button>` : ''}
        <button class="link" data-act="editar-clase" data-id="${h(o.c.id)}" style="align-self:center">${o.c.fecha ? 'Editar esta clase' : 'Cambiar el horario fijo'}</button>
      </div>`;
  };
}

// ---------- Pantalla: anotar clase ----------
function paginaAnotar(key) {
  const o = ocDe(key);
  if (!o) return null;
  const r = db.reg[key], als = alumnosDe(o.c), uno = als.length === 1;
  const segAsist = (a) => `<div class="seg" role="group" aria-label="Asistencia de ${h(a.nombre)}" data-al="${h(a.id)}">${Object.entries(ASIST).map(([v, t]) => `<button type="button" data-act="asist" data-v="${v}" aria-pressed="${(r?.asist?.[a.id] || 'vino') === v}">${t}</button>`).join('')}</div>`;
  const alguienFalto = r && Object.values(r.asist).some((v) => v !== 'vino');
  return `<form data-form="anotar" data-key="${h(key)}" style="display:contents">
    <div class="page__head"><button type="button" class="icon-btn" data-act="cerrar" aria-label="Volver">${ico('chevL')}</button>
      <span>${h(o.fecha === hoyIso() ? 'Clase de hoy' : cap(fechaCorta(o.fecha)))} · ${h(o.inicio)}</span><span style="width:44px"></span></div>
    <div class="page__body">
      <div><h1 class="page__title">${h(tituloClase(o.c))}</h1><div class="hero__sub">${h(o.c.instrumento)} · ${h(durTxt(o.c.dur))}</div></div>
      <div class="card" style="padding:0 16px 14px;gap:0">${notaPrevia(o).replace('class="lastnote"', 'class="lastnote" style="border-top:0"')}</div>
      <div class="fld"><div class="fld__lbl">${uno ? '¿Vino?' : 'Asistencia'}</div>
        ${uno ? segAsist(als[0]) : als.map((a) => `<div class="asist-row"><span>${h(a.nombre)}</span>${segAsist(a)}</div>`).join('')}</div>
      <label class="check" id="an-recupera-box" ${alguienFalto ? '' : 'hidden'}><input type="checkbox" name="recupera" ${r?.recupera ? 'checked' : ''}>Queda una clase a recuperar</label>
      <div class="card">
        <div class="dictar">
          <button type="button" class="mic" data-act="dictar" aria-pressed="false" aria-label="Dictar la nota">${ico('mic', 30)}</button>
          <div class="dictar__txt"><b id="an-dictar-t">Contá qué vieron</b><span id="an-dictar-s">Tocá el micrófono y hablá, o escribilo abajo.</span></div>
        </div>
        <div class="fld"><label for="an-nota">Qué vieron hoy</label>
          <textarea class="field" id="an-nota" name="nota" rows="4" placeholder="Qué trabajaron, qué canción, cómo le fue.">${h(r?.nota || '')}</textarea></div>
      </div>
      <div class="fld"><label for="an-practicar">Para practicar en casa <small>(opcional)</small></label>
        <input class="field" id="an-practicar" name="practicar" placeholder="Ej.: cambio de Sol a Do, lento" value="${h(r?.practicar || '')}" autocomplete="off"></div>
      ${uno ? `<label class="check"><input type="checkbox" name="wa">Mandarle el resumen a la familia por WhatsApp</label>` : ''}
    </div>
    <div class="page__foot"><button class="btn btn--dark" type="submit" id="an-guardar">${r?.nota || r?.practicar ? 'Guardar clase' : 'Guardar sin nota'}</button></div>
  </form>`;
}
function rotuloAnotar() {
  const b = $('#an-guardar');
  if (b) b.textContent = $('#an-nota').value.trim() || $('#an-practicar').value.trim() ? 'Guardar clase' : 'Guardar sin nota';
}

let rec = null;
function pararDictado() { if (rec) { try { rec.stop(); } catch { /* ya estaba detenido */ } } }
function dictar(btn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const ta = $('#an-nota');
  if (!SR) { ta.focus(); toast('Acá no se puede dictar. Usá el micrófono del teclado.'); return; }
  if (rec) { rec.stop(); return; }
  const marcar = (on) => {
    btn.classList.toggle('is-on', on); btn.setAttribute('aria-pressed', on);
    if ($('#an-dictar-t')) { $('#an-dictar-t').textContent = on ? 'Escuchando…' : 'Contá qué vieron'; $('#an-dictar-s').textContent = on ? 'Tocá de nuevo para terminar.' : 'Tocá el micrófono y hablá, o escribilo abajo.'; }
  };
  const base = ta.value.trim();
  let fin = '';
  rec = new SR(); rec.lang = 'es-UY'; rec.continuous = true; rec.interimResults = true;
  rec.onresult = (e) => {
    let inter = '';
    for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t; else inter += t; }
    const dicho = (fin + inter).trim();
    ta.value = [base, dicho ? cap(dicho) : ''].filter(Boolean).join(' '); rotuloAnotar();
  };
  rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Falta darle permiso al micrófono.'); else if (e.error !== 'aborted' && e.error !== 'no-speech') toast('No se pudo dictar. Probá escribirlo.'); };
  rec.onend = () => { rec = null; marcar(false); };
  try { rec.start(); marcar(true); } catch { rec = null; toast('No se pudo dictar. Probá escribirlo.'); }
}

function guardarAnotar(form) {
  const key = form.dataset.key, o = ocDe(key);
  if (!o) return;
  const fd = new FormData(form), previo = db.reg[key];
  const asist = {};
  form.querySelectorAll('.seg[data-al]').forEach((g) => { asist[g.dataset.al] = $('[aria-pressed="true"]', g)?.dataset.v || 'vino'; });
  const faltaron = Object.keys(asist).filter((id) => asist[id] !== 'vino');
  const recupera = fd.has('recupera') && faltaron.length > 0;
  if (previo?.recupera) previo.recuperan.forEach((id) => { const a = alumno(id); if (a) a.creditos = Math.max(0, (a.creditos || 0) - 1); });
  if (recupera) faltaron.forEach((id) => { const a = alumno(id); if (a) a.creditos = (a.creditos || 0) + 1; });
  const reg = { key, claseId: o.c.id, fecha: o.fecha, inicio: o.inicio, alumnoIds: [...o.c.alumnoIds], instrumento: o.c.instrumento, profeId: o.c.profeId, asist, nota: String(fd.get('nota') || '').trim(), practicar: String(fd.get('practicar') || '').trim(), recupera, recuperan: recupera ? faltaron : [], ts: Date.now() };
  db.reg[key] = reg;
  if (fd.has('wa')) {
    const a = alumno(o.c.alumnoIds[0]);
    const txt = [`Hola! Les cuento la clase de ${o.c.instrumento.toLowerCase()} de ${a.nombre} de ${fechaRel(o.fecha)}:`, reg.nota || (asist[a.id] === 'vino' ? '' : 'No pudo venir.'), reg.practicar ? `Para practicar en casa: ${reg.practicar}` : '', `${profe(o.c.profeId)?.nombre || ''}, Música Integral Malvín`].filter(Boolean).join('\n');
    window.open(waLink(a.tel, txt), '_blank', 'noopener');
  }
  guardar(); cerrar(); toast(reg.nota || reg.practicar ? 'Clase anotada' : 'Guardada sin nota');
}

// ---------- Hojas: mover y cancelar ----------
function hojaMover(key) {
  const o = ocDe(key);
  return `<form data-form="mover" data-key="${h(key)}" style="display:contents">
    <h2 class="sheet__title">Mover solo esta clase</h2>
    <p class="muted" style="font-size:14.5px">${h(tituloClase(o.c))}, ${h(fechaLarga(o.fecha).toLowerCase())} a las ${h(o.inicio)}. El horario fijo no cambia.</p>
    <div class="grid2">
      <div class="fld"><label for="mv-f">Nuevo día</label><input class="field" id="mv-f" type="date" name="fecha" value="${h(o.fecha)}" required></div>
      <div class="fld"><label for="mv-h">Hora</label><input class="field" id="mv-h" type="time" name="inicio" step="300" value="${h(o.inicio)}" required></div>
    </div>
    <div class="warnbox" data-warn hidden></div>
    <div class="btns"><button type="button" class="btn" data-act="cerrar">Volver</button><button class="btn btn--primary" type="submit">Mover</button></div>
  </form>`;
}
function hojaCancelar(key) {
  const o = ocDe(key);
  return `<form data-form="cancelar" data-key="${h(key)}" style="display:contents">
    <h2 class="sheet__title">Cancelar solo esta clase</h2>
    <p class="muted" style="font-size:14.5px">${h(tituloClase(o.c))}, ${h(fechaLarga(o.fecha).toLowerCase())} a las ${h(o.inicio)}. Las demás semanas siguen igual.</p>
    <label class="check"><input type="checkbox" name="recupera" checked>Queda una clase a recuperar</label>
    <div class="btns"><button type="button" class="btn" data-act="cerrar">Volver</button><button class="btn btn--danger" type="submit">Cancelar la clase</button></div>
  </form>`;
}
function confirmar(titulo, texto, ok, fn, peligro) {
  abrir('sheet', `<h2 class="sheet__title">${h(titulo)}</h2><p class="muted" style="font-size:15px">${h(texto)}</p>
    <div class="btns"><button class="btn" data-act="cerrar">Volver</button><button class="btn ${peligro ? 'btn--danger' : 'btn--primary'}" data-act="confirmar">${h(ok)}</button></div>`);
  capas[capas.length - 1].ok = fn;
}

// ---------- Pantalla: clase nueva o editar ----------
function paginaClase(c, pre = {}) {
  const e = c || { profeId: yoId, instrumento: 'Piano', dia: parse(semSel).getDay() || 1, inicio: '17:00', dur: 45, alumnoIds: pre.alumnoId ? [pre.alumnoId] : [], titulo: '', fecha: '' };
  const insts = [...new Set([...INSTRUMENTOS, ...db.clases.map((x) => x.instrumento)])];
  const suelta = !!e.fecha;
  const als = [...db.alumnos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return `<form data-form="clase" data-id="${h(c?.id || '')}" style="display:contents">
    <div class="page__head"><button type="button" class="icon-btn" data-act="cerrar" aria-label="Volver">${ico('chevL')}</button><span>${c ? 'Editar clase' : 'Clase nueva'}</span><span style="width:44px"></span></div>
    <div class="page__body">
      <div class="seg" role="group" aria-label="Tipo de clase">
        <button type="button" data-act="tipo-clase" data-v="fija" aria-pressed="${!suelta}">Todas las semanas</button>
        <button type="button" data-act="tipo-clase" data-v="suelta" aria-pressed="${suelta}">Solo una fecha</button>
      </div>
      <div class="grid2">
        <div class="fld" data-solo="fija" ${suelta ? 'hidden' : ''}><label for="cl-dia">Día</label><select class="field" id="cl-dia" name="dia">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<option value="${d}" ${d === e.dia ? 'selected' : ''}>${cap(DIAS[d])}</option>`).join('')}</select></div>
        <div class="fld" data-solo="suelta" ${suelta ? '' : 'hidden'}><label for="cl-fecha">Fecha</label><input class="field" id="cl-fecha" type="date" name="fecha" value="${h(e.fecha || semSel)}"></div>
        <div class="fld"><label for="cl-hora">Hora</label><input class="field" id="cl-hora" type="time" name="inicio" step="300" value="${h(e.inicio)}" required></div>
      </div>
      <div class="grid2">
        <div class="fld"><label for="cl-dur">Duración</label><select class="field" id="cl-dur" name="dur">${[30, 45, 60, 90, 120].map((m) => `<option value="${m}" ${m === e.dur ? 'selected' : ''}>${durTxt(m)}</option>`).join('')}</select></div>
        <div class="fld"><label for="cl-profe">Profe</label><select class="field" id="cl-profe" name="profeId">${db.profes.map((p) => `<option value="${h(p.id)}" ${p.id === e.profeId ? 'selected' : ''}>${h(p.nombre)}</option>`).join('')}</select></div>
      </div>
      <div class="fld"><label for="cl-inst">Instrumento o actividad</label><select class="field" id="cl-inst" name="instrumento">${insts.map((i) => `<option ${i === e.instrumento ? 'selected' : ''}>${h(i)}</option>`).join('')}<option value="__otro">Otro…</option></select>
        <input class="field" name="instOtro" placeholder="Nombre de la actividad" aria-label="Otra actividad" hidden></div>
      <div class="fld"><div class="fld__lbl">Alumnos <small>(uno, o varios si es un grupo)</small></div>
        <div class="checklist" id="cl-alumnos">${als.map((a) => `<label class="check"><input type="checkbox" name="al" value="${h(a.id)}" ${e.alumnoIds.includes(a.id) ? 'checked' : ''}>${h(a.nombre)}</label>`).join('') || '<p class="muted" style="padding:12px 0;font-size:14.5px" id="cl-vacio">Todavía no hay alumnos. Agregá el primero acá abajo.</p>'}</div>
        <div style="display:flex;gap:8px"><input class="field" id="cl-nuevo" placeholder="¿No está? Escribí el nombre" aria-label="Nombre de un alumno nuevo" autocomplete="off"><button type="button" class="btn btn--sm" data-act="alumno-rapido" style="min-height:50px">Agregar</button></div></div>
      <div class="fld"><label for="cl-titulo">Nombre del grupo <small>(opcional)</small></label><input class="field" id="cl-titulo" name="titulo" value="${h(e.titulo)}" placeholder="Ej.: Ensamble de los viernes" autocomplete="off"></div>
      <div class="warnbox" data-warn hidden></div>
      ${c ? `<button type="button" class="btn btn--danger" data-act="borrar-clase" data-id="${h(c.id)}" style="flex:none">Eliminar esta clase</button>` : ''}
    </div>
    <div class="page__foot"><button class="btn btn--dark" type="submit">Guardar</button></div>
  </form>`;
}
function guardarClase(form) {
  const fd = new FormData(form), id = form.dataset.id, previa = id ? clase(id) : null;
  const suelta = $('[data-act="tipo-clase"][aria-pressed="true"]', form).dataset.v === 'suelta';
  const inst = fd.get('instrumento') === '__otro' ? String(fd.get('instOtro') || '').trim() : fd.get('instrumento');
  const warn = $('[data-warn]', form);
  const avisar = (t) => { warn.textContent = t; warn.hidden = false; warn.scrollIntoView({ block: 'center' }); };
  if (!inst) return avisar('Falta el nombre de la actividad.');
  if (suelta && !fd.get('fecha')) return avisar('Falta la fecha.');
  const c = { id: id || uid(), profeId: fd.get('profeId'), instrumento: inst, inicio: fd.get('inicio'), dur: Number(fd.get('dur')), alumnoIds: fd.getAll('al'), titulo: String(fd.get('titulo') || '').trim() };
  if (suelta) c.fecha = fd.get('fecha'); else {
    c.dia = Number(fd.get('dia'));
    // Una clase recién creada no queda "sin anotar" por la de hoy si esa hora ya pasó
    const yaPaso = mins(c.inicio) <= now().getHours() * 60 + now().getMinutes();
    c.desde = previa?.desde && !previa.fecha ? previa.desde : yaPaso ? addDays(hoyIso(), 1) : hoyIso();
  }
  if (!c.alumnoIds.length && !c.titulo) return avisar('Elegí al menos un alumno, o ponele un nombre al grupo.');
  if (!form.dataset.ok) {
    const otras = suelta ? ocurrencias(c.fecha).filter((o) => !o.cancelada).map(comoChoque)
      : db.clases.filter((x) => !x.fecha && x.dia === c.dia).map((x) => ({ ...x, titulo: tituloClase(x) }));
    const pisa = [...new Set(choques(otras, c))];
    if (pisa.length) { form.dataset.ok = '1'; $('[type="submit"]', form).textContent = 'Guardar igual'; return avisar(`Se pisa con otra clase: ${pisa.join('. ')}.`); }
  }
  if (previa) {
    // Si cambió el día o la hora, las excepciones futuras de la clase vieja ya no aplican
    if (previa.dia !== c.dia || previa.inicio !== c.inicio || previa.fecha !== c.fecha) for (const k of Object.keys(db.exc)) if (k.startsWith(id + '|') && k.split('|')[1] >= hoyIso()) delete db.exc[k];
    db.clases[db.clases.indexOf(previa)] = c;
  } else db.clases.push(c);
  if (suelta) semSel = c.fecha;
  guardar(); cerrar(); toast(previa ? 'Clase actualizada' : 'Clase agendada');
}

// ---------- Pantalla: ficha del alumno ----------
function paginaFicha(id) {
  return () => {
    const a = alumno(id);
    if (!a) return null;
    const hs = horariosDe(id), hist = historial(id);
    const vino = hist.filter((r) => r.asist[id] === 'vino').length;
    return `
      <div class="page__head"><button class="icon-btn" data-act="cerrar" aria-label="Volver">${ico('chevL')}</button><span>Ficha</span>
        <button class="icon-btn" data-act="editar-alumno" data-id="${h(id)}" aria-label="Editar datos">${ico('lapiz')}</button></div>
      <div class="page__body">
        <div><h1 class="page__title">${h(a.nombre)}</h1>
          <div class="hero__sub">${h([a.edad ? `${a.edad} años` : '', a.tutor ? `Responsable: ${a.tutor}` : ''].filter(Boolean).join(' · ') || 'Sin datos de contacto')}</div></div>
        <div class="btns">
          <a class="btn" href="${h(waLink(a.tel, ''))}" target="_blank" rel="noopener">${ico('chat', 18)} WhatsApp</a>
          ${a.tel ? `<a class="btn" href="tel:${h(a.tel.replace(/[^\d+]/g, ''))}">${ico('tel', 18)} Llamar</a>` : ''}
        </div>
        ${a.notas ? `<div class="card" style="padding:14px 16px;gap:4px"><div class="lastnote__when">A tener en cuenta</div><div style="white-space:pre-line">${h(a.notas)}</div></div>` : ''}
        <section style="display:flex;flex-direction:column;gap:8px"><h2 class="label">Horarios</h2>
          <div class="card card--flat">${hs.map((c) => `<button class="row" data-act="editar-clase" data-id="${h(c.id)}"><span class="row__body"><span class="row__name">${h(horarioTxt(c))} · ${h(c.instrumento)}</span><span class="row__sub">${h(durTxt(c.dur))} con ${h(profe(c.profeId)?.nombre || '')}${c.alumnoIds.length > 1 ? ` · ${h(tituloClase(c))}` : ''}</span></span>${ico('chevR', 18)}</button>`).join('')
            || `<div class="empty" style="padding:16px 0">Sin horario fijo.</div>`}</div>
          <button class="btn btn--ghost" data-act="nueva-clase" data-alumno="${h(id)}" style="flex:none">${ico('mas', 18)} Agendar una clase</button></section>
        <section class="card" style="flex-direction:row;align-items:center;justify-content:space-between;padding:14px 16px">
          <div class="kv"><b>Clases a recuperar</b><span>Se suman al cancelar o faltar con aviso.</span></div>
          <div class="counter"><button class="icon-btn" style="background:#fff" data-act="credito" data-id="${h(id)}" data-n="-1" aria-label="Restar una" ${a.creditos > 0 ? '' : 'disabled'}>${ico('menos', 18)}</button><b>${a.creditos || 0}</b>
            <button class="icon-btn" style="background:#fff" data-act="credito" data-id="${h(id)}" data-n="1" aria-label="Sumar una">${ico('mas', 18)}</button></div></section>
        <section style="display:flex;flex-direction:column;gap:4px"><h2 class="label">Historial${hist.length ? ` · vino a ${vino} de ${hist.length}` : ''}</h2>
          ${hist.map((r) => `<div class="hist"><div class="hist__top"><b>${h(fechaLarga(r.fecha))} · ${h(r.instrumento)}</b>
              <span class="pill ${r.asist[id] === 'vino' ? 'pill--ok' : r.asist[id] === 'falto' ? 'pill--warn' : 'pill--off'}">${h(ASIST[r.asist[id]] || 'Vino')}</span></div>
            ${r.nota ? `<p>${h(r.nota)}</p>` : ''}${r.practicar ? `<p class="muted" style="font-size:14.5px"><b>Para practicar:</b> ${h(r.practicar)}</p>` : ''}
            ${clase(r.claseId) ? `<button class="link" data-act="anotar" data-key="${h(r.key)}" style="align-self:flex-start;min-height:36px;font-size:14px">Editar</button>` : ''}</div>`).join('')
            || `<div class="empty">Todavía no hay clases anotadas.</div>`}</section>
      </div>`;
  };
}
function paginaAlumno(a) {
  const e = a || { nombre: '', tel: '', edad: '', tutor: '', notas: '' };
  return `<form data-form="alumno" data-id="${h(a?.id || '')}" style="display:contents">
    <div class="page__head"><button type="button" class="icon-btn" data-act="cerrar" aria-label="Volver">${ico('chevL')}</button><span>${a ? 'Editar alumno' : 'Alumno nuevo'}</span><span style="width:44px"></span></div>
    <div class="page__body">
      <div class="fld"><label for="al-nombre">Nombre y apellido</label><input class="field" id="al-nombre" name="nombre" value="${h(e.nombre)}" required autocomplete="off"></div>
      <div class="grid2">
        <div class="fld"><label for="al-edad">Edad <small>(opcional)</small></label><input class="field" id="al-edad" name="edad" type="number" min="2" max="99" inputmode="numeric" value="${h(e.edad)}"></div>
        <div class="fld"><label for="al-tel">Celular</label><input class="field" id="al-tel" name="tel" type="tel" inputmode="tel" placeholder="099 000 000" value="${h(e.tel)}" autocomplete="off"></div>
      </div>
      <div class="fld"><label for="al-tutor">Adulto responsable <small>(si es menor)</small></label><input class="field" id="al-tutor" name="tutor" value="${h(e.tutor)}" autocomplete="off"></div>
      <div class="fld"><label for="al-notas">A tener en cuenta <small>(opcional)</small></label><textarea class="field" id="al-notas" name="notas" rows="3" placeholder="Ej.: tiene teclado en casa, viene con la abuela.">${h(e.notas)}</textarea></div>
      ${a ? `<button type="button" class="btn btn--danger" data-act="borrar-alumno" data-id="${h(a.id)}" style="flex:none">Eliminar alumno</button>` : ''}
    </div>
    <div class="page__foot"><button class="btn btn--dark" type="submit">Guardar</button></div>
  </form>`;
}

// ---------- Hoja: cuenta y opciones ----------
function hojaCuenta() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `
    <div style="display:flex;align-items:center;gap:12px"><img src="icons/icon.svg" width="40" height="40" alt="" style="border-radius:10px"><h2 class="sheet__title">Agenda MIM</h2></div>
    <section style="display:flex;flex-direction:column;gap:8px"><h3 class="label">¿Quién está usando este teléfono?</h3>
      <div class="card card--flat">${db.profes.map((p) => `<div class="row" style="padding:8px 0">
        <button data-act="soy" data-id="${h(p.id)}" style="flex:1;min-width:0;display:flex;align-items:center;gap:12px;background:none;border:0;padding:0;min-height:44px;text-align:left">
          ${avatar(p, true)}<span class="row__body"><span class="row__name">${h(p.nombre)}</span></span>
          ${p.id === yoId ? '<span class="pill pill--ok">Vos</span>' : ''}</button>
        <button class="icon-btn" style="background:#fff" data-act="editar-profe" data-id="${h(p.id)}" aria-label="Editar a ${h(p.nombre)}">${ico('lapiz', 18)}</button></div>`).join('')}</div>
      <button class="btn btn--ghost" data-act="nuevo-profe" style="flex:none">${ico('mas', 18)} Agregar profe</button></section>
    ${standalone ? '' : `<section style="display:flex;flex-direction:column;gap:8px"><h3 class="label">Tenerla como app</h3>
      ${instalar ? `<button class="btn btn--primary" data-act="instalar" style="flex:none">Instalar en este teléfono</button>`
        : `<p class="muted" style="font-size:14.5px">${ios ? 'En Safari: tocá Compartir y después “Agregar a inicio”.' : 'En Chrome: abrí el menú de los tres puntos y tocá “Agregar a pantalla principal”.'}</p>`}</section>`}
    ${db.demo ? `<section style="display:flex;flex-direction:column;gap:8px"><h3 class="label">Probar un momento del día</h3>
      <p class="muted" style="font-size:14.5px">Para ver cómo queda Hoy a distintas horas, sin esperar. Solo con los datos de ejemplo.</p>
      <div class="simgrid">${Object.entries(SIMS).map(([v, t]) => `<button class="btn btn--sm" data-act="sim" data-v="${v}" aria-pressed="${sim === v}">${t}</button>`).join('')}
        <button class="btn btn--sm" data-act="sim" data-v="" aria-pressed="${!sim}" style="grid-column:1/-1">Hora real</button></div></section>` : ''}
    <section style="display:flex;flex-direction:column;gap:8px"><h3 class="label">Datos</h3>
      <p class="muted" style="font-size:14.5px">${db.demo ? 'Ahora estás viendo alumnos y clases de ejemplo, inventados. ' : ''}Todo se guarda solo en este teléfono. Bajá un respaldo cada tanto.</p>
      <div class="btns"><button class="btn" data-act="exportar">Bajar respaldo</button><button class="btn" data-act="importar">Cargar respaldo</button></div>
      ${db.demo ? `<button class="btn btn--primary" data-act="en-blanco" style="flex:none">Borrar el ejemplo y empezar</button>` : `<button class="btn btn--ghost" data-act="ver-demo" style="flex:none">Volver a los datos de ejemplo</button>`}</section>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span class="muted" style="font-size:13px">Versión ${h(VERSION)}</span><button class="link" data-act="actualizar" style="font-size:14px">Buscar actualización</button></div>`;
}
function hojaQuien() {
  return `<img src="icons/icon.svg" width="56" height="56" alt="Música Integral Malvín" style="border-radius:14px">
    <h2 class="sheet__title">¿Quién sos?</h2>
    <p class="muted" style="font-size:15px">Así te mostramos tus clases. Lo podés cambiar cuando quieras.</p>
    <div class="stack">${db.profes.map((p) => `<button class="btn" data-act="soy" data-id="${h(p.id)}" style="justify-content:flex-start;min-height:60px">${avatar(p, true)}<span style="font-size:17px">${h(p.nombre)}</span></button>`).join('')}
      <button class="btn btn--ghost" data-act="nuevo-profe">${ico('mas', 18)} Soy otro profe</button></div>`;
}
function paginaProfe(p) {
  const e = p || { nombre: '', instrumentos: '', color: COLORES[db.profes.length % COLORES.length] };
  return `<form data-form="profe" data-id="${h(p?.id || '')}" style="display:contents">
    <h2 class="sheet__title">${p ? 'Editar profe' : 'Profe nuevo'}</h2>
    <div class="fld"><label for="pr-nombre">Nombre</label><input class="field" id="pr-nombre" name="nombre" value="${h(e.nombre)}" required autocomplete="off"></div>
    <div class="fld"><label for="pr-inst">Qué enseña</label><input class="field" id="pr-inst" name="instrumentos" value="${h(e.instrumentos)}" placeholder="Piano, guitarra" autocomplete="off"></div>
    <div class="fld"><div class="fld__lbl">Color</div><div class="swatches" role="group" aria-label="Color">${COLORES.map((c, i) => `<button type="button" class="swatch" data-act="color" data-v="${c}" style="background:${c}" aria-pressed="${c === e.color}" aria-label="Color ${i + 1}"></button>`).join('')}</div></div>
    <div class="btns">${p && db.profes.length > 1 ? `<button type="button" class="btn btn--danger" data-act="borrar-profe" data-id="${h(p.id)}">Eliminar</button>` : `<button type="button" class="btn" data-act="cerrar">Volver</button>`}<button class="btn btn--primary" type="submit">Guardar</button></div>
  </form>`;
}

// ---------- Acciones ----------
const acts = {
  tab(el) { tab = el.dataset.tab; history.replaceState(history.state, '', '#' + tab); if (tab === 'semana') semSel = hoyIso(); $('#view').innerHTML = ''; render(); scrollTo(0, 0); },
  cerrar() { cerrar(); },
  cuenta() { abrir('sheet', hojaCuenta); },
  soy(el) {
    yoId = el.dataset.id; escribir(KEY_YO, yoId);
    const top = capas[capas.length - 1];
    if (top?.fijo) { quitarTop(); render(); } else { render(); cerrar(); }
    toast(`Hola, ${profe(yoId)?.nombre}`);
  },
  clase(el) { abrir('sheet', hojaClase(el.dataset.key)); },
  pendientes() { abrir('sheet', hojaPendientes); },
  actualizar() { buscarActualizacion(true); },
  sim(el) {
    sim = el.dataset.v; if (!sim) simF = ''; // al cambiar de momento se sigue en el mismo día de prueba
    escribir(KEY_SIM, `${sim}|${simF}`); simCache = null;
    tab = 'hoy'; semSel = hoyIso(); $('#view').innerHTML = '';
    if (capas.length) cerrar(); else render();
    scrollTo(0, 0); toast(sim ? `Modo prueba: ${SIMS[sim].toLowerCase()}` : 'De vuelta a la hora real');
  },
  'sin-nota'(el) { marcarDada(el.dataset.key); guardar(); toast('Guardada sin nota'); },
  'sin-nota-todas'() { pendientes(yoId).forEach((o) => marcarDada(o.key)); guardar(); toast('Listo, no queda nada por anotar'); },
  anotar(el) {
    const html = paginaAnotar(el.dataset.key);
    if (!html) return;
    if (capas[capas.length - 1]?.kind === 'sheet') reemplazar('page', html); else abrir('page', html);
  },
  asist(el) {
    el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === el));
    const form = el.closest('form');
    const falto = [...form.querySelectorAll('.seg[data-al] [aria-pressed="true"]')].some((b) => b.dataset.v !== 'vino');
    $('#an-recupera-box').hidden = !falto;
    if (falto && el.dataset.v === 'aviso') $('#an-recupera-box input').checked = true;
  },
  dictar(el) { dictar(el); },
  ficha(el) { const f = paginaFicha(el.dataset.id); if (capas[capas.length - 1]?.kind === 'sheet') reemplazar('page', f); else abrir('page', f); },
  mover(el) { reemplazar('sheet', hojaMover(el.dataset.key)); },
  cancelar(el) { reemplazar('sheet', hojaCancelar(el.dataset.key)); },
  descancelar(el) {
    const key = el.dataset.key, o = ocDe(key);
    if (o?.exc?.recupera) alumnosDe(o.c).forEach((a) => { a.creditos = Math.max(0, (a.creditos || 0) - 1); });
    delete db.exc[key]; guardar(); toast('La clase vuelve a estar en pie');
  },
  desmover(el) { delete db.exc[el.dataset.key]; guardar(); toast('Volvió a su horario habitual'); },
  recordar(el) {
    const o = ocDe(el.dataset.key), als = alumnosDe(o.c), uno = als.length === 1;
    const txt = `Hola! Les recuerdo la clase de ${o.c.instrumento.toLowerCase()}${uno ? ` de ${als[0].nombre}` : ''}: ${fechaRel(o.fecha)} a las ${o.inicio}. ¡Nos vemos! ${profe(o.c.profeId)?.nombre || ''}, Música Integral Malvín`;
    window.open(waLink(uno ? als[0].tel : '', txt), '_blank', 'noopener');
  },
  'nueva-clase'(el) { abrir('page', paginaClase(null, { alumnoId: el.dataset.alumno })); },
  'editar-clase'(el) { const c = clase(el.dataset.id); if (!c) return; if (capas[capas.length - 1]?.kind === 'sheet') reemplazar('page', paginaClase(c)); else abrir('page', paginaClase(c)); },
  'tipo-clase'(el) {
    const form = el.closest('form');
    el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === el));
    form.querySelectorAll('[data-solo]').forEach((f) => { f.hidden = f.dataset.solo !== el.dataset.v; });
  },
  'alumno-rapido'() {
    const inp = $('#cl-nuevo'), nombre = inp.value.trim();
    if (!nombre) { inp.focus(); return; }
    const a = { id: uid(), nombre, tel: '', edad: '', tutor: '', notas: '', creditos: 0 };
    db.alumnos.push(a); escribir(KEY, JSON.stringify(db));
    $('#cl-vacio')?.remove();
    $('#cl-alumnos').insertAdjacentHTML('afterbegin', `<label class="check"><input type="checkbox" name="al" value="${h(a.id)}" checked>${h(a.nombre)}</label>`);
    $('#cl-alumnos').scrollTop = 0; inp.value = ''; toast(`${nombre} quedó en la lista de alumnos`);
  },
  'borrar-clase'(el) {
    const c = clase(el.dataset.id);
    confirmar('¿Eliminar esta clase?', `${tituloClase(c)}, ${horarioTxt(c)}. Deja de aparecer en la agenda. Las notas ya guardadas quedan en el historial.`, 'Eliminar', () => {
      db.clases = db.clases.filter((x) => x.id !== c.id);
      for (const k of Object.keys(db.exc)) if (k.startsWith(c.id + '|')) delete db.exc[k];
      guardar(); cerrar(2); toast('Clase eliminada');
    }, true);
  },
  'nuevo-alumno'() { abrir('page', paginaAlumno(null)); },
  'editar-alumno'(el) { abrir('page', paginaAlumno(alumno(el.dataset.id))); },
  'borrar-alumno'(el) {
    const a = alumno(el.dataset.id);
    confirmar(`¿Eliminar a ${a.nombre}?`, 'Se borra de la lista y de sus clases. No se puede deshacer.', 'Eliminar', () => {
      db.alumnos = db.alumnos.filter((x) => x.id !== a.id);
      db.clases.forEach((c) => { c.alumnoIds = c.alumnoIds.filter((i) => i !== a.id); });
      db.clases = db.clases.filter((c) => c.alumnoIds.length || c.titulo);
      guardar(); cerrar(3); toast('Alumno eliminado');
    }, true);
  },
  credito(el) { const a = alumno(el.dataset.id); a.creditos = Math.max(0, (a.creditos || 0) + Number(el.dataset.n)); guardar(); },
  'nuevo-profe'() { abrir('sheet', paginaProfe(null)); },
  'editar-profe'(el) { abrir('sheet', paginaProfe(profe(el.dataset.id))); },
  color(el) { el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === el)); },
  'borrar-profe'(el) {
    const p = profe(el.dataset.id), n = db.clases.filter((c) => c.profeId === p.id).length;
    confirmar(`¿Eliminar a ${p.nombre}?`, n ? `También se eliminan sus ${n} clases de la agenda.` : 'No tiene clases agendadas.', 'Eliminar', () => {
      db.profes = db.profes.filter((x) => x.id !== p.id); db.clases = db.clases.filter((c) => c.profeId !== p.id);
      if (yoId === p.id) { yoId = db.profes[0].id; escribir(KEY_YO, yoId); }
      guardar(); cerrar(2); toast('Profe eliminado');
    }, true);
  },
  confirmar() { capas[capas.length - 1].ok?.(); },
  'sem-dia'(el) { semSel = el.dataset.f; render(); },
  'sem-mover'(el) { semSel = addDays(semSel, Number(el.dataset.n)); render(); },
  'sem-hoy'() { semSel = hoyIso(); render(); },
  'sem-filtro'(el) { semFiltro = el.dataset.v; render(); },
  exportar() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 1)], { type: 'application/json' }));
    a.download = `agenda-mim-${hoyIso()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Respaldo descargado');
  },
  importar() { $('#file-import').click(); },
  'en-blanco'() {
    confirmar('¿Borrar los datos de ejemplo?', 'Quedan los profes y se borran los alumnos y clases inventados, para que cargues los reales.', 'Borrar y empezar', () => {
      db = { v: 1, profes: db.profes, alumnos: [], clases: [], exc: {}, reg: {} }; guardar(); cerrar(2); toast('Listo, agenda en blanco');
    });
  },
  'ver-demo'() {
    confirmar('¿Volver a los datos de ejemplo?', 'Se reemplaza todo lo cargado en este teléfono por alumnos inventados. Bajá un respaldo antes si lo querés conservar.', 'Reemplazar', () => {
      db = semilla(); if (!profe(yoId)) { yoId = db.profes[0].id; escribir(KEY_YO, yoId); } guardar(); cerrar(2);
    }, true);
  },
  async instalar() { if (!instalar) return; instalar.prompt(); await instalar.userChoice.catch(() => {}); instalar = null; render(); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled) acts[el.dataset.act]?.(el, e);
});

const forms = {
  anotar: guardarAnotar,
  clase: guardarClase,
  mover(form) {
    const key = form.dataset.key, o = ocDe(key), fd = new FormData(form), fecha = fd.get('fecha'), inicio = fd.get('inicio');
    if (!form.dataset.ok) {
      const otras = ocurrencias(fecha).filter((x) => !x.cancelada && x.key !== key).map(comoChoque);
      const pisa = [...new Set(choques(otras, { ...comoChoque(o), id: '', inicio }))];
      if (pisa.length) { form.dataset.ok = '1'; const w = $('[data-warn]', form); w.textContent = `Se pisa con otra clase: ${pisa.join('. ')}.`; w.hidden = false; $('[type="submit"]', form).textContent = 'Mover igual'; return; }
    }
    if (fecha === o.origen && inicio === o.c.inicio) delete db.exc[key]; else db.exc[key] = { tipo: 'movida', fecha, inicio };
    semSel = fecha; guardar(); cerrar(); toast(`Movida a ${fechaRel(fecha)} ${inicio}`);
  },
  cancelar(form) {
    const key = form.dataset.key, o = ocDe(key), recupera = new FormData(form).has('recupera');
    db.exc[key] = { tipo: 'cancelada', recupera };
    if (recupera) alumnosDe(o.c).forEach((a) => { a.creditos = (a.creditos || 0) + 1; });
    guardar(); cerrar(); toast(recupera ? 'Cancelada. Queda una clase a recuperar' : 'Clase cancelada');
  },
  alumno(form) {
    const fd = new FormData(form), id = form.dataset.id;
    const datos = { nombre: String(fd.get('nombre')).trim(), tel: String(fd.get('tel')).trim(), edad: fd.get('edad') ? Number(fd.get('edad')) : '', tutor: String(fd.get('tutor')).trim(), notas: String(fd.get('notas')).trim() };
    if (!datos.nombre) return;
    if (id) Object.assign(alumno(id), datos);
    else { const a = { id: uid(), creditos: 0, ...datos }; db.alumnos.push(a); guardar(); reemplazar('page', paginaFicha(a.id)); toast('Alumno agregado'); return; }
    guardar(); cerrar(); toast('Datos guardados');
  },
  profe(form) {
    const fd = new FormData(form), id = form.dataset.id;
    const datos = { nombre: String(fd.get('nombre')).trim(), instrumentos: String(fd.get('instrumentos')).trim(), color: $('.swatch[aria-pressed="true"]', form)?.dataset.v || COLORES[0] };
    if (!datos.nombre) return;
    if (id) Object.assign(profe(id), datos);
    else {
      const p = { id: uid(), ...datos }; db.profes.push(p);
      if (capas.some((c) => c.fijo)) { yoId = p.id; escribir(KEY_YO, yoId); guardar(); cerrar(); capas.filter((c) => c.fijo).forEach((c) => { capas.splice(capas.indexOf(c), 1); c.el.remove(); }); inertes(); return; }
    }
    guardar(); cerrar(); toast('Profe guardado');
  },
};
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  forms[f.dataset.form]?.(f);
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'an-nota' || e.target.id === 'an-practicar') rotuloAnotar();
  if (e.target.id === 'alumno-q') { alumnoQ = e.target.value; $('#alumnos-lista').innerHTML = listaAlumnos(); }
  const f = e.target.closest('[data-form]');
  if (f?.dataset.ok && e.target.matches('[name="inicio"],[name="fecha"],[name="dia"],[name="dur"],[name="profeId"],[name="al"]')) {
    delete f.dataset.ok; $('[data-warn]', f).hidden = true; $('[type="submit"]', f).textContent = f.dataset.form === 'mover' ? 'Mover' : 'Guardar';
  }
  if (e.target.name === 'instrumento') { const o = e.target.form.elements.instOtro; o.hidden = e.target.value !== '__otro'; if (!o.hidden) o.focus(); }
});
$('#file-import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (d?.v !== 1 || !Array.isArray(d.profes) || !Array.isArray(d.clases) || !Array.isArray(d.alumnos)) throw new Error('formato');
    db = { exc: {}, reg: {}, ...d };
    if (!profe(yoId)) { yoId = db.profes[0]?.id; escribir(KEY_YO, yoId || ''); }
    guardar(); toast('Respaldo cargado');
  } catch { toast('Ese archivo no es un respaldo de la agenda.'); }
});

// ---------- Arranque ----------
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); instalar = e; render(); });
addEventListener('appinstalled', () => { instalar = null; render(); });
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

// ---------- Actualización automática ----------
// Una app instalada casi nunca recarga la página: se retoma desde el fondo. Por eso, cada vez que
// vuelve a estar a la vista, pregunta si hay una versión publicada más nueva y se recarga sola.
const ARCHIVOS = ['./', 'index.html', 'app.css', 'app.js', 'demo.js', 'sw.js'];
let buscando = false;
async function buscarActualizacion(manual) {
  if (buscando || !navigator.onLine) { if (manual) toast('Sin conexión, no se puede buscar.'); return; }
  buscando = true;
  try {
    const nueva = (await (await fetch('version.txt', { cache: 'no-store' })).text()).trim();
    if (!nueva || nueva === VERSION) { if (manual) toast('Ya tenés la última versión'); return; }
    // No recargar encima de algo que se está escribiendo; se reintenta la próxima vez
    if (capas.some((c) => typeof c.html !== 'function') && !manual) return;
    let intento = '';
    try { intento = sessionStorage.getItem('mim-upd') || ''; } catch { /* sin almacenamiento */ }
    if (intento === nueva && !manual) return; // ya se intentó en esta sesión: evita recargar en bucle
    try { sessionStorage.setItem('mim-upd', nueva); } catch { /* sin almacenamiento */ }
    // Trae los archivos salteando lo guardado por el navegador, y recién ahí recarga
    await Promise.all(ARCHIVOS.map((a) => fetch(a, { cache: 'reload' }).catch(() => {})));
    (await navigator.serviceWorker?.getRegistration())?.update().catch(() => {});
    location.reload();
  } catch { if (manual) toast('No se pudo buscar la actualización.'); } finally { buscando = false; }
}
addEventListener('load', () => buscarActualizacion());
document.addEventListener('visibilitychange', () => { if (!document.hidden) buscarActualizacion(); });
setInterval(() => { if (!document.hidden) buscarActualizacion(); }, 5 * 60000);
// La cuenta regresiva y los estados cambian solos con la hora
setInterval(() => { if (tab === 'hoy' && !document.hidden) render(); }, 30000);

// Mientras se muestran los datos de ejemplo, las clases inventadas de días pasados
// aparecen ya anotadas, para que el ejemplo no se llene de pendientes viejos.
function refrescarDemo() {
  const hoy = hoyIso();
  if (!db.demo || !db.sembrada || db.sembrada >= hoy) return;
  for (let f = db.sembrada; f < hoy; f = addDays(f, 1)) {
    for (const o of ocurrencias(f)) {
      if (!o.c.demo || o.cancelada || db.reg[o.key]) continue;
      const [nota, practicar] = notaDemo(o.c, f);
      db.reg[o.key] = { key: o.key, claseId: o.c.id, fecha: o.fecha, inicio: o.inicio, alumnoIds: [...o.c.alumnoIds], instrumento: o.c.instrumento, profeId: o.c.profeId, asist: Object.fromEntries(o.c.alumnoIds.map((id) => [id, 'vino'])), nota, practicar, ts: 0 };
    }
  }
  db.sembrada = hoy;
  escribir(KEY, JSON.stringify(db));
}
refrescarDemo();
document.addEventListener('visibilitychange', () => { if (!document.hidden) { refrescarDemo(); render(); } });

if (history.state?.depth) history.replaceState(null, '');
render();
if (!profe(yoId)) abrir('sheet', hojaQuien, { fijo: true });
