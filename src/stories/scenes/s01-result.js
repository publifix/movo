// Scene s01-result (Story 01, act 4 "Resultado"): "your video, in motion". The mini piece with the
// visitor's choices comes forward and the choices fall into place as clips on a timeline, one by one; then
// everything settles and stays. 3 s, scrubbed by the scroll. HyperFrames conventions: see s01-cover.js.
import { gsap } from 'gsap';

export const id = 's01-result';
export const duration = 3;

export function build(root) {
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(root, { '--m': 0 }, { '--m': 1, duration: 1.4, ease: 'power3.out' }, 0);
  ['--c0', '--c1', '--c2', '--c3', '--c4'].forEach((v, i) => {
    tl.fromTo(root, { [v]: 0 }, { [v]: 1, duration: 0.7, ease: 'power3.out' }, 0.7 + i * 0.3);
  });
  tl.set({}, {}, duration);
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
