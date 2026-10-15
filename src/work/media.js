// Video budget for the whole page: never more than MAX_PLAYING videos playing at once. Any video that
// starts playing (hero, transition card, previews, player) goes through the same guard; when the
// budget is exceeded, the one that has been playing longest is paused (never the player).
export const MAX_PLAYING = 3;

let preferMp4 = false;
const order = []; // playing videos, oldest first

export function initMedia(opts) {
  preferMp4 = opts.preferMp4;
  document.addEventListener('playing', e => {
    const v = e.target;
    if (!(v instanceof HTMLVideoElement)) return;
    const i = order.indexOf(v);
    if (i !== -1) order.splice(i, 1);
    order.push(v);
    const live = order.filter(x => !x.paused);
    while (live.length > MAX_PLAYING) {
      const victim = live.find(x => x !== v && !x.matches('[data-player-video]'));
      if (!victim) break;
      victim.pause();
      live.splice(live.indexOf(victim), 1);
    }
  }, true);
  const drop = e => { const i = order.indexOf(e.target); if (i !== -1) order.splice(i, 1); };
  document.addEventListener('pause', drop, true);
  document.addEventListener('emptied', drop, true);
}

export const playingCount = () => [...document.querySelectorAll('video')].filter(v => !v.paused && !v.ended).length;

const canWebm = () => !preferMp4 && document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '';

/** Poster of a card: data-src → src (only called once the visitor has scrolled). */
export function loadPoster(card) {
  const img = card.querySelector('.reel__poster');
  if (img && !img.getAttribute('src') && img.dataset.src) img.src = img.dataset.src;
}

/** Attach the preview source to a card's <video> (one file: WebM or MP4). */
export function loadPreview(card, preload = 'metadata') {
  const v = card.querySelector('.reel__video');
  if (!v) return null;
  if (!v.getAttribute('src')) {
    v.preload = preload;
    v.src = canWebm() ? card.dataset.previewWebm : card.dataset.previewMp4;
  } else if (preload === 'auto') {
    v.preload = 'auto';
  }
  return v;
}

/** Free a far-away preview (mobile feed keeps memory low). */
export function unloadPreview(card) {
  const v = card.querySelector('.reel__video');
  if (!v || !v.getAttribute('src')) return;
  v.pause();
  v.removeAttribute('src');
  v.load();
  card.classList.remove('is-playing');
}

export function playPreview(card) {
  const v = loadPreview(card, 'auto');
  if (!v) return;
  const p = v.play();
  if (p) p.then(() => card.classList.add('is-playing')).catch(() => {});
}

export function pausePreview(card) {
  const v = card.querySelector('.reel__video');
  if (v && !v.paused) v.pause();
  card.classList.remove('is-playing');
}
