// Single source of truth for the site's languages, pages, URLs and indexing.
export default {
  // Change when the final domain exists (with trailing slash). Canonical, hreflang, OG, sitemap use it.
  siteUrl: 'https://www.movomotiondesign.com/',

  // PREVIEW: keep search engines out while the copy is provisional. Set to false at launch.
  noindex: false,

  // First locale is the default (x-default) and lives at the root.
  locales: [
    { code: 'es', path: '', label: 'ES', name: 'Español' },
    { code: 'en', path: 'en/', label: 'EN', name: 'English' },
  ],

  // Pages: URL = locale path + page path (es /servicios/, en /en/services/). Each page has one template;
  // the stub index.html files at those paths are generated content placeholders (do not edit them).
  // `meta` is the strings key with { title, description } for <title>, description, OG and Twitter.
  pages: [
    { id: 'home', template: 'src/page.html', path: { es: '', en: '' }, meta: 'meta' },
    { id: 'services', template: 'src/services.html', path: { es: 'servicios/', en: 'services/' }, meta: 'services.meta' },
    { id: 'studio', template: 'src/studio.html', path: { es: 'estudio/', en: 'studio/' }, meta: 'studio.meta' },
    { id: 'work', template: 'src/work.html', path: { es: 'trabajo/', en: 'work/' }, meta: 'workPage.meta' },
    // one page per reel of src/data/reels.json (its `slug`): /trabajo/<slug>/, /en/work/<slug>/
    { id: 'project', template: 'src/project.html', path: { es: 'trabajo/', en: 'work/' }, collection: 'reels' },
    { id: 'contact', template: 'src/contact.html', path: { es: 'contacto/', en: 'contact/' }, meta: 'contact.meta' },
    { id: 'privacy', template: 'src/privacy.html', path: { es: 'aviso-de-privacidad/', en: 'privacy-notice/' }, meta: 'privacy.meta' },
  ],

  // Organization / local business data for JSON-LD (keep it identical to the Google Business Profile).
  // Address: city only, by the owner's choice (no street).
  org: {
    name: 'MOVO Motion Design Studio',
    alternateName: 'MOVO',
    parent: 'Publifix Network S.A.P.I. de C.V.',
    telephone: '+52 442 121 8565',
    address: { addressLocality: 'Querétaro', addressRegion: 'Qro.', addressCountry: 'MX' },
    areaServed: ['MX', 'US', 'Worldwide'],
    knowsAbout: ['Motion design', 'Motion graphics', 'Animation', 'Explainer videos', 'Animated logos', 'Social media video', 'Branding'],
    logo: 'brand/movo-completo-volt-original.png',
    ogImage: 'og/movo-og-1200x630.jpg',
  },
};
