// Portfolio cards: on fine pointers the card's preview (Bunny preview_hq.mp4) loads and plays on hover,
// one at a time, and stops when the pointer leaves. Touch screens and reduced motion: posters only.
export function initCardPreviews(scope = document) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let current = null;
  const stop = card => {
    const v = card.querySelector('.pf-card__video');
    v.pause();
    card.classList.remove('is-playing');
  };
  scope.addEventListener('pointerover', e => {
    const card = e.target.closest('.pf-card');
    if (!card || card === current) return;
    if (current) stop(current);
    current = card;
    const v = card.querySelector('.pf-card__video');
    if (!v.getAttribute('src') && card.dataset.preview) v.src = card.dataset.preview;
    v.play().then(() => current === card && card.classList.add('is-playing')).catch(() => {});
  });
  scope.addEventListener('pointerout', e => {
    const card = e.target.closest('.pf-card');
    if (!card || card !== current || card.contains(e.relatedTarget)) return;
    stop(card);
    current = null;
  });
}
