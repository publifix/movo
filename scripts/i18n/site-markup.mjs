// Site-wide pieces rendered into every page: the footer (logo, site nav, social icons, Publifix Network,
// legal line, language) and the contact settings (Web3Forms key, WhatsApp) from src/data/contact.json.
import fs from 'node:fs';

const CONTACT = new URL('../../src/data/contact.json', import.meta.url);
export const SITE_DATA = [CONTACT.pathname];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const contactData = () => JSON.parse(fs.readFileSync(CONTACT, 'utf8'));


const ICONS = {
  instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor"/></svg>',
  tiktok:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>',
};
const NAMES = { instagram: 'Instagram', tiktok: 'TikTok' };

export function siteMarkup({ t, lang, workHref, servicesHref, studioHref, contactHref }) {
  const c = contactData();
  const newTab = `<span class="sr-only"> ${esc(t.studioUi.newTab)}</span>`;
  const wa = `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(t.contact.whatsapp.message)}`;
  return {
    // the navbar's wordmark path, reused (every page has it in the header): no second copy in the HTML
    footerLogo: '<svg class="site-footer__wordmark" viewBox="3 3 1975 443" width="1975" height="443" aria-hidden="true" focusable="false"><use href="#movo-wordmark" /></svg>',
    footerYear: String(new Date().getFullYear()),
    footerSite: [
      [workHref, t.nav.work.label],
      [servicesHref, t.nav.services.label],
      [studioHref, t.nav.studio.label],
      [contactHref, t.nav.contact.label],
    ].map(([href, label]) => `<li><a class="site-footer__link" href="${href}">${esc(label)}</a></li>`).join(''),
    // Instagram / TikTok as the tracks of a video editor (V1, V2): giant name, a playhead wipes the lane on
    // hover. No URL yet in src/data/contact.json → the lane says "coming soon" (not a link).
    footerSocial: `<section class="sf-social" aria-labelledby="sf-social-title">
        <h2 class="site-footer__title" id="sf-social-title">${esc(t.footer.follow)}</h2>
        <ul class="sf-social__lanes" role="list">${['instagram', 'tiktok']
          .map((k, i) => {
            const url = c.social?.[k];
            const inner = `<span class="sf-ch__track" aria-hidden="true">V${i + 1}</span>
            <span class="sf-ch__icon" aria-hidden="true">${ICONS[k]}</span>
            <span class="sf-ch__name">${NAMES[k]}</span>
            <span class="sf-ch__meta">${url ? '<span class="sf-ch__arrow" aria-hidden="true">↗</span>' : `<span class="sf-ch__rec" aria-hidden="true"></span>${esc(t.footer.soon)}`}</span>
            <span class="sf-ch__head" aria-hidden="true"></span>`;
            return `<li>${url
              ? `<a class="sf-ch" data-ch="${k}" href="${esc(url)}" target="_blank" rel="noopener">${inner}${newTab}</a>`
              : `<div class="sf-ch is-soon" data-ch="${k}">${inner}</div>`}</li>`;
          })
          .join('')}</ul>
      </section>`,
    whatsappHref: esc(wa),
    web3formsKey: esc(c.web3formsKey || ''),
    lang,
  };
}
