import { defineConfig } from 'vite';
import movoI18n from './scripts/i18n/vite-plugin-i18n.mjs';

// Relative base so the build works both at <user>.github.io/movo/ and on a custom domain.
// One HTML page per page × language is generated from its template (see scripts/i18n/).
export default defineConfig({
  base: './',
  plugins: [movoI18n()],
  build: {
    // Every target browser supports <link rel="modulepreload">: no polyfill chunk on each page.
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        // Code shared by the home and the inner pages: one cached "core" chunk (GSAP core, nav,
        // timecode). ScrollTrigger, Observer and Flip stay in the lazy chunks that use them.
        manualChunks(id) {
          if (/node_modules\/gsap\/(index|gsap-core|CSSPlugin)\.js$/.test(id)) return 'core';
          if (/src\/(nav|timecode|video-format|preview)\.js$/.test(id)) return 'core';
          // Vite's helper for lazy imports (used by several pages): in core, not one more request
          if (id.includes('vite/preload-helper')) return 'core';
        },
      },
    },
  },
});
