// Client marquee: a seamless CSS-transform loop (no carousel library). The list is in the HTML once;
// here it is cloned (aria-hidden) until the track covers the screen twice, and the CSS animation gets
// one list width as its shift and a duration for a constant speed. Hovering slows the band down;
// off screen it pauses. Reduced motion: nothing runs (the CSS shows a static, wrapped list).
const SPEED = 105; // px per second

export function initMarquees(scope = document) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bands = [...scope.querySelectorAll('[data-mq]')];
  if (!bands.length) return;

  const setup = band => {
    const track = band.querySelector('[data-mq-track]');
    const list = track.querySelector('.mq__list');
    track.querySelectorAll('.mq__list[aria-hidden]').forEach(c => c.remove());
    const w = list.getBoundingClientRect().width;
    if (!w) return;
    const copies = Math.max(1, Math.ceil((innerWidth * 2) / w));
    for (let i = 0; i < copies; i++) {
      const c = list.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('role');
      track.appendChild(c);
    }
    band.style.setProperty('--mq-shift', `${w}px`);
    band.style.setProperty('--mq-dur', `${(w / SPEED).toFixed(2)}s`);
    band.classList.add('is-running');
  };

  // hover: ease the speed down to a quarter (and back) with the animation's playback rate
  const ease = (band, to) => {
    const anim = band.querySelector('[data-mq-track]').getAnimations?.()[0];
    if (!anim) return;
    cancelAnimationFrame(band._mqRaf);
    const from = anim.playbackRate;
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 450);
      anim.playbackRate = from + (to - from) * (1 - (1 - k) ** 3);
      if (k < 1) band._mqRaf = requestAnimationFrame(step);
    };
    band._mqRaf = requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(entries =>
    entries.forEach(e => e.target.classList.toggle('is-paused', !e.isIntersecting)),
  );

  const run = () => bands.forEach(setup);
  // measure with the real font (widths change when Archivo arrives)
  (document.fonts?.ready || Promise.resolve()).then(() => {
    run();
    bands.forEach(band => {
      io.observe(band);
      band.addEventListener('pointerenter', e => e.pointerType === 'mouse' && ease(band, 0.25));
      band.addEventListener('pointerleave', () => ease(band, 1));
    });
    let w = innerWidth;
    let timer = 0;
    addEventListener('resize', () => {
      if (innerWidth === w) return; // phones fire resize when the toolbar hides
      w = innerWidth;
      clearTimeout(timer);
      timer = setTimeout(run, 200);
    });
  });
}
