// Privacy notice: the index marks the section being read (aria-current) and scrolls smoothly to a section.
import { initNav } from '../nav.js';
import { initTimecode } from '../timecode.js';

const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');
initNav({ labels: UI.a11y });
initTimecode();

const links = [...document.querySelectorAll('[data-lg-link]')];
const sections = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
const mark = id => links.forEach(a => (a.hash === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
if ('IntersectionObserver' in window && sections.length) {
  const visible = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    const first = sections.find(s => visible.has(s));
    if (first) mark(first.id);
  }, { rootMargin: '-20% 0px -60% 0px' });
  sections.forEach(s => io.observe(s));
}
