// The 1200x630 image (Open Graph / Twitter / Article JSON-LD) of each story and language, captured from the
// FINAL frame of its cover scene (STORIES.md §8) in the built site:
//   npm run build && npx vite preview --port 4173 &   then
//   CHROME_PATH=… node scripts/stories/og.mjs [http://localhost:4173/]
// Writes public/stories/og/<id>-<lang>.jpg; set `og` in src/data/stories.json ("stories/og/<id>-{lang}.jpg").
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import site from '../i18n/site.config.mjs';

const base = process.argv[2] || 'http://localhost:4173/';
const { stories } = JSON.parse(fs.readFileSync(new URL('../../src/data/stories.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
// reduced motion: every scene stays on its final frame (no timeline is built)
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
fs.mkdirSync(new URL('../../public/stories/og/', import.meta.url), { recursive: true });
for (const s of stories) {
  for (const l of site.locales) {
    const slug = typeof s.slug === 'string' ? s.slug : s.slug[l.code];
    await page.goto(`${base}${l.path}stories/${slug}/`, { waitUntil: 'networkidle' });
    const el = await page.$(`.sp-body [data-composition-id="${s.cover}"]`);
    if (!el) throw new Error(`no scene ${s.cover} on ${l.code}/${slug}`);
    await el.evaluate(n => {
      n.style.cssText += 'width:1200px;--scn-ar:1200/630;border-radius:0;box-shadow:none';
      n.closest('figure').style.maxWidth = 'none';
    });
    const out = new URL(`../../public/stories/og/${s.id}-${l.code}.jpg`, import.meta.url);
    await el.screenshot({ path: out.pathname, type: 'jpeg', quality: 86 });
    console.log('og', out.pathname.split('/public/')[1], fs.statSync(out).size, 'bytes');
  }
}
await browser.close();
