// Services on the home (loaded on the first scroll, with Work): tracks of an editor.
// A magenta playhead crosses the tracks with the scroll and lights the keyframes. One track open at
// a time: hover (desktop) or tap (mobile / keyboard) expands it and plays its pillar's preview —
// the only Services preview that ever plays. Reduced motion: everything open, lit and static.
import './home.css';
import { previewSrc } from '../video-format.js';

const DURATION = 12; // seconds of "footage" the playhead sweeps across the ruler (00:00 → 00:12)
const pad = n => String(n).padStart(2, '0');
const tcOf = p => {
  const frames = Math.round(p * DURATION * 24);
  return `00:00:${pad(Math.floor(frames / 24))}:${pad(frames % 24)}`;
};

export function initServicesHome() {
  const section = document.querySelector('[data-services]');
  const timeline = section?.querySelector('[data-svc-timeline]');
  if (!timeline) return;
  const tracks = [...timeline.querySelectorAll('[data-track]')];
  const playhead = timeline.querySelector('[data-svc-playhead]');
  const tcEl = timeline.querySelector('[data-svc-tc]');
  const list = timeline.querySelector('[data-svc-tracks]');
  const ruler = timeline.querySelector('.svc__ruler');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 899px)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const kfs = tracks.flatMap(tr => [...tr.querySelectorAll('.kf')].map(el => ({ el, tr, x: +el.dataset.kf })));
  let open = null;
  let onScreen = false;

  // Layout below changed (a track opened/closed): the timecode re-measures its clips.
  let clipsT = 0;
  const clipsSoon = () => {
    clearTimeout(clipsT);
    clipsT = setTimeout(() => dispatchEvent(new CustomEvent('movo:clips')), 500);
  };

  const video = tr => tr.querySelector('.track__thumb video');
  function load(tr) {
    const v = video(tr);
    if (!v.getAttribute('src') && tr.dataset.previewWebm) {
      v.poster = tr.dataset.poster;
      if (reduce) return v; // reduced motion: the poster only, no loop
      v.preload = 'auto';
      v.src = previewSrc(tr);
    }
    return v;
  }
  function setOpen(tr) {
    if (tr === open) return;
    open = tr;
    tracks.forEach(t => {
      const on = t === tr;
      t.classList.toggle('is-open', on);
      t.querySelector('.track__toggle').setAttribute('aria-expanded', String(on));
      if (!on) video(t).pause();
    });
    if (tr) {
      const v = load(tr);
      if (!reduce && onScreen) v.play().catch(() => {});
    }
    clipsSoon();
  }

  if (reduce) {
    // complete and static: every track open (posters only), every keyframe lit
    tracks.forEach(t => {
      t.classList.add('is-open');
      t.querySelector('.track__toggle').setAttribute('aria-expanded', 'true');
      load(t);
    });
    kfs.forEach(k => k.el.classList.add('is-on'));
    tracks.forEach(t => { t.style.setProperty('--fill', 1); t.classList.add('is-lit'); });
    tracks.forEach(t => t.querySelector('.track__toggle').addEventListener('click', () => {
      const on = !t.classList.contains('is-open');
      t.classList.toggle('is-open', on);
      t.querySelector('.track__toggle').setAttribute('aria-expanded', String(on));
      clipsSoon();
    }));
    clipsSoon();
    return;
  }

  // ---------- open / close: tap or keyboard (button), hover on desktop ----------
  let hoverOpenedAt = 0;
  tracks.forEach(t =>
    t.querySelector('.track__toggle').addEventListener('click', () => {
      // a click right after hover-opening the same track keeps it open (no flicker)
      if (open === t && performance.now() - hoverOpenedAt > 600) setOpen(null);
      else setOpen(t);
    }),
  );

  // Hover intent; while the open/close transition runs, ignore enters, then re-check what is under the
  // pointer. Opening a track below an open one moves it up by exactly the panel the other one loses, so
  // the pointer stays on the track it chose (no oscillation).
  let lock = 0, intent = 0, leaveT = 0, px = 0, py = 0;
  const TRANSITION = 460;
  const hoverOpen = t => {
    if (!hover.matches || mobile.matches) return;
    clearTimeout(intent);
    intent = setTimeout(() => {
      if (performance.now() < lock || t === open) return;
      hoverOpenedAt = performance.now();
      lock = hoverOpenedAt + TRANSITION;
      setOpen(t);
      setTimeout(() => {
        const under = document.elementFromPoint(px, py)?.closest('[data-track]');
        if (under && under !== open && list.contains(under)) hoverOpen(under);
      }, TRANSITION + 20);
    }, 90);
  };
  list.addEventListener('pointermove', e => {
    px = e.clientX;
    py = e.clientY;
    clearTimeout(leaveT);
    const t = e.target.closest('[data-track]');
    if (t && t !== open) hoverOpen(t);
  });
  list.addEventListener('pointerleave', () => {
    clearTimeout(intent);
    if (!hover.matches || mobile.matches) return;
    leaveT = setTimeout(() => {
      if (document.activeElement && list.contains(document.activeElement)) return; // keyboard user inside
      setOpen(null);
    }, 350);
  });

  // ---------- playhead: driven by the scroll, smoothed ----------
  let p = 0, target = 0, raf = 0;
  const lanes = () => tracks[0].querySelector('.track__lane');
  function measureTarget() {
    const vh = innerHeight;
    if (mobile.matches) {
      // the playhead sits at 62% of the viewport; it travels the whole stack
      const r = list.getBoundingClientRect();
      target = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / Math.max(1, r.height)));
    } else {
      const r = timeline.getBoundingClientRect();
      target = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (vh * 0.62)));
    }
  }
  // Each track's clip fills where the playhead has passed; its markers light; the track is "lit" once reached.
  const lanesOf = tracks.map(t => t.querySelector('.track__lane'));
  function render() {
    if (mobile.matches) {
      // vertical: the playhead is a magenta line growing down the rail
      const y = p * list.offsetHeight;
      playhead.style.transform = 'none';
      playhead.style.height = `${y.toFixed(1)}px`;
      tracks.forEach((t, i) => {
        const lane = lanesOf[i]; // positioned: offsetTop is relative to the timeline, like the playhead
        const fill = Math.min(1, Math.max(0, (y - t.offsetTop) / Math.max(1, lane.offsetTop + lane.offsetHeight - t.offsetTop)));
        t.style.setProperty('--fill', fill.toFixed(3));
        t.classList.toggle('is-lit', fill > 0);
        const n = +lane.style.getPropertyValue('--n') || 1;
        t.querySelectorAll('.kf').forEach(k => k.classList.toggle('is-on', fill >= (+k.dataset.i + 0.5) / n));
      });
    } else {
      const w = lanes().offsetWidth;
      playhead.style.height = '';
      playhead.style.transform = `translate3d(${(p * w).toFixed(1)}px, 0, 0)`;
      tracks.forEach((t, i) => {
        const a = +lanesOf[i].style.getPropertyValue('--a'), b = +lanesOf[i].style.getPropertyValue('--b');
        // the clip block runs from a−20px to b+20px: map the playhead into it
        const pad = 20 / Math.max(1, w);
        const fill = Math.min(1, Math.max(0, (p - (a - pad)) / (b - a + 2 * pad)));
        t.style.setProperty('--fill', fill.toFixed(4));
        t.classList.toggle('is-lit', fill > 0);
      });
      kfs.forEach(k => k.el.classList.toggle('is-on', k.x <= p + 0.002));
      tcEl.textContent = tcOf(p);
    }
  }
  const tick = () => {
    raf = 0;
    p += (target - p) * 0.14;
    if (Math.abs(target - p) < 0.0005) p = target;
    render();
    if (p !== target) raf = requestAnimationFrame(tick);
  };
  const onScroll = () => {
    if (!onScreen) return;
    measureTarget();
    if (!raf) raf = requestAnimationFrame(tick);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  mobile.addEventListener('change', () => {
    playhead.style.transform = '';
    playhead.style.height = '';
    onScroll();
  });

  // Only work while the section is near the screen; pause the preview when it leaves.
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen) onScroll();
    else if (open) video(open).pause();
    if (onScreen && open) video(open).play().catch(() => {});
  }, { rootMargin: '10% 0px' }).observe(section);

  if (ruler) ruler.dataset.ready = '';
  measureTarget();
  p = target;
  render();
  clipsSoon();
}
