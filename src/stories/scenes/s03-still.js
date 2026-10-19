// Scene s03-still (Story 03, act 1 "Quieto"): a gray, still logo in the middle while a feed of posts runs
// past behind it, faster and faster, until it blurs. The timecode never starts. 4 s, scrubbed.
// HyperFrames conventions: see s01-cover.js.
import { gsap } from 'gsap';

export const id = 's03-still';
export const duration = 4;

export function build(root) {
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(root, { '--feed': 0 }, { '--feed': 1, duration: 3.7, ease: 'power2.in' }, 0.3)
    .fromTo(root, { '--blur': 0 }, { '--blur': 1, duration: 1.6, ease: 'power1.in' }, 2.4);
  tl.set({}, {}, duration);
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
