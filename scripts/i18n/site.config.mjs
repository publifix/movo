// Single source of truth for the site's languages, URLs and indexing.
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

  org: {
    name: 'MOVO Motion Design Studio',
    logo: 'brand/movo-completo-volt-original.png',
    ogImage: 'og/movo-og-1200x630.jpg',
  },
};
