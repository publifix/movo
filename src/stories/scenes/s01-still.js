// Scene s01-still (Story 01, act 1 "Quieto"): the price tag, whole, gray and quiet. Figures that don't help
// ("$$$", "¿?", "$ / s"…) appear around it and fade; the tag shakes once; a slow push in on the "$?".
// The timecode never leaves 00:00:00:00: nothing has started yet. 4 s, scrubbed by the scroll.
// HyperFrames conventions: see s01-cover.js.
import { gsap } from 'gsap';

export const id = 's01-still';
export const duration = 4;

export function build(root) {
  const ghosts = root.querySelectorAll('[data-ghost]');
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(ghosts, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.14, ease: 'power2.out' }, 0)
    .to(ghosts, { opacity: 0, duration: 0.6, stagger: 0.06, ease: 'power1.in' }, 1.9)
    .to(root, {
      keyframes: [
        { '--swing': -2.5, duration: 0.08 },
        { '--swing': 2, duration: 0.08 },
        { '--swing': -1, duration: 0.08 },
        { '--swing': 0, duration: 0.12 },
      ],
    }, 1.6)
    .fromTo(root, { '--zoom': 1 }, { '--zoom': 1.12, duration: 1.6, ease: 'power1.inOut' }, 2.4);
  tl.set({}, {}, duration);
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
