// Scenes of MOVO Stories by composition id (data-composition-id). Each is its own small chunk, loaded only
// where a page shows it. mountScene(root) → { tl }: its paused timeline at frame 0 (gray, frozen), or null.
// (Wrapped: a GSAP timeline is a thenable, so returning it from an async function would wait for it to end.)
const SCENES = {
  's01-cover': () => import('./s01-cover.js'),
  's01-still': () => import('./s01-still.js'),
  's01-result': () => import('./s01-result.js'),
  's02-still': () => import('./s02-still.js'),
  's02-cover': () => import('./s02-cover.js'),
  's02-layers': () => import('./s02-layers.js'),
  's02-result': () => import('./s02-result.js'),
  's03-still': () => import('./s03-still.js'),
  's03-cover': () => import('./s03-cover.js'),
  's03-result': () => import('./s03-result.js'),
};

export async function mountScene(root) {
  const load = SCENES[root?.dataset.compositionId];
  if (!load) return null;
  const scene = await load();
  const tl = scene.build(root);
  tl.progress(0);
  return { tl };
}
