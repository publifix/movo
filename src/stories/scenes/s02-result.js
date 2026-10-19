// Scene s02-result (Story 02, act 4 "Resultado"): the clean explainer comes forward, its minute draws itself
// to the end and a check says it: understood. 3 s, scrubbed. HyperFrames conventions: see s01-cover.js.
import { gsap } from 'gsap';

export const id = 's02-result';
export const duration = 3;

export function build(root) {
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(root, { '--m': 0 }, { '--m': 1, duration: 1.2, ease: 'power3.out' }, 0)
    .fromTo(root, { '--line': 0, '--t': 0 }, { '--line': 1, '--t': 1, duration: 1.4, ease: 'power1.inOut' }, 0.8)
    .fromTo(root, { '--ok': 0 }, { '--ok': 1, duration: 0.6, ease: 'back.out(2)' }, 2.3);
  tl.set({}, {}, duration);
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
