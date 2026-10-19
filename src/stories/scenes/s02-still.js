// Scene s02-still (Story 02, act 1 "Quieto"): a video screen that tries to say everything — blocks of text,
// icons, arrows and tables keep arriving until they overlap; it shakes once. The timecode never starts.
// 4 s, scrubbed. HyperFrames conventions: see s01-cover.js.
import { gsap } from 'gsap';

export const id = 's02-still';
export const duration = 4;

export function build(root) {
  const blocks = root.querySelectorAll('[data-block]');
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(blocks, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.13, ease: 'power2.out' }, 0)
    .to(root, {
      keyframes: [
        { '--swing': -1.2, duration: 0.07 },
        { '--swing': 1, duration: 0.07 },
        { '--swing': -0.6, duration: 0.07 },
        { '--swing': 0, duration: 0.1 },
      ],
    }, 3.1);
  tl.set({}, {}, duration);
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
