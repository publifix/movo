// Work page: giant kinetic title (width/weight with the scroll), category filters (several at once from
// ?cat=a,b — the Services page links here filtered), offset columns on desktop, hover previews.
import { gsap } from 'gsap';
import { initNav } from '../nav.js';
import { initTimecode } from '../timecode.js';
import { initCardPreviews } from './cards.js';

const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');
initNav({ labels: UI.a11y });
initTimecode();

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = v => Math.min(1, Math.max(0, v));

// ---------- kinetic title ----------
function kinetic() {
  const h1 = document.querySelector('[data-pf-kinetic]');
  if (!h1) return;
  const text = h1.textContent.trim();
  h1.setAttribute('aria-label', text);
  h1.textContent = '';
  const letters = [...text].map(ch => {
    const l = document.createElement('span');
    l.className = 'k-letter';
    l.setAttribute('aria-hidden', 'true');
    l.textContent = ch;
    h1.appendChild(l);
    return l;
  });
  const set = (l, wd, wg) => { l.style.fontStretch = `${wd.toFixed(1)}%`; l.style.fontWeight = wg.toFixed(0); };
  const fit = () => {
    letters.forEach(l => set(l, 125, 900));
    h1.style.fontSize = '';
    const max = h1.parentElement.clientWidth - parseFloat(getComputedStyle(h1.parentElement).paddingLeft) * 2;
    if (h1.scrollWidth > max) h1.style.fontSize = `${parseFloat(getComputedStyle(h1).fontSize) * (max / h1.scrollWidth) * 0.98}px`;
  };
  const intro = { t: reduce ? 1 : 0 };
  const render = () => {
    const p = reduce ? 0 : clamp01(scrollY / (innerHeight * 0.7));
    const n = letters.length;
    letters.forEach((l, i) => {
      const on = clamp01(intro.t * 1.6 - (i / n) * 0.6);   // load: letters inflate one after another
      const s = clamp01(p * 1.5 - (i / n) * 0.5);          // scroll: they condense again, in a wave
      const k = on * (1 - s * 0.8);
      set(l, 62 + 63 * k, 100 + 800 * k);
    });
  };
  fit();
  render();
  h1.classList.add('is-ready');
  addEventListener('resize', () => { fit(); render(); });
  if (reduce) return;
  gsap.to(intro, { t: 1, duration: 1.3, ease: 'power3.out', delay: 0.1, onUpdate: render });
  addEventListener('scroll', () => requestAnimationFrame(render), { passive: true });
}

// ---------- filters + offset columns ----------
function filters() {
  const box = document.querySelector('[data-pf-filters]');
  const grid = document.querySelector('[data-pf-grid]');
  const status = document.querySelector('[data-pf-status]');
  if (!box || !grid) return;
  const items = [...grid.querySelectorAll('.pf__item')];
  const CATS = [...box.querySelectorAll('[data-filter]')].map(b => b.dataset.filter).filter(c => c !== 'all');

  // every second column sits lower (desktop), computed on the visible cards
  const offset = () => {
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    items.filter(li => !li.hidden).forEach((li, i) => li.classList.toggle('is-offset', cols > 2 && (i % cols) % 2 === 1));
  };

  const apply = (cats, { push = true, animate = true } = {}) => {
    const all = !cats.length;
    box.querySelectorAll('[data-filter]').forEach(b =>
      b.setAttribute('aria-pressed', String(all ? b.dataset.filter === 'all' : cats.includes(b.dataset.filter))));
    items.forEach(li => { li.hidden = !all && !cats.includes(li.dataset.category); });
    offset();
    const n = items.filter(li => !li.hidden).length;
    const label = box.querySelector(all ? '[data-filter="all"]' : `[data-filter="${cats[0]}"]`)?.firstChild.textContent.trim();
    if (status) status.textContent = `${label}: ${n}`;
    if (push) {
      const url = new URL(location.href);
      if (all) url.searchParams.delete('cat'); else url.searchParams.set('cat', cats.join(','));
      history.replaceState(history.state, '', url.toString().replace(/%2C/g, ','));
    }
    if (animate && !reduce) {
      gsap.fromTo(items.filter(li => !li.hidden), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out', clearProps: 'opacity,transform' });
    }
    dispatchEvent(new CustomEvent('movo:clips'));
  };

  box.addEventListener('click', e => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    apply(b.dataset.filter === 'all' ? [] : [b.dataset.filter]);
  });
  const fromUrl = (new URLSearchParams(location.search).get('cat') || '').split(',').filter(c => CATS.includes(c));
  apply(fromUrl, { push: false, animate: false });
  addEventListener('resize', offset);
}

kinetic();
filters();
initCardPreviews(document.querySelector('[data-pf-grid]') || document);
document.fonts?.ready.then(() => dispatchEvent(new Event('resize')));
