// Scene s02-layers (Story 02, act 3 "Movimiento"): the explainer taken apart. One sheet (the script) and,
// one by one, the storyboard, the styleframe and the animation slide out of the pile until the four
// layers lie side by side (2 × 2 in a portrait frame). 6 s, scrubbed. HyperFrames conventions: s01-cover.js.
import { gsap } from 'gsap';

export const id = 's02-layers';
export const duration = 6;

export function build(root) {
  const tl = gsap.timeline({ paused: true });
  ['--f0', '--f1', '--f2', '--f3'].forEach((v, i) => tl.fromTo(root, { [v]: 0 }, { [v]: 1, duration: 1.1, ease: 'power3.inOut' }, 0.3 + i * 1.2));
  tl.set({}, {}, duration);
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
