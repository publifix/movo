// Single source of truth for the site's languages, pages, URLs and indexing.
export default {
  // Change when the final domain exists (with trailing slash). Canonical, hreflang, OG, sitemap use it.
  siteUrl: 'https://publifix.github.io/movo/',

  // PREVIEW: keep search engines out while the copy is provisional. Set to false at launch.
  noindex: true,

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
  ],

  org: {
    name: 'MOVO Motion Design Studio',
    logo: 'brand/movo-completo-volt-original.png',
    ogImage: 'og/movo-og-1200x630.jpg',
  },
};
