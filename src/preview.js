// Review mode for unpublished sections (MOVO Stories while site.config.mjs → stories.published is false).
// Their nav item, footer link and home teaser ship inside <template data-preview>: in the HTML but inert,
// so visitors and search engines see nothing. ?preview turns them on for this browser session, and so does
// opening a page of the hidden section (<html data-preview="on">); ?preview=off turns them off again.
const KEY = 'movo-preview';

export function revealPreview() {
  const q = new URLSearchParams(location.search).get('preview');
  let on = q !== null && q !== 'off';
  try {
    if (q === 'off') sessionStorage.removeItem(KEY);
    else if (on || document.documentElement.dataset.preview === 'on') sessionStorage.setItem(KEY, '1');
    on = sessionStorage.getItem(KEY) === '1';
  } catch {
    on = on || document.documentElement.dataset.preview === 'on';
  }
  if (!on) return;
  document.querySelectorAll('template[data-preview]').forEach(t => t.replaceWith(t.content));
}
