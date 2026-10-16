// "The scroll is the timeline": a fixed timecode that advances with the scroll and names the current
// section ("clip"). Each [data-clip] element is a clip; its start is its position in the document,
// or data-clip-start (px) when a pinned scene (src/work/) moves it. Nested scrollers marked
// [data-timecode-scroll] (the mobile reels feed) add their own scroll to the footage time.
// Decorative: aria-hidden in HTML.
const FPS = 24;
const SECONDS_PER_SCREEN = 4; // one viewport of scroll = 4 s of "footage"

const pad = n => String(n).padStart(2, '0');

export function initTimecode() {
  const el = document.querySelector('[data-timecode]');
  if (!el) return;
  const tcEl = el.querySelector('[data-timecode-tc]');
  const clipEl = el.querySelector('[data-timecode-clip]');
  let clips = [];

  const measure = () => {
    clips = [...document.querySelectorAll('[data-clip]')]
      .map((c, i) => ({
        n: i + 1,
        label: c.dataset.clipLabel || c.dataset.clip,
        // a pinned clip is measured through its pin-spacer (its own box moves while pinned)
        start: c.dataset.clipStart != null ? Number(c.dataset.clipStart)
          : (c.parentElement?.classList.contains('pin-spacer') ? c.parentElement : c).getBoundingClientRect().top + scrollY,
      }))
      .sort((a, b) => a.start - b.start);
  };

  let last = '';
  const render = () => {
    const y = Math.max(0, scrollY);
    let nested = 0;
    document.querySelectorAll('[data-timecode-scroll]').forEach(n => { nested += n.scrollTop; });
    const frames = Math.floor(((y + nested) / innerHeight) * SECONDS_PER_SCREEN * FPS);
    const f = frames % FPS, s = Math.floor(frames / FPS);
    const tc = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
    const probe = y + innerHeight * 0.4;
    const clip = clips.filter(c => c.start <= probe).at(-1) || clips[0];
    const text = clip ? `${pad(clip.n)} ${clip.label}` : '';
    if (tc + text === last) return;
    last = tc + text;
    tcEl.textContent = tc;
    clipEl.textContent = text;
  };

  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };
  const refresh = () => { measure(); render(); };

  refresh();
  // capture: also hears scroll events of nested scrollers (they don't bubble)
  document.addEventListener('scroll', onScroll, { passive: true, capture: true });
  addEventListener('resize', refresh);
  addEventListener('load', refresh, { once: true });
  addEventListener('movo:clips', refresh); // the pinned scene changed the clip positions
}
