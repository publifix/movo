import { defineConfig } from 'vite';
import movoI18n from './scripts/i18n/vite-plugin-i18n.mjs';

// Relative base so the build works both at <user>.github.io/movo/ and on a custom domain.
// One HTML page per language is generated from src/page.html (see scripts/i18n/).
export default defineConfig({
  base: './',
  plugins: [movoI18n()],
});
