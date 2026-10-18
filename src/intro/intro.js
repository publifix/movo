/**
 * MOVO · Intro con pantalla de entrada y relevo invisible al sitio.
 * Requiere GSAP 3 en window.gsap. Sin dependencias de framework.
 *
 * Contrato con el sitio:
 *  - El navbar contiene un elemento [data-movo-nav-logo] con el SVG del wordmark (movo-wordmark.svg),
 *    con color volt (#D7FF3B). intro.js lo oculta durante la intro y lo muestra al aterrizar el logo.
 *  - El contenido principal escucha `movo:intro-done` en window para arrancar sus animaciones.
 *  - El <main> queda `inert` durante la intro.
 *
 * Adaptaciones al sitio (no cambian tiempos ni geometría):
 *  - `mainSelector` acepta varios elementos (p. ej. 'main, .site-header'): todos quedan `inert`.
 *  - Quita la clase `intro-pending` del <html> (cortina puesta por el script inline del <head>
 *    para que el sitio no destelle antes de que exista la capa de la intro).
 *  - Emite `movo:intro-start` al entrar.
 *  - `forceMp4`: usa el MP4 sin consultar canPlayType (Safari / iOS).
 *  - La descarga del video empieza cuando la pantalla de entrada ya está pintada.
 *  - Con el video ya en memoria (o en Safari/iOS), la pantalla de entrada se habilita con los metadatos
 *    (iOS no emite `canplaythrough` sin gesto). Si en 3 s no carga, streaming; nunca se queda bloqueada.
 *  - Si el video no arranca a los 4 s de entrar (o falla), se hace el relevo como con Skip.
 *  - `labels`: textos de los botones por idioma ({ enter, enterMuted, enterAria, skip, skipAria }).
 *    Eventos y errores quedan en window.__movoIntro (los muestra ?debug).
 */
const FRAME = { w: 1920, h: 1080 };            // resolución del video
const LOGO_W_IN_FRAME = 1000;                  // ancho del logo completo en el último frame (px de video)
const SVG = { w: 1981, h: 549 };               // sistema de coordenadas de movo-logo-completo.svg
const WORDMARK_BOX = [3, 3, 1978, 446];        // x0, y0, x1, y1 del wordmark en ese sistema
const SUBTITLE_BOX = [320, 497, 1680, 546];    // x0, y0, x1, y1 del subtítulo
const DOT_R = 9;                               // radio del punto en el frame 0 (px de video)
const HANDOFF_AT = 12.5;                       // s — el video está completamente quieto desde 12.4 s
const SEEN_KEY = 'movo-intro-seen';
const FILES = { webm: 'movo-intro-v2-1920x1080.webm', mp4: 'movo-intro-v2-1920x1080.mp4' };

export async function initMovoIntro(opts = {}) {
  const gsap = window.gsap;
  const base = opts.base ?? '/video/intro/';
  const logoBase = opts.logoBase ?? '/logo/';
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const navLogo = document.querySelector('[data-movo-nav-logo]');
  const mains = [...document.querySelectorAll(opts.mainSelector ?? 'main')];
  const done = () => window.dispatchEvent(new CustomEvent('movo:intro-done'));
  const L = { enter: 'Enter', enterMuted: 'Enter without sound', enterAria: 'Entrar a MOVO con sonido', skip: 'Skip', skipAria: 'Saltar intro',
    orbit: 'Motion Design Studio', loading: 'Loading', ready: 'Intro · 13 s · Best with sound', langs: [], ...opts.labels };
  const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // Visita repetida en la sesión o movimiento reducido: directo al sitio
  if (sessionStorage.getItem(SEEN_KEY) || reduce || opts.skip) {
    if (navLogo) gsap.set(navLogo, { opacity: 1 });
    html.classList.remove('intro-pending');
    done();
    return;
  }

  html.classList.add('intro-lock');
  mains.forEach(el => el.setAttribute('inert', ''));
  if (navLogo) gsap.set(navLogo, { opacity: 0 });

  const svgText = async f => (await fetch(logoBase + f)).text();
  const [svgM, svgWord, svgSub] = await Promise.all(['movo-M.svg', 'movo-wordmark.svg', 'movo-subtitle.svg'].map(svgText));

  const root = document.createElement('div');
  root.id = 'movo-intro';
  root.innerHTML = `
    <video playsinline preload="auto"></video>
    <div id="movo-intro-logo" aria-hidden="true">
      <span class="part word">${svgWord}</span><span class="part sub">${svgSub}</span>
    </div>
    <div id="movo-gate">
      <div class="gate-core">
        <!-- who we are, before the video says it: "MOVO · MOTION DESIGN STUDIO" turning around the ring -->
        <svg class="gate-orbit" viewBox="0 0 400 400" aria-hidden="true">
          <defs><path id="gate-orbit-path" d="M200,200 m-176,0 a176,176 0 1,1 352,0 a176,176 0 1,1 -352,0" /></defs>
          <text><textPath href="#gate-orbit-path" textLength="1102" lengthAdjust="spacing">${[0, 1].map(() =>
            `<tspan class="o-brand">MOVO</tspan><tspan class="o-sep"> — </tspan><tspan class="o-line">${esc(L.orbit.toUpperCase())}</tspan><tspan class="o-sep"> — </tspan>`).join('')}</textPath></text>
          <g class="o-ticks">${Array.from({ length: 72 }, (_, i) => `<line x1="200" y1="${i % 6 ? 50 : 46}" x2="200" y2="54" transform="rotate(${i * 5} 200 200)" />`).join('')}</g>
        </svg>
        <svg class="gate-ring" viewBox="0 0 168 168" aria-hidden="true"><circle class="track" cx="84" cy="84" r="82"/><circle class="bar" cx="84" cy="84" r="82"/></svg>
        <button class="gate-m" aria-label="${L.enterAria}" disabled>${svgM}</button>
      </div>
      <div class="gate-actions">
        <button class="gate-enter" disabled>${L.enter}</button>
        <button class="gate-mute" disabled>${L.enterMuted}</button>
        <p class="gate-info" aria-live="polite"><span class="gate-info__rec" aria-hidden="true"></span><span class="gate-info__text">${esc(L.loading)}</span> <span class="gate-info__tc">00:00:00:00</span><span class="gate-info__wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span></p>
      </div>
      ${L.langs.map(l => `<a class="gate-lang" href="${esc(l.href)}" hreflang="${l.code}" lang="${l.code}">${esc(l.name)}</a>`).join('')}
      <div id="movo-dot"></div>
    </div>
    <button id="movo-skip" aria-label="${L.skipAria}">${L.skip}</button>`;
  document.body.appendChild(root);
  html.classList.remove('intro-pending');

  const video = root.querySelector('video');
  const gate = root.querySelector('#movo-gate');
  requestAnimationFrame(() => requestAnimationFrame(() => gate.classList.add('is-on'))); // the orbit arrives
  const logo = root.querySelector('#movo-intro-logo');
  const word = logo.querySelector('.word');
  const sub = logo.querySelector('.sub');
  const dot = root.querySelector('#movo-dot');
  const skipBtn = root.querySelector('#movo-skip');
  const bar = root.querySelector('.gate-ring .bar');
  const info = root.querySelector('.gate-info');
  const infoTc = info.querySelector('.gate-info__tc');
  // the download fills the 13.4 s of the intro: a timecode (24 fps) that runs with the progress
  const INTRO_S = 13.4;
  const tc = p => {
    const f = Math.round(p * INTRO_S * 24);
    return `00:00:${String(Math.floor(f / 24)).padStart(2, '0')}:${String(f % 24).padStart(2, '0')}`;
  };
  // the browser speaks the other language: offer it more clearly (never redirect: search engines)
  const nav = (navigator.languages || [navigator.language || '']).map(x => x.slice(0, 2).toLowerCase());
  root.querySelectorAll('.gate-lang').forEach(a => {
    if (nav[0] === a.getAttribute('hreflang')) {
      a.classList.add('is-suggested');
      a.textContent = L.langs.find(l => l.code === a.getAttribute('hreflang'))?.offer || a.textContent;
    }
  });
  const C = 2 * Math.PI * 82;
  bar.style.strokeDasharray = C;
  bar.style.strokeDashoffset = C;
  gsap.set(dot, { xPercent: -50, yPercent: -50, scale: 0 });

  // ---------- geometría: dónde cae el logo del video en esta pantalla ----------
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    const cover = vw / vh >= 1.3;               // en pantallas verticales se usa contain para no recortar la frase
    video.style.objectFit = cover ? 'cover' : 'contain';
    const s = cover ? Math.max(vw / FRAME.w, vh / FRAME.h) : Math.min(vw / FRAME.w, vh / FRAME.h);
    const w = LOGO_W_IN_FRAME * s, h = w * SVG.h / SVG.w;
    Object.assign(logo.style, { width: `${w}px`, height: `${h}px`, left: `${(vw - w) / 2}px`, top: `${(vh - h) / 2}px` });
    const place = (el, [x0, y0, x1]) => Object.assign(el.style, {
      left: `${(x0 / SVG.w) * 100}%`, top: `${(y0 / SVG.h) * 100}%`, width: `${((x1 - x0) / SVG.w) * 100}%`,
    });
    place(word, WORDMARK_BOX);
    place(sub, SUBTITLE_BOX);
    const d = DOT_R * 2 * s;
    Object.assign(dot.style, { width: `${d}px`, height: `${d}px` });
  }
  layout();
  addEventListener('resize', layout);

  // ---------- carga completa del video con progreso (la pantalla de entrada "compra" ese tiempo) ----------
  // La pantalla de entrada se pinta antes de que la descarga compita por la red
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const useWebm = !opts.forceMp4 && video.canPlayType('video/webm; codecs="vp9, opus"') !== '';
  const url = base + (useWebm ? FILES.webm : FILES.mp4);
  let inMemory = false;
  try {
    const res = await fetch(url);
    const total = Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0;
    for (;;) {
      const { done: end, value } = await reader.read();
      if (end) break;
      chunks.push(value);
      got += value.length;
      if (total) { bar.style.strokeDashoffset = C * (1 - got / total); infoTc.textContent = tc(got / total); }
    }
    video.src = URL.createObjectURL(new Blob(chunks, { type: useWebm ? 'video/webm' : 'video/mp4' }));
    inMemory = true;
  } catch {
    video.src = url;                            // respaldo: streaming normal
  }
  bar.style.strokeDashoffset = 0;
  // iOS Safari no precarga datos de medios sin un gesto, así que `canplaythrough` nunca llega antes del clic:
  // con el archivo en memoria, o en Safari/iOS, basta con los metadatos.
  const ready = (light, ms) => new Promise(r => {
    const [need, ev] = light ? [1, 'loadedmetadata'] : [3, 'canplaythrough'];
    if (video.readyState >= need) return r(true);
    video.addEventListener(ev, () => r(true), { once: true });
    setTimeout(() => r(false), ms);
  });
  if (!(await ready(inMemory || opts.forceMp4, 3000)) && inMemory) {
    // La copia en memoria no carga (visto en WebKit): streaming del mismo archivo.
    URL.revokeObjectURL(video.src);
    video.src = url;
    inMemory = false;
    await ready(true, 4000);
  }
  // Pase lo que pase, la pantalla de entrada se habilita: si luego no arranca, el watchdog hace el relevo.
  gate.classList.add('ready');
  root.querySelectorAll('#movo-gate button').forEach(b => { b.disabled = false; });
  infoTc.textContent = '';
  info.querySelector('.gate-info__text').textContent = L.ready;

  // ---------- entrar: la M se contrae en el punto del frame 0 ----------
  let started = false, handed = false;

  // Diagnóstico (lo muestra ?debug) y red de seguridad: si el video no arranca, nadie queda atrapado.
  const diag = (window.__movoIntro = { file: url.split('/').pop(), inMemory, events: [], errors: [] });
  const t0 = performance.now();
  ['loadedmetadata', 'canplay', 'canplaythrough', 'playing', 'waiting', 'stalled', 'ended', 'error'].forEach(ev =>
    video.addEventListener(ev, () => diag.events.push(`${ev}@${Math.round(performance.now() - t0)}`)));
  video.addEventListener('error', () => {
    diag.errors.push(`video error ${video.error?.code ?? '?'}: ${video.error?.message || ''}`);
    if (started) handoff({ fromSkip: true });
  });
  let playing = false;
  video.addEventListener('playing', () => { playing = true; }, { once: true });

  function enter(withSound) {
    if (started) return;
    started = true;
    video.muted = !withSound;
    const p = video.play();                     // dentro del gesto del usuario => el navegador permite sonido
    if (p) p.catch(err => { diag.errors.push(`play(): ${err.name}: ${err.message}`); handoff({ fromSkip: true }); });
    gsap.delayedCall(4, () => { if (!playing && !handed) { diag.errors.push('no playback after 4 s'); handoff({ fromSkip: true }); } });
    window.dispatchEvent(new CustomEvent('movo:intro-start'));
    const m = gate.querySelector('.gate-m');
    m.style.animation = 'none';
    gsap.timeline()
      .to(gate.querySelectorAll('.gate-actions, .gate-ring, .gate-orbit, .gate-lang'), { opacity: 0, duration: 0.2 }, 0)
      .to(m, { scale: 0.08, opacity: 0, duration: 0.3, ease: 'expo.in' }, 0)
      .to(dot, { scale: 1, duration: 0.12, ease: 'power2.out' }, 0.2)
      .set(video, { opacity: 1 }, 0.32)
      .set(gate, { display: 'none' }, 0.34);
    gsap.delayedCall(1.2, () => skipBtn.classList.add('show'));
  }
  gate.querySelector('.gate-m').addEventListener('click', () => enter(true));
  gate.querySelector('.gate-enter').addEventListener('click', () => enter(true));
  gate.querySelector('.gate-mute').addEventListener('click', () => enter(false));

  // ---------- el relevo ----------
  function handoff({ fromSkip = false } = {}) {
    if (handed || !started) return;
    handed = true;
    sessionStorage.setItem(SEEN_KEY, '1');
    skipBtn.remove();
    const tl = gsap.timeline({ onComplete: cleanup });

    // 1) el gemelo HTML aparece exactamente sobre el logo del video (con skip: crossfade desde donde vaya)
    tl.to(logo, { opacity: 1, duration: fromSkip ? 0.25 : 0.15, ease: 'none' }, 0)
      .to(video, { opacity: 0, duration: fromSkip ? 0.3 : 0.2, ease: 'none' }, fromSkip ? 0 : 0.15);
    if (fromSkip) tl.to(video, { volume: 0, duration: 0.4, onComplete: () => video.pause() }, 0);

    // 2) el subtítulo se va; el wordmark viaja al navbar
    tl.to(sub, { opacity: 0, y: 8, duration: 0.35, ease: 'power2.in' }, 0.25);
    if (navLogo) {
      const a = word.getBoundingClientRect();
      const b = navLogo.getBoundingClientRect();
      tl.to(word, {
        x: b.left - a.left, y: b.top - a.top, scale: b.width / a.width,
        transformOrigin: '0 0', duration: 0.95, ease: 'expo.inOut',
      }, 0.35)
        .set(navLogo, { opacity: 1 }, 1.3)
        .set(word, { opacity: 0 }, 1.3);
    }

    // 3) el fondo de la intro se desvanece y el sitio despierta
    tl.to(root, { backgroundColor: 'rgba(11,11,16,0)', duration: 0.6, ease: 'power1.out' }, 0.45)
      .call(() => {
        html.classList.remove('intro-lock');
        mains.forEach(el => el.removeAttribute('inert'));
        done();
      }, null, 0.55);
  }

  function cleanup() {
    root.style.pointerEvents = 'none';
    const remove = () => { removeEventListener('resize', layout); URL.revokeObjectURL(video.src); root.remove(); };
    if (video.paused || video.ended) remove();
    else video.addEventListener('ended', remove, { once: true });   // la cola del audio termina natural
  }

  video.addEventListener('timeupdate', () => { if (video.currentTime >= HANDOFF_AT) handoff(); });
  video.addEventListener('ended', () => handoff());
  skipBtn.addEventListener('click', () => handoff({ fromSkip: true }));
  addEventListener('keydown', e => { if (e.key === 'Escape' && started) handoff({ fromSkip: true }); });
}
