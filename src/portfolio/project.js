// Project page: the full video only downloads when the visitor presses play (720p on phones/tablets,
// 1080p on desktop, with sound); ← → go to the previous / next project; hover previews in "more".
import { initNav } from '../nav.js';
import { initTimecode } from '../timecode.js';
import { initCardPreviews } from './cards.js';

const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');
initNav({ labels: UI.a11y });
initTimecode();

const video = document.querySelector('[data-pj-video]');
const play = document.querySelector('[data-pj-play]');
if (video && play) {
  // the HTML has native controls and the 720p file (works without JS); here: one big play button
  video.controls = false;
  play.hidden = false;
  const small = matchMedia('(max-width: 1023px), (pointer: coarse)').matches;
  play.addEventListener('click', () => {
    if (!small && video.dataset.full) video.src = video.dataset.full;
    video.controls = true;
    video.muted = false;
    play.hidden = true;
    video.play().catch(() => {});
    video.focus({ preventScroll: true });
  });
}

addEventListener('keydown', e => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest('input, textarea, select, video, [contenteditable]')) return;
  const rel = e.key === 'ArrowLeft' ? 'prev' : e.key === 'ArrowRight' ? 'next' : null;
  const a = rel && document.querySelector(`.pj-steps a[rel="${rel}"]`);
  if (a) location.href = a.href;
});

initCardPreviews(document.querySelector('.pj-more') || document);
