// Full-screen reel player. The full video only downloads when the player opens (src set on open,
// removed on close). Accessible: role="dialog" + aria-modal, the rest of the page is `inert` (focus
// can't leave), visible close button, Esc / ← → / swipe, focus returns to the card that opened it.
import { gsap } from 'gsap';

export function createPlayer({ ui, reduce, getCards }) {
  const L = { label: 'Video player', close: 'Close', prev: 'Previous', next: 'Next', of: 'of', ...ui.player };
  const el = document.createElement('div');
  el.className = 'player';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'player-title');
  el.innerHTML = `
    <div class="player__stage">
      <video class="player__video" data-player-video playsinline controls preload="none"></video>
    </div>
    <div class="player__bar">
      <div class="player__meta">
        <p class="player__count" data-count></p>
        <h2 class="player__title" id="player-title" data-title></h2>
        <p class="player__info"><span data-client></span> · <span class="player__cat" data-cat></span></p>
        <p class="player__desc" data-desc hidden></p>
        <a class="player__project" data-project href="#">${L.project || 'View project'} <span aria-hidden="true">→</span></a>
      </div>
      <div class="player__nav">
        <button type="button" class="player__btn" data-prev aria-label="${L.prev}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button type="button" class="player__btn" data-next aria-label="${L.next}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
    <button type="button" class="player__close" data-close aria-label="${L.close}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>`;
  el.setAttribute('aria-label', L.label);
  document.body.appendChild(el);

  const video = el.querySelector('video');
  const small = matchMedia('(max-width: 1023px), (pointer: coarse)');
  // same query as the side-by-side layout in work.css: only there is the description shown
  const side = matchMedia('(min-width: 900px) and (orientation: landscape)');
  const $ = s => el.querySelector(s);
  const outside = () => [...document.body.children].filter(n => n !== el && n.tagName !== 'SCRIPT');
  let list = [];
  let index = 0;
  let opener = null;

  function show(i) {
    index = (i + list.length) % list.length;
    const card = list[index];
    // phones: the short title if the reel has one
    const t = $('[data-title]');
    t.textContent = (!side.matches && card.dataset.titleShort) || card.dataset.title;
    $('[data-client]').textContent = card.dataset.client;
    $('[data-project]').href = card.href; // the project page (indexable; the card's no-JS link)
    $('[data-cat]').textContent = card.dataset.categoryLabel;
    const desc = $('[data-desc]');
    desc.textContent = card.dataset.desc || '';
    desc.hidden = !card.dataset.desc;
    $('[data-count]').textContent = `${String(index + 1).padStart(2, '0')} ${L.of} ${String(list.length).padStart(2, '0')}`;
    video.poster = card.dataset.poster;
    // the card's real proportion (set on its item when the video is not 9:16)
    const ar = getComputedStyle(card.closest('.work__item') || card).getPropertyValue('--ar').trim();
    el.style.setProperty('--player-ar', ar || '9 / 16');
    // only now does the full video download: 720p on phones/tablets, 1080p on desktop (Bunny MP4)
    video.src = (small.matches && card.dataset.fullMobile) || card.dataset.full;
    video.muted = false;
    const p = video.play();
    if (p) p.catch(() => {}); // e.g. autoplay with sound refused: the native controls stay available
    if (!reduce) gsap.fromTo(el.querySelector('.player__stage'), { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
  }

  function open(card) {
    list = getCards();
    opener = card;
    document.querySelectorAll('.reel__video').forEach(v => v.pause());
    document.querySelectorAll('[data-hero-video], [data-card-video]').forEach(v => v.pause());
    outside().forEach(n => n.setAttribute('inert', ''));
    document.documentElement.classList.add('player-open');
    el.hidden = false;
    show(Math.max(0, list.indexOf(card)));
    $('[data-close]').focus();
  }

  function close() {
    if (el.hidden) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    el.hidden = true;
    outside().forEach(n => n.removeAttribute('inert'));
    document.documentElement.classList.remove('player-open');
    window.dispatchEvent(new CustomEvent('movo:player-closed'));
    opener?.focus({ preventScroll: true });
  }

  $('[data-close]').addEventListener('click', close);
  $('[data-prev]').addEventListener('click', () => show(index - 1));
  $('[data-next]').addEventListener('click', () => show(index + 1));
  el.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight' && e.target !== video) { e.preventDefault(); show(index + 1); }
    else if (e.key === 'ArrowLeft' && e.target !== video) { e.preventDefault(); show(index - 1); }
    else if (e.key === 'Tab') {
      // keep focus inside (the page behind is inert; this also wraps within the dialog)
      const f = [...el.querySelectorAll('button, video')].filter(n => !n.hidden);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  // swipe: horizontal → previous / next, down → close
  let sx = 0, sy = 0, tracking = false;
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    tracking = true; sx = e.clientX; sy = e.clientY;
  });
  el.addEventListener('pointerup', e => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
  });

  return { open, close, get isOpen() { return !el.hidden; }, el, video };
}
