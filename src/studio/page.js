// Studio page: kinetic hero (two lines, variable width/weight with the scroll), the page as a ruler,
// client marquee, manifesto revealed word by word + giant closing lines, Publifix Network diagram drawn
// with the scroll (pulses travel on the lines in CSS). All the text is in the HTML; this only adds
// motion. Reduced motion: fitted, static and fully legible (no letter motion, no reveal, no pulses).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initNav } from '../nav.js';
import { initTimecode } from '../timecode.js';
import { initMarquees } from './marquee.js';

gsap.registerPlugin(ScrollTrigger);

const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');
initNav({ labels: UI.a11y });
initTimecode();
ScrollTrigger.addEventListener('refresh', () => dispatchEvent(new CustomEvent('movo:clips')));

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = v => Math.min(1, Math.max(0, v));
const wide = () => innerWidth >= 700;

// ---------- kinetic lines: split into letters, fitted at their widest state ----------
// `lines` are block elements; on wide screens each stays on one line, on phones words may wrap.
function kinetic(box, lines) {
  const label = lines.map(l => l.textContent.trim()).join(' ');
  box.setAttribute('aria-label', label);
  const rows = lines.map(line => {
    const letters = [];
    const words = line.textContent.trim().split(/\s+/);
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    words.forEach((w, wi) => {
      const word = document.createElement('span');
      word.className = 'k-word';
      [...w].forEach(ch => {
        const l = document.createElement('span');
        l.className = 'k-letter';
        l.textContent = ch;
        word.appendChild(l);
        letters.push(l);
      });
      line.appendChild(word);
      if (wi < words.length - 1) line.appendChild(document.createTextNode(' '));
    });
    return { line, letters };
  });
  // Fit: every line (or, on phones, every word) at wdth 125 / wght 900 fits the column.
  const fit = () => {
    rows.forEach(r => r.letters.forEach(l => { l.style.fontStretch = '125%'; l.style.fontWeight = 900; }));
    box.style.fontSize = '';
    const max = box.clientWidth;
    const units = wide() ? rows.map(r => r.line) : [...box.querySelectorAll('.k-word')];
    const widest = Math.max(...units.map(u => (wide() ? u.scrollWidth : u.getBoundingClientRect().width)));
    if (widest > max) box.style.fontSize = `${parseFloat(getComputedStyle(box).fontSize) * (max / widest) * 0.98}px`;
  };
  return { rows, fit };
}

const setLetter = (l, wd, wg) => {
  l.style.fontStretch = `${Math.min(125, Math.max(62, wd)).toFixed(1)}%`;
  l.style.fontWeight = Math.min(900, Math.max(100, wg)).toFixed(0);
};

// ---------- (A) hero ----------
function hero() {
  const h1 = document.querySelector('[data-st-kinetic]');
  if (!h1) return;
  const k = kinetic(h1, [...h1.querySelectorAll('[data-st-line]')]);
  const [a, b] = k.rows;
  const intro = { t: reduce ? 1 : 0 };
  // Line 1 starts black and wide and condenses with the scroll; line 2 does the opposite.
  const render = () => {
    const p = reduce ? 0 : clamp01(scrollY / (innerHeight * 0.9));
    [a, b].forEach((row, r) => {
      const n = row.letters.length;
      row.letters.forEach((l, i) => {
        const s = clamp01(p * 1.6 - (i / n) * 0.6); // a wave along the line
        const on = clamp01(intro.t * 1.8 - (i / n) * 0.8); // load: letters arrive one after another
        const v = r === 0 ? 1 - s * 0.85 : 0.15 + s * 0.85;
        setLetter(l, 62 + 63 * v * on, 100 + 800 * v * on + (r ? 150 * (1 - on) : 0));
        l.style.opacity = reduce ? '' : on.toFixed(3);
      });
    });
  };
  const refit = () => { k.fit(); render(); };
  refit();
  h1.classList.add('is-ready');
  if (reduce) { addEventListener('resize', refit); return; }
  gsap.to(intro, { t: 1, duration: 1.4, ease: 'power3.out', delay: 0.1, onUpdate: render });
  addEventListener('scroll', () => requestAnimationFrame(render), { passive: true });
  addEventListener('resize', refit);
}

// ---------- the page as a ruler: one marker per section, playhead = scroll ----------
function ruler() {
  const el = document.querySelector('[data-st-ruler]');
  if (!el) return;
  el.querySelector('[data-st-ruler-tc]')?.remove();
  const clips = [...document.querySelectorAll('main [data-clip]')];
  const marks = clips.map(c => {
    const m = document.createElement('i');
    m.className = 'st-ruler__mark';
    m.innerHTML = `<span>${c.dataset.clipLabel || ''}</span>`;
    el.appendChild(m);
    return m;
  });
  const place = () => {
    const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    clips.forEach((c, i) => marks[i].style.setProperty('--x', clamp01((c.getBoundingClientRect().top + scrollY) / total).toFixed(4)));
  };
  const update = () => {
    const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = clamp01(scrollY / total);
    el.style.setProperty('--p', p.toFixed(4));
    marks.forEach(m => m.classList.toggle('is-on', parseFloat(m.style.getPropertyValue('--x')) <= p + 0.002));
  };
  place();
  update();
  ScrollTrigger.addEventListener('refresh', () => { place(); update(); });
  addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
}

// ---------- (C) manifesto: words from dim to white with the scroll; giant closing lines ----------
function manifesto() {
  const body = document.querySelector('[data-st-mf]');
  if (!body) return;
  const words = [];
  body.querySelectorAll('[data-st-reveal]').forEach(p => {
    const parts = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    parts.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'st-mf__w';
      s.textContent = w;
      p.appendChild(s);
      if (i < parts.length - 1) p.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  });
  const rail = body.querySelector('.st-mf__rail');
  if (!reduce) {
    rail.style.setProperty('--p', 0);
    let lit = 0;
    ScrollTrigger.create({
      trigger: body,
      start: 'top 75%',
      end: 'bottom 45%',
      onUpdate(self) {
        const n = Math.round(self.progress * words.length);
        if (n !== lit) {
          const [from, to, on] = n > lit ? [lit, n, true] : [n, lit, false];
          for (let i = from; i < to; i++) words[i].classList.toggle('is-on', on);
          lit = n;
        }
        rail.style.setProperty('--p', self.progress.toFixed(4));
      },
    });
  }

  // closing: each line inflates (thin/condensed → black/wide) as it rises through the screen
  const close = document.querySelector('[data-st-close]');
  const k = kinetic(close, [...close.querySelectorAll('[data-st-line]')]);
  const render = () => {
    const vh = innerHeight;
    k.rows.forEach(row => {
      const r = row.line.getBoundingClientRect();
      const p = reduce ? 1 : clamp01((vh * 0.95 - r.top) / (vh * 0.55));
      const n = row.letters.length;
      row.letters.forEach((l, i) => {
        const s = clamp01(p * 1.5 - (i / n) * 0.5);
        setLetter(l, 62 + 63 * s, 120 + 780 * s);
      });
    });
  };
  const refit = () => { k.fit(); render(); };
  refit();
  addEventListener('resize', refit);
  if (!reduce) addEventListener('scroll', () => requestAnimationFrame(render), { passive: true });
}

// ---------- (D) Publifix Network: lines drawn with the scroll, nodes arrive with their line ----------
function network() {
  const sec = document.querySelector('.net');
  const map = sec?.querySelector('[data-net]');
  if (!map || reduce) { sec?.classList.add('is-drawn'); return; }
  const lines = [...map.querySelectorAll('[data-net-line]')];
  const nodes = [...map.querySelectorAll('[data-net-node]')];
  const list = map.querySelector('.net__list');
  sec.classList.add('net--anim');
  const n = lines.length;
  const draw = p => {
    lines.forEach((path, i) => {
      const s = clamp01((p - (i / n) * 0.45) / 0.5); // staggered: one line after another
      path.style.strokeDashoffset = (100 - s * 100).toFixed(2);
      nodes[i]?.classList.toggle('is-on', s > 0.92);
    });
    list.style.setProperty('--draw', clamp01(p * 1.15).toFixed(4));
    sec.classList.toggle('is-drawn', p >= 0.98);
  };
  draw(0);
  ScrollTrigger.create({
    trigger: map,
    start: 'top 80%',
    end: 'center 50%',
    scrub: 0.5,
    onUpdate: self => draw(self.progress),
    onRefresh: self => draw(self.progress),
  });
}

hero();
ruler();
initMarquees();
manifesto();
network();
// fonts change every measured width: fit and measure again once Archivo is in
document.fonts?.ready.then(() => { dispatchEvent(new Event('resize')); ScrollTrigger.refresh(); });
