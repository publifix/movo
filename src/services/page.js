// Services page: kinetic H1, index with playhead, service rows (cursor preview / in-row preview),
// "how we work" ruler, morphing formats frame, FAQ accordion. All the text is in the HTML; this only
// adds motion. Reduced motion: no playhead, no cursor preview, no morphing; everything open and static.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initNav } from '../nav.js';
import { initTimecode } from '../timecode.js';
import { previewSrc } from '../video-format.js';

gsap.registerPlugin(ScrollTrigger);

const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');
initNav({ labels: UI.a11y });
initTimecode();

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const wide = matchMedia('(min-width: 900px)');
const clamp01 = v => Math.min(1, Math.max(0, v));
const pad = n => String(n).padStart(2, '0');
const tc = seconds => {
  const f = Math.round(seconds * 24);
  return `00:00:${pad(Math.floor(f / 24))}:${pad(f % 24)}`;
};

// Re-measure the timecode clips whenever ScrollTrigger changes the layout (pins add space).
ScrollTrigger.addEventListener('refresh', () => dispatchEvent(new CustomEvent('movo:clips')));

// ---------- one preview at a time ----------
let playing = null;
function play(v) {
  if (playing && playing !== v) playing.pause();
  playing = v;
  v.play().catch(() => {});
}
function stop(v) {
  v.pause();
  if (playing === v) playing = null;
}

// ---------- kinetic H1: letters change width and weight with the scroll ----------
function kinetic() {
  const h1 = document.querySelector('[data-kinetic]');
  if (!h1 || reduce) return;
  const text = h1.textContent.trim();
  h1.setAttribute('aria-label', text);
  h1.textContent = '';
  const letters = [];
  text.split(/\s+/).forEach((w, wi, all) => {
    const word = document.createElement('span');
    word.className = 'k-word';
    word.setAttribute('aria-hidden', 'true');
    [...w].forEach(ch => {
      const l = document.createElement('span');
      l.className = 'k-letter';
      l.textContent = ch;
      word.appendChild(l);
      letters.push(l);
    });
    h1.appendChild(word);
    if (wi < all.length - 1) h1.appendChild(document.createTextNode(' '));
  });
  // Fit: the longest word at its widest state (wdth 125 / wght 900) must fit the column.
  const fit = () => {
    h1.style.fontSize = '';
    const words = [...h1.querySelectorAll('.k-word')];
    const widest = Math.max(...words.map(w => w.getBoundingClientRect().width));
    const max = h1.clientWidth;
    if (widest > max) h1.style.fontSize = `${parseFloat(getComputedStyle(h1).fontSize) * (max / widest) * 0.98}px`;
  };
  fit();
  addEventListener('resize', fit);

  const n = letters.length;
  const intro = { t: 0 }; // a ripple across the word on load (starts and ends at full width: no jump)
  const render = () => {
    const p = clamp01(scrollY / (h1.offsetTop + h1.offsetHeight * 0.9));
    for (let i = 0; i < n; i++) {
      const k = clamp01(p * 1.7 - (i / n) * 0.7);
      const ripple = Math.sin(p * 16 - i * 0.5) * 0.5 + 0.5;
      const wave = Math.sin(Math.PI * clamp01(intro.t * 2.2 - (i / n) * 1.2));
      const wd = 125 - 63 * k * (0.8 + 0.2 * ripple) - 50 * wave;
      const wg = 900 - 700 * k * (0.85 + 0.15 * ripple) - 500 * wave;
      letters[i].style.fontStretch = `${Math.max(62, wd).toFixed(1)}%`;
      letters[i].style.fontWeight = Math.max(100, wg).toFixed(0);
    }
  };
  gsap.to(intro, { t: 1, duration: 1.6, ease: 'power2.inOut', delay: 0.15, onUpdate: render });
  addEventListener('scroll', () => requestAnimationFrame(render), { passive: true });
  render();
}

// ---------- index: active pillar + playhead; giant numbers breathe with the scroll ----------
function pillarsIndex() {
  const index = document.querySelector('[data-sp-index]');
  const pillars = [...document.querySelectorAll('.pillar')];
  if (!index || !pillars.length) return;
  const links = [...index.querySelectorAll('[data-index-link]')];
  const playhead = index.querySelector('[data-sp-playhead]');
  const nums = pillars.map(p => p.querySelector('[data-pillar-num]'));

  links.forEach(a =>
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(history.state, '', a.getAttribute('href'));
    }),
  );

  let raf = 0;
  const update = () => {
    raf = 0;
    const vh = innerHeight;
    const line = vh * 0.35;
    let current = -1;
    pillars.forEach((p, i) => {
      const r = p.getBoundingClientRect();
      const f = clamp01((line - r.top) / r.height);
      links[i].style.setProperty('--f', f.toFixed(4));
      if (r.top <= line && r.bottom > line) current = i;
      if (!reduce && nums[i]) {
        const t = clamp01((vh - r.top) / (vh * 0.85));
        nums[i].style.fontStretch = `${(62 + 63 * t).toFixed(1)}%`;
        nums[i].style.fontWeight = (250 + 650 * t).toFixed(0);
      }
    });
    links.forEach((a, i) => (i === current ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    if (reduce || !playhead) return;
    playhead.classList.toggle('is-on', current >= 0);
    if (current >= 0) {
      const lineEl = links[current].querySelector('.sp-index__line');
      const base = index.getBoundingClientRect();
      const lr = lineEl.getBoundingClientRect();
      const f = parseFloat(links[current].style.getPropertyValue('--f')) || 0;
      playhead.style.transform = `translate3d(${(lr.left - base.left + f * lr.width).toFixed(1)}px, 0, 0)`;
    }
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
}

// ---------- service rows ----------
function rows() {
  const all = [...document.querySelectorAll('.row')];
  const setOpen = (row, on) => {
    row.classList.toggle('is-open', on);
    row.querySelector('.row__btn').setAttribute('aria-expanded', String(on));
    const v = row.querySelector('.row__preview video');
    if (!on) return stop(v);
    // touch (no cursor): the preview plays inside the open row
    if (!reduce && !finePointer.matches && row.dataset.previewWebm) {
      if (!v.getAttribute('src')) { v.poster = row.dataset.poster; v.preload = 'auto'; v.src = previewSrc(row); }
      play(v);
    }
  };
  all.forEach(row => row.querySelector('.row__btn').addEventListener('click', () => setOpen(row, !row.classList.contains('is-open'))));

  // Posters load only when a row comes near (in-row previews: touch and reduced motion).
  const near = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    near.unobserve(e.target);
    const img = e.target.querySelector('.row__poster');
    if (img && e.target.dataset.poster && (reduce || !finePointer.matches)) img.src = e.target.dataset.poster;
  }), { rootMargin: '400px 0px' });
  all.forEach(r => near.observe(r));
  // An open in-row preview that leaves the screen stops.
  const vis = new IntersectionObserver(entries => entries.forEach(e => {
    const v = e.target.querySelector('.row__preview video');
    if (!e.isIntersecting) stop(v);
    else if (e.target.classList.contains('is-open') && v.getAttribute('src') && !reduce && !finePointer.matches) play(v);
  }));
  all.forEach(r => vis.observe(r));

  // Reduced motion: complete content, every row open (posters only).
  if (reduce) all.forEach(r => setOpen(r, true));

  // Deep link to a service (#logo-animado): open it.
  const fromHash = () => {
    const row = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (row && row.classList.contains('row')) { setOpen(row, true); row.scrollIntoView({ behavior: 'auto' }); }
  };
  fromHash();
  addEventListener('hashchange', fromHash);

  // Desktop: a small preview follows the cursor over the rows.
  if (reduce) return;
  const cursor = document.createElement('div');
  cursor.className = 'sp-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<video muted loop playsinline preload="none" disablepictureinpicture tabindex="-1"></video>';
  document.body.appendChild(cursor);
  const cv = cursor.querySelector('video');
  const qx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
  const qy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
  let over = null;
  const enter = (row, e) => {
    if (!finePointer.matches || !row.dataset.previewWebm) return;
    if (!over) { gsap.set(cursor, { x: e.clientX, y: e.clientY }); }
    over = row;
    cursor.style.setProperty('--pc', getComputedStyle(row).getPropertyValue('--pc'));
    const src = previewSrc(row);
    if (cv.dataset.src !== src) { cv.dataset.src = src; cv.poster = row.dataset.poster; cv.src = src; }
    cursor.classList.add('is-on');
    play(cv);
  };
  const leave = () => {
    over = null;
    cursor.classList.remove('is-on');
    stop(cv);
  };
  document.querySelectorAll('.rows').forEach(list => {
    list.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const row = e.target.closest('.row');
      if (row && row !== over) enter(row, e);
      qx(e.clientX);
      qy(e.clientY);
    });
    list.addEventListener('pointerleave', leave);
  });
  addEventListener('scroll', () => { if (over && !over.matches(':hover')) leave(); }, { passive: true });
}

// ---------- how we work: the playhead lights five keyframes ----------
function processRuler() {
  const pin = document.querySelector('[data-process]');
  if (!pin) return;
  const rail = pin.querySelector('.process__rail');
  const steps = [...pin.querySelectorAll('[data-step]')];
  const playhead = pin.querySelector('[data-process-playhead]');
  const tcEl = pin.querySelector('[data-process-tc]');
  if (reduce) { steps.forEach(s => s.classList.add('is-on')); return; }

  const horizontal = p => {
    const w = rail.querySelector('.process__ruler').offsetWidth;
    playhead.style.transform = `translate3d(${(p * w).toFixed(1)}px, 0, 0)`;
    tcEl.textContent = tc(p * 20);
    steps.forEach(s => s.classList.toggle('is-on', +s.dataset.x <= p + 0.001));
  };
  const vertical = () => {
    const r = rail.getBoundingClientRect();
    const y = clamp01((innerHeight * 0.68 - r.top) / r.height) * r.height;
    playhead.style.height = `${y.toFixed(1)}px`;
    steps.forEach(s => s.classList.toggle('is-on', s.offsetTop + 10 <= y));
  };

  ScrollTrigger.matchMedia({
    '(min-width: 900px)': () => {
      playhead.style.height = '';
      const st = ScrollTrigger.create({
        trigger: pin,
        start: 'top top',
        end: () => `+=${innerHeight * 1.4}`,
        pin: true,
        scrub: true,
        onUpdate: self => horizontal(self.progress),
      });
      horizontal(st.progress);
    },
    '(max-width: 899px)': () => {
      playhead.style.transform = '';
      const onScroll = () => requestAnimationFrame(vertical);
      addEventListener('scroll', onScroll, { passive: true });
      vertical();
      return () => removeEventListener('scroll', onScroll);
    },
  });
}

// ---------- formats: one frame morphs 9:16 → 1:1 → 4:5 → 16:9 → custom ----------
function formats() {
  const pin = document.querySelector('[data-formats]');
  if (!pin || reduce) return;
  const stages = JSON.parse(pin.dataset.stages);
  const frame = pin.querySelector('[data-format-frame]');
  const stage = pin.querySelector('.formats__stage');
  const ratioEl = pin.querySelector('[data-format-ratio]');
  const items = [...pin.querySelectorAll('.fmt')];
  pin.classList.add('formats--live');

  const size = s => {
    const maxW = stage.clientWidth * 0.92;
    const maxH = Math.max(160, stage.clientHeight * 0.92);
    const w = Math.min(maxW, (maxH * s.w) / s.h);
    return { width: w, height: (w * s.h) / s.w };
  };
  let shown = -1;
  const show = i => {
    if (i === shown) return;
    shown = i;
    const s = stages[i];
    // "custom" has no fixed ratio: the frame shows its name instead (the 32:9 shape is only illustrative)
    const custom = s.format === 'custom';
    ratioEl.textContent = custom ? items.find(it => it.dataset.format === 'custom').querySelector('.fmt__name').textContent : s.ratio;
    frame.classList.toggle('is-custom', custom);
    items.forEach(it => it.classList.toggle('is-on', it.dataset.format === s.format));
  };

  const HOLD = 0.6; // time each format stays still between morphs
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => `+=${innerHeight * 3}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
    onUpdate() {
      // which stage is the frame closest to
      const t = this.time();
      const i = Math.min(stages.length - 1, Math.round(Math.max(0, t - HOLD / 2) / (1 + HOLD)));
      show(i);
    },
  });
  tl.set(frame, { width: () => size(stages[0]).width, height: () => size(stages[0]).height }, 0);
  stages.slice(1).forEach((s, k) => {
    tl.to(frame, { width: () => size(s).width, height: () => size(s).height, duration: 1 }, HOLD + k * (1 + HOLD));
  });
  tl.to({}, { duration: HOLD }); // hold the last one
  show(0);
}

// ---------- FAQ: sober accordion (real buttons, aria-expanded) ----------
function faq() {
  document.querySelectorAll('.faq__item').forEach(item => {
    const btn = item.querySelector('button');
    btn.addEventListener('click', () => {
      const on = !item.classList.contains('is-open');
      item.classList.toggle('is-open', on);
      btn.setAttribute('aria-expanded', String(on));
    });
  });
}

kinetic();
pillarsIndex();
rows();
faq();
processRuler();
formats();
// Pins changed the page height: re-measure the timecode clips once fonts/layout settle.
addEventListener('load', () => ScrollTrigger.refresh());
