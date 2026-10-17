// Privacy notice (src/data/privacy.json, ES + EN) → the table of contents and the document body.
import fs from 'node:fs';

const PRIVACY = new URL('../../src/data/privacy.json', import.meta.url);
export const PRIVACY_DATA = [PRIVACY.pathname];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function privacyMarkup({ lang }) {
  const d = JSON.parse(fs.readFileSync(PRIVACY, 'utf8'));
  const L = o => o[lang] ?? o.es;
  const block = b =>
    b.p ? `<p>${esc(L(b.p))}</p>` : b.ul ? `<ul>${L(b.ul).map(li => `<li>${esc(li)}</li>`).join('')}</ul>` : '';
  return {
    privacyUpdated: esc(L(d.updated)),
    privacyIntro: esc(L(d.intro)),
    privacyNote: lang === 'es' ? '' : `<p class="lg-note">${esc(d.enNote)}</p>`,
    privacyToc: d.sections.map(s => `<li><a href="#${L(s.id)}" data-lg-link>${esc(L(s.title))}</a></li>`).join(''),
    privacyBody: d.sections
      .map(s => `<section class="lg-sec" id="${L(s.id)}" aria-labelledby="${L(s.id)}-t">
          <h2 class="lg-sec__title" id="${L(s.id)}-t">${esc(L(s.title))}</h2>
          ${s.blocks.map(block).join('\n          ')}
        </section>`)
      .join('\n        '),
  };
}
