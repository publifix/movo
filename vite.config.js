import { defineConfig } from 'vite';

// Relative base so the build works both at <user>.github.io/movo/ and on a custom domain.
export default defineConfig({
  base: './',
});
