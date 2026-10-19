// Scene s01-cover (Story 01): a price tag, frozen and gray with the timecode at 00:00:00:00, swings, takes
// color and breaks into the four variables of the price (length, style, formats, extras), each drawing its
// own idea. 7 s at 24 fps. Markup: scripts/i18n/stories-markup.mjs; styles: src/stories/scene.css.
//
// HyperFrames conventions: fixed design size on the root (data-width/height/duration), ONE paused GSAP
// timeline, registered in window.__timelines[id] so the renderer can seek it frame by frame (MP4 for social);
// on the site the page plays it or scrubs it. It only tweens the CSS custom properties of the root: the CSS
// draws every frame from them, for any frame shape (16:9 or 4:5).
import { gsap } from 'gsap';

export const id = 's01-cover';
export const duration = 7;
const FPS = 24;
const pad = n => String(n).padStart(2, '0');
const timecode = t => {
  const f = Math.round(t * FPS);
  return `00:00:${pad(Math.floor(f / FPS))}:${pad(f % FPS)}`;
};

export function build(root) {
  const tc = root.querySelector('[data-scene-tc]');
  const tl = gsap.timeline({ paused: true, onUpdate: () => tc && (tc.textContent = timecode(tl.time())) });
  tl.fromTo(root, { '--t': 0 }, { '--t': 1, duration, ease: 'none' }, 0)
    // first movement: the tag swings on its hole
    .to(root, {
      keyframes: [
        { '--swing': -6, duration: 0.5, ease: 'power2.out' },
        { '--swing': 3.5, duration: 0.45, ease: 'sine.inOut' },
        { '--swing': -1.5, duration: 0.4, ease: 'sine.inOut' },
        { '--swing': 0, duration: 0.4, ease: 'power2.out' },
      ],
    }, 0.4)
    // first color
    .fromTo(root, { '--g': 1 }, { '--g': 0, duration: 1.3, ease: 'power1.inOut' }, 1.1)
    // it breaks into four pieces; the "$?" goes with them and fades
    .fromTo(root, { '--spread': 0 }, { '--spread': 1, duration: 1.3, ease: 'power3.inOut' }, 2)
    .fromTo(root, { '--q': 1 }, { '--q': 0, duration: 0.7, ease: 'power1.in' }, 2.8);
  // each piece becomes a variable and draws its idea
  ['--p0', '--p1', '--p2', '--p3'].forEach((v, i) => {
    tl.fromTo(root, { [v]: 0 }, { [v]: 1, duration: 1.1, ease: 'power3.out' }, 3.2 + i * 0.45);
  });
  tl.set({}, {}, duration); // the timeline lasts exactly `duration` (the final frame holds)
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
