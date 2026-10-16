// Work: hero → work transition, kinetic manifesto, film strip (landscape) / reels feed (portrait),
// hover scrub, category filters and the player. Loaded on the first scroll intent (src/main.js), so
// none of this — code, styles, posters, previews — weighs on the first load.
//
// Modes (rebuilt on resize / orientation change):
//   strip — landscape: pinned scene; scroll drives hero → card → horizontal film strip
//   feed  — portrait: pinned hero → card → full-screen reels feed (nested scroll-snap, like Reels)
//   grid  — prefers-reduced-motion: no pin, no horizontal scroll, no scrub; a simple poster grid
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import './work.css';
import { initMedia, loadPoster, loadPreview, unloadPreview, playPreview, pausePreview } from './media.js';
import { createPlayer } from './player.js';

gsap.registerPlugin(ScrollTrigger, Flip);

const ACTIVE_SCALE = 1.12;   // strip: the centered card grows
const T1 = 1.1;              // hero → card + manifesto (viewport heights of scroll)
const T2 = 0.75;             // card → first slot of the strip / full-screen feed item

export function initWork({ ui, preferMp4 }) {
  const html = document.documentElement;
  const scene = document.querySelector('[data-scene]');
  const hero = scene?.querySelector('.hero');
  const work = scene?.querySelector('[data-work]');
  const track = work?.querySelector('[data-work-track]');
  if (!scene || !hero || !work || !track) return;

  initMedia({ preferMp4 });
  // Real reels stream from the CDN (Bunny): open the connection now that Work is on its way
  // (only after the first scroll: nothing of this happens on the first load).
  const cdn = [...document.querySelectorAll('.reel[data-poster^="http"]')].map(c => new URL(c.dataset.poster).origin)[0];
  if (cdn && !document.querySelector(`link[rel="preconnect"][href="${cdn}"]`)) {
    const l = document.createElement('link');
    l.rel = 'preconnect';
    l.href = cdn;
    document.head.appendChild(l);
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...track.querySelectorAll('.work__item')];
  const cards = items.map(li => li.querySelector('.reel'));
  const visibleCards = () => cards.filter(c => !c.closest('.work__item').hidden);
  const player = createPlayer({ ui, reduce, getCards: visibleCards });

  // Cards open the player (the href stays as a no-JS fallback to the video file).
  track.addEventListener('click', e => {
    const card = e.target.closest('.reel');
    if (!card) return;
    e.preventDefault();
    player.open(card);
  });

  const heroVideo = hero.querySelector('[data-hero-video]');
  let mode = null;
  let ctx = null;          // gsap.context of the current mode (reverted on rebuild)
  let cleanup = [];        // listeners / observers of the current mode
  let stripStart = 0;      // scroll position where the strip starts (nav links, #hash; phones use Work's top)

  const modeFor = () => (reduce ? 'grid' : innerHeight > innerWidth ? 'feed' : 'strip');

  function teardown() {
    cleanup.forEach(fn => fn());
    cleanup = [];
    ctx?.revert();
    ctx = null;
    html.classList.remove('work-strip', 'work-feed', 'work-grid');
    cards.forEach(c => pausePreview(c));
    delete work.dataset.clipStart;
  }

  function build() {
    teardown();
    mode = modeFor();
    html.classList.add(`work-${mode}`);
    ctx = gsap.context(() => (mode === 'grid' ? buildGrid() : mode === 'strip' ? buildStrip() : buildFeed()), scene);
    ScrollTrigger.refresh();
    window.dispatchEvent(new CustomEvent('movo:clips'));
  }

  // ---------- grid (reduced motion) ----------
  function buildGrid() {
    cards.forEach(c => {
      const img = c.querySelector('.reel__poster');
      img.loading = 'lazy';
      loadPoster(c);
    });
  }

  // ---------- shared: the card that the hero shrinks into ----------
  function makeSceneCard() {
    const el = document.createElement('div');
    el.className = 'scene-card';
    el.innerHTML = '<video data-card-video muted loop playsinline preload="auto" aria-hidden="true" tabindex="-1"></video>';
    const v = el.querySelector('video');
    // the transition lands on the first visible reel (reel-01 unless filtered): same preview file
    const first = visibleCards()[0];
    v.src = (preferMp4 || document.createElement('video').canPlayType('video/webm; codecs="vp9"') === '')
      ? first.dataset.previewMp4 : first.dataset.previewWebm;
    v.poster = first.dataset.poster;
    scene.appendChild(el);
    cleanup.push(() => { v.pause(); v.removeAttribute('src'); v.load(); el.remove(); });
    return { el, video: v };
  }

  // ---------- kinetic manifesto: letters change width and weight with the scroll ----------
  function makeManifesto() {
    const box = scene.querySelector('[data-manifesto]');
    const originals = [...box.querySelectorAll('[data-manifesto-line]')].map(p => p.innerHTML);
    const letters = [];
    box.querySelectorAll('[data-manifesto-line]').forEach(p => {
      const words = p.textContent.trim().split(/\s+/);
      p.textContent = '';
      p.setAttribute('aria-label', words.join(' '));
      words.forEach((w, wi) => {
        const ws = document.createElement('span');
        ws.className = 'm-word';
        ws.setAttribute('aria-hidden', 'true');
        [...w].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'm-letter';
          s.textContent = ch;
          ws.appendChild(s);
          letters.push(s);
        });
        p.appendChild(ws);
        if (wi < words.length - 1) p.appendChild(document.createTextNode(' '));
      });
    });
    // Size at the widest state (wdth 125 / wght 900) so narrower frames never re-wrap the lines.
    const fit = () => {
      letters.forEach(l => { l.style.fontWeight = 900; l.style.fontStretch = '125%'; });
      box.style.fontSize = '';
      const maxW = box.clientWidth;
      const widest = Math.max(...[...box.querySelectorAll('[data-manifesto-line]')].map(p => p.scrollWidth));
      if (widest > maxW) box.style.fontSize = `${parseFloat(getComputedStyle(box).fontSize) * (maxW / widest) * 0.98}px`;
      fullHeight = box.offsetHeight; // height at the widest state (in page flow it is reserved: no shift)
    };
    let fullHeight = 0;
    fit();
    const n = letters.length;
    // p: 0..1 through the manifesto's life. Letters inflate one after another (thin/condensed →
    // black/wide) with a ripple that keeps moving while you scroll; scrolling back deflates them.
    const render = p => {
      for (let i = 0; i < n; i++) {
        const k = Math.min(1, Math.max(0, p * 1.8 - (i / n) * 0.8));
        const ripple = Math.sin(p * 18 - i * 0.45) * 0.5 + 0.5;
        const wd = 62 + 63 * k * (0.82 + 0.18 * ripple);
        const wg = 150 + 750 * k * (0.86 + 0.14 * ripple);
        letters[i].style.fontStretch = `${wd.toFixed(1)}%`;
        letters[i].style.fontWeight = wg.toFixed(0);
        letters[i].style.opacity = Math.min(1, k * 2.5).toFixed(3);
      }
    };
    render(0);
    cleanup.push(() => {
      box.querySelectorAll('[data-manifesto-line]').forEach((p, i) => { p.innerHTML = originals[i]; p.removeAttribute('aria-label'); });
      box.style.fontSize = '';
    });
    return { box, render, fullHeight };
  }

  const rectOf = el => el.getBoundingClientRect();
  const clipFor = (r, radius) =>
    `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${radius}px)`;

  // Watch whether the scene is on screen at all (pause everything when it isn't).
  function watchScene(onChange) {
    // (entries with a zero-size rect come from the pin re-parenting the scene: ignore them)
    const io = new IntersectionObserver(entries => {
      const e = entries.at(-1);
      if (e.boundingClientRect.height === 0) return;
      onChange(e.isIntersecting);
    }, { threshold: 0 });
    io.observe(scene);
    cleanup.push(() => io.disconnect());
  }

  // ---------- strip (landscape) ----------
  function buildStrip() {
    const media = hero.querySelector('.hero__media');
    const copy = hero.querySelector('.hero__content');
    const head = work.querySelector('.work__head');
    const manifesto = makeManifesto();
    const card = makeSceneCard();
    cards.forEach(loadPoster.bind(null)); // posters only (~25 KB each); previews load when needed

    // Geometry (layout positions, track at x = 0)
    const cardW = items[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const visible = () => items.filter(li => !li.hidden);
    const centers = () => visible().map(li => li.offsetLeft + li.offsetWidth / 2);
    const startX = () => innerWidth / 2 - centers()[0];             // first visible card centered
    const distance = () => Math.max(0, centers().at(-1) - centers()[0]);
    const firstMedia = () => visible()[0].querySelector('.reel__media');

    // C: the big centered card the hero shrinks into; S0: the first slot of the strip (active size)
    const C = () => {
      const h = Math.min(innerHeight * 0.74, (innerWidth * 0.4 * 16) / 9);
      const w = (h * 9) / 16;
      return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2 + innerHeight * 0.02, width: w, height: h };
    };
    const asRect = o => ({ ...o, right: o.left + o.width, bottom: o.top + o.height });
    const vh = innerHeight;
    const dist = distance();
    const total = (T1 + T2) * vh + dist;

    // Measured once per build (the scene is rebuilt on resize / filter): strip at its start position.
    gsap.set(track, { x: startX() });
    const S0 = (() => {
      const r = rectOf(firstMedia());
      const w = r.width * ACTIVE_SCALE, h = r.height * ACTIVE_SCALE;
      return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
    })();
    const Cr = C();

    // Playback state (declared before the timeline: ScrollTrigger may call back on refresh)
    let active = null;
    let onScreen = true;
    let firstSwap = false;
    let hovered = null;
    gsap.set(card.el, { ...Cr, opacity: 0 });
    // offsets grow with the index so the staggered entrance never makes two cards overlap
    gsap.set(visible(), { opacity: 0, x: i => innerWidth * (0.3 + i * 0.05) });
    gsap.set(head, { opacity: 0, y: 24 });
    work.style.pointerEvents = 'none';

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: () => `+=${total}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
      // the timeline's own update (not the trigger's): it keeps firing while the scrub catches up
      onUpdate() { onStripUpdate(this.progress()); },
    });

    // phase 1 — the hero becomes a 9:16 card; the manifesto inflates around it
    tl.to(copy, { opacity: 0, y: '-=40', duration: T1 * 0.3 }, 0)
      .fromTo(media, { clipPath: clipFor(asRect({ left: 0, top: 0, width: innerWidth, height: innerHeight }), 0) },
        { clipPath: clipFor(asRect(Cr), 18), duration: T1 * 0.75, ease: 'power2.inOut' }, 0)
      // the card only appears once the hero's clip has landed exactly on it (a cross-fade on one rectangle):
      // fading it in while the clip was still shrinking showed its empty frame as a "ghost" inside the hero
      .to(card.el, { opacity: 1, duration: T1 * 0.15 }, T1 * 0.75)
      .set(media, { autoAlpha: 0 }, T1 * 0.92)
      // phase 2 — the card slides into the first slot while the other reels enter; manifesto leaves
      .to(card.el, { ...S0, duration: T2, ease: 'power3.inOut' }, T1)
      .to(manifesto.box, { opacity: 0, scale: 1.06, duration: T2 * 0.35, ease: 'power2.in' }, T1)
      .to(visible().slice(1), { opacity: 1, x: 0, duration: T2 * 0.7,
        stagger: T2 * 0.05, ease: 'power3.out' }, T1 + T2 * 0.25)
      .to(head, { opacity: 1, y: 0, duration: T2 * 0.5 }, T1 + T2 * 0.45)
      // phase 3 — the film strip: vertical scroll moves the reels horizontally
      .to(track, { x: startX() - dist, duration: Math.max(0.001, dist / vh) }, T1 + T2);

    const p1 = T1 / (T1 + T2 + dist / vh);
    const p2 = (T1 + T2) / (T1 + T2 + dist / vh);
    const st = tl.scrollTrigger;
    stripStart = st.start + (T1 + T2) * vh;
    work.dataset.clipStart = String(Math.round(st.start + T1 * vh));

    // What plays: hero (phase 1), the scene card (late phase 1–2), the active strip card (phase 3).
    function onStripUpdate(p, resume = false) {
      // the manifesto starts once the hero copy is gone
      manifesto.render(Math.max(0, Math.min(1, (p - p1 * 0.25) / (p2 - p1 * 0.25))));
      const swapped = p >= p2 - 0.002;
      // hand-off: the moving card becomes the real first reel (same file, same frame)
      if (swapped && !firstSwap) swapToStrip();
      else if (!swapped && firstSwap) swapToCard();
      if (p < p1 * 0.95) { onScreen && heroVideo?.paused && heroVideo.getAttribute('src') && heroVideo.play().catch(() => {}); }
      else if (!heroVideo?.paused) heroVideo.pause();
      if (!swapped && p > p1 * 0.45) { if (onScreen && card.video.paused) card.video.play().catch(() => {}); }
      else if (!card.video.paused) card.video.pause();
      work.style.pointerEvents = p >= p2 * 0.98 ? '' : 'none';
      if (swapped) updateActive(resume);
    }

    function swapToStrip() {
      firstSwap = true;
      const first = visible()[0].querySelector('.reel');
      const v = loadPreview(first, 'auto');
      if (v && card.video.readyState > 0) { try { v.currentTime = card.video.currentTime; } catch {} }
      gsap.set(visible()[0], { opacity: 1, x: 0 });
      gsap.set(card.el, { visibility: 'hidden' });
      card.video.pause();
    }
    function swapToCard() {
      firstSwap = false;
      gsap.set(card.el, { visibility: 'visible' });
      gsap.set(visible()[0], { opacity: 0 });
      if (active) { pausePreview(active); active.closest('.work__item').classList.remove('is-active'); active = null; }
    }

    // Centered card grows and plays; the rest stay paused and desaturated.
    function updateActive(resume = false) {
      const x = gsap.getProperty(track, 'x');
      let best = null, bestD = Infinity;
      visible().forEach(li => {
        const c = li.offsetLeft + li.offsetWidth / 2 + x;
        const d = Math.abs(c - innerWidth / 2);
        const k = Math.max(0, 1 - d / (cardW + gap));
        li.style.setProperty('--k', k.toFixed(3));
        if (d < bestD) { bestD = d; best = li.querySelector('.reel'); }
      });
      if (best !== active) {
        if (active && active !== hovered) { pausePreview(active); active.closest('.work__item').classList.remove('is-active'); }
        active = best;
        active.closest('.work__item').classList.add('is-active');
        if (onScreen && !hovered) playPreview(active);
      } else if (resume && active && !hovered) playPreview(active);
    }

    watchScene(on => {
      onScreen = on;
      if (!on) { heroVideo?.pause(); card.video.pause(); visible().forEach(li => pausePreview(li.querySelector('.reel'))); }
      else onStripUpdate(tl.progress(), true);
    });

    // Hover scrub: moving the cursor left → right scrubs the preview; a play cursor follows.
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) {
      const cursor = document.createElement('div');
      cursor.className = 'work-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      cursor.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span class="work-cursor__bar"><span></span></span>';
      document.body.appendChild(cursor);
      const bar = cursor.querySelector('.work-cursor__bar span');
      const qx = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' });
      const qy = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });
      const enter = e => {
        const c = e.target.closest('.reel');
        if (!c || !firstSwap) return;
        hovered = c;
        loadPreview(c, 'auto');
        cursor.classList.add('is-on');
        qx(e.clientX); qy(e.clientY);
      };
      const move = e => {
        qx(e.clientX); qy(e.clientY);
        if (!hovered) return;
        const v = hovered.querySelector('.reel__video');
        const r = hovered.querySelector('.reel__media').getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        bar.style.transform = `scaleX(${ratio})`;
        if (v.duration) {
          if (!v.paused) v.pause();
          hovered.classList.add('is-playing');
          v.currentTime = ratio * v.duration;
        }
      };
      const leave = e => {
        const c = e.target.closest('.reel');
        if (!c || c !== hovered || c.contains(e.relatedTarget)) return;
        hovered = null;
        cursor.classList.remove('is-on');
        if (c === active) playPreview(c); else pausePreview(c);
      };
      track.addEventListener('pointerover', enter);
      track.addEventListener('pointermove', move);
      track.addEventListener('pointerout', leave);
      cleanup.push(() => {
        track.removeEventListener('pointerover', enter);
        track.removeEventListener('pointermove', move);
        track.removeEventListener('pointerout', leave);
        cursor.remove();
      });
    }

    // Keyboard: a focused card scrolls the strip until it is the centered one.
    const onFocus = e => {
      const li = e.target.closest('.work__item');
      if (!li || !firstSwap) return;
      const i = visible().indexOf(li);
      if (i < 0) return;
      scrollTo({ top: stripStart + (centers()[i] - centers()[0]), behavior: 'instant' });
    };
    track.addEventListener('focusin', onFocus);
    cleanup.push(() => track.removeEventListener('focusin', onFocus));

    cleanup.push(() => {
      gsap.set([media, copy, head, track, ...items, ...cards], { clearProps: 'all' });
      items.forEach(li => { li.classList.remove('is-active'); li.style.removeProperty('--k'); });
      work.style.pointerEvents = '';
      heroVideo?.getAttribute('src') && heroVideo.paused && heroVideo.play().catch(() => {});
    });
  }

  // ---------- feed (portrait) ----------
  // Portrait (phones): no pin and no nested scroller — the page's own scroll. Hero, then the manifesto
  // (its letters inflate as it crosses the screen), then Work: a sticky header under the navbar
  // ("TRABAJO · 03 / 10" + filters) and one vertical card per reel. The most visible reel plays; only
  // the next one is preloaded; far ones are unloaded.
  function buildFeed() {
    const manifesto = makeManifesto();
    // the letters inflate while scrolling: the block keeps its final height so nothing below moves
    manifesto.box.style.height = `${manifesto.fullHeight}px`;
    cleanup.push(() => { manifesto.box.style.height = ''; });
    const head = work.querySelector('.work__head');
    const count = document.createElement('span');
    count.className = 'work__count';
    count.setAttribute('aria-hidden', 'true');
    head.insertBefore(count, head.querySelector('[data-work-filters]'));
    // previous / next (the carousel also swipes)
    const L = { prev: 'Previous', next: 'Next', ...ui.player };
    const nav = document.createElement('div');
    nav.className = 'work__nav';
    nav.innerHTML = `<button type="button" class="work__arrow" data-dir="-1" aria-label="${L.prev}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>`
      + `<button type="button" class="work__arrow" data-dir="1" aria-label="${L.next}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>`;
    head.insertBefore(nav, head.querySelector('[data-work-filters]'));
    const [prevBtn, nextBtn] = nav.querySelectorAll('button');
    const goTo = i => {
      const li = visibleCards()[i]?.closest('.work__item');
      if (li) track.scrollTo({ left: li.offsetLeft - (track.clientWidth - li.offsetWidth) / 2, behavior: reduce ? 'instant' : 'smooth' });
    };
    nav.addEventListener('click', e => {
      const b = e.target.closest('[data-dir]');
      if (b) goTo(Math.max(0, current) + Number(b.dataset.dir));
    });
    const pad = n => String(n).padStart(2, '0');
    let current = -1;

    // manifesto: progress while it crosses the screen
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = manifesto.box.getBoundingClientRect();
        manifesto.render(Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight * 0.45))));
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // i: position among the visible (filtered) reels
    function setCurrent(i) {
      const vis = visibleCards();
      if (i === current || i < 0 || i >= vis.length) return;
      current = i;
      count.innerHTML = `<b>${pad(i + 1)}</b> / ${pad(vis.length)}`;
      items.forEach(li => li.classList.toggle('is-current', li === vis[i].closest('.work__item')));
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === vis.length - 1;
      cards.forEach(c => {
        const j = vis.indexOf(c);
        if (j === i) { loadPoster(c); playPreview(c); }
        else if (j === i + 1) { loadPoster(c); pausePreview(c); loadPreview(c, 'auto'); }
        else if (j === i - 1 && j >= 0) { loadPoster(c); pausePreview(c); }
        else unloadPreview(c);
      });
    }
    count.innerHTML = `<b>01</b> / ${pad(visibleCards().length)}`;
    track.scrollLeft = 0;
    // the card in the middle of the carousel is the current one (it plays; the next one preloads)
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setCurrent(visibleCards().indexOf(e.target.querySelector('.reel')));
      });
    }, { root: track, rootMargin: '0px -45% 0px -45%' });
    items.forEach(li => io.observe(li));
    // the carousel only plays while it is on screen
    const onScreenIo = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && current >= 0) { const c = visibleCards()[current]; c && playPreview(c); }
    }, { threshold: 0.4 });
    onScreenIo.observe(track);
    // leaving Work (up to the hero or down to the next sections): nothing keeps playing
    const away = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) cards.forEach(c => pausePreview(c)); // the current one resumes on return
    });
    away.observe(track);
    // the hero loop only runs while the hero is on screen
    const heroIo = new IntersectionObserver(([e]) => {
      if (!heroVideo?.getAttribute('src')) return;
      if (e.isIntersecting) heroVideo.play().catch(() => {}); else heroVideo.pause();
    });
    heroIo.observe(hero);

    cleanup.push(() => {
      removeEventListener('scroll', onScroll);
      io.disconnect();
      away.disconnect();
      onScreenIo.disconnect();
      heroIo.disconnect();
      count.remove();
      nav.remove();
      items.forEach(li => li.classList.remove('is-current'));
      cards.forEach(c => pausePreview(c));
    });
  }

  // ---------- category filters (every mode) ----------
  // Several categories can be active at once: the Services page links to Work already filtered,
  // e.g. ?cat=social,advertising#trabajo. A click selects one category (or all).
  const filters = work.querySelector('[data-work-filters]');
  const CATS = [...filters.querySelectorAll('[data-filter]')].map(b => b.dataset.filter).filter(c => c !== 'all');
  const activeCats = () => [...filters.querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.filter).filter(c => c !== 'all');
  function setFilter(cats) {
    const all = !cats.length;
    filters.querySelectorAll('[data-filter]').forEach(b =>
      b.setAttribute('aria-pressed', String(all ? b.dataset.filter === 'all' : cats.includes(b.dataset.filter))));
    items.forEach(li => { li.hidden = !all && !cats.includes(li.dataset.category); });
    const url = new URL(location.href);
    if (all) url.searchParams.delete('cat'); else url.searchParams.set('cat', cats.join(','));
    history.replaceState(history.state, '', url.toString().replace(/%2C/g, ','));
  }
  const fromUrl = (new URLSearchParams(location.search).get('cat') || '').split(',').filter(c => CATS.includes(c));
  if (fromUrl.length) setFilter(fromUrl);

  filters.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    const cats = btn.dataset.filter === 'all' ? [] : [btn.dataset.filter];
    const now = activeCats();
    if (now.length === cats.length && cats.every(c => now.includes(c))) return; // already exactly this
    const land = () => { if (mode !== 'grid') scrollTo({ top: landY(), behavior: 'instant' }); };
    if (mode === 'strip' && !reduce) {
      // the strip reorganizes (Flip), then the scene is rebuilt for its new length
      const state = Flip.getState(items);
      setFilter(cats);
      Flip.from(state, {
        duration: 0.7,
        ease: 'power3.inOut',
        absolute: true,
        onEnter: els => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5 }),
        onLeave: els => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
        onComplete: () => { build(); land(); },
      });
    } else {
      setFilter(cats);
      build();
      land();
    }
  });

  // Nav links / #hash to Work land where the strip or feed starts, not at the pinned hero.
  const workHref = `#${work.id}`;
  const landY = () => (mode === 'feed' ? work.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(html).getPropertyValue('--nav-h')) || 0) : stripStart);
  document.querySelectorAll(`a[href="${workHref}"]`).forEach(a =>
    a.addEventListener('click', e => {
      if (mode === 'grid') return;
      e.preventDefault();
      // two frames later: the mobile menu has closed and released its scroll lock
      requestAnimationFrame(() => requestAnimationFrame(() => scrollTo({ top: landY(), behavior: reduce ? 'instant' : 'smooth' })));
      history.replaceState(null, '', workHref);
    }),
  );

  build();
  if (location.hash === workHref && mode !== 'grid') scrollTo({ top: landY(), behavior: 'instant' });

  // Rebuild when the layout family changes (rotation) or the size changes a lot.
  let lastW = innerWidth, lastH = innerHeight, t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const changedMode = modeFor() !== mode;
      // mobile URL-bar show/hide changes the height a little: ignore that
      if (!changedMode && Math.abs(innerWidth - lastW) < 2 && Math.abs(innerHeight - lastH) < 120) return;
      lastW = innerWidth; lastH = innerHeight;
      const ratio = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
      build();
      scrollTo({ top: ratio * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' });
    }, 200);
  });
  ScrollTrigger.addEventListener('refresh', () => window.dispatchEvent(new CustomEvent('movo:clips')));
  addEventListener('movo:player-closed', () => {
    if (mode === 'strip') { const a = track.querySelector('.work__item.is-active .reel'); a && playPreview(a); }
  });
}
