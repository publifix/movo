// Scene s03-result (Story 03, act 4 "Resultado"): the visitor's logo lands in its three formats — 9:16, 1:1
// and 16:9 on a transparent background — and the deliverables are named. 3 s, scrubbed.
// HyperFrames conventions: see s01-cover.js.
import { gsap } from 'gsap';

export const id = 's03-result';
export const duration = 3;

export function build(root) {
  const tl = gsap.timeline({ paused: true });
  ['--c0', '--c1', '--c2'].forEach((v, i) => tl.fromTo(root, { [v]: 0 }, { [v]: 1, duration: 0.8, ease: 'power3.out' }, i * 0.4));
  tl.fromTo(root, { '--chips': 0 }, { '--chips': 1, duration: 0.7 }, 2);
  tl.set({}, {}, duration);
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
