// Work, project, contact and privacy pages on a live site, in a real browser.
//
//   node scripts/perf/pages-check.mjs <site root url> --device desktop|pixel7|iphone14
//
// ES + EN: every project page answers 200; the Work page lists every project, its posters load from the
// CDN and ?cat= filters; a project page plays its full video (1080p desktop / 720p phones) with sound;
// the contact form validates and has its key (or says it is coming soon) + WhatsApp; the privacy notice
// has its index. Lists responses >= 400 (a 403 = the CDN refused the Referer) and JS errors.
import { chromium, webkit, devices } from 'playwright-core';

const args = process.argv.slice(2);
const root = args[0].endsWith('/') ? args[0] : `${args[0]}/`;
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const dev = opt('device', 'desktop');
const DEV = { desktop: { viewport: { width: 1440, height: 900 } }, pixel7: devices['Pixel 7'], iphone14: devices['iPhone 14'] };
const ctxOpts = { ...DEV[dev] };
delete ctxOpts.defaultBrowserType;
const useWebkit = dev === 'iphone14';
const browser = await (useWebkit ? webkit : chromium).launch(
  !useWebkit && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--autoplay-policy=no-user-gesture-required'] } : {},
);
const out = { device: dev, langs: [] };

for (const [lang, work, contact, privacy] of [['es', 'trabajo/', 'contacto/', 'aviso-de-privacidad/'], ['en', 'en/work/', 'en/contact/', 'en/privacy-notice/']]) {
  const ctx = await browser.newContext(ctxOpts);
  const p = await ctx.newPage();
  const errors = [], bad = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  const L = { lang };

  // Work page
  await p.goto(root + work, { waitUntil: 'load' });
  for (let i = 0; i < 6; i++) { await p.evaluate(() => scrollBy(0, innerHeight)); await p.waitForTimeout(500); }
  await p.waitForTimeout(1500);
  L.work = await p.evaluate(() => ({
    cards: document.querySelectorAll('.pf-card').length,
    posters: [...document.querySelectorAll('.pf-card__poster')].filter(i => i.complete && i.naturalWidth > 0).length,
    links: [...document.querySelectorAll('.pf-card')].map(a => a.href),
  }));
  await p.goto(root + work + '?cat=social,advertising', { waitUntil: 'load' });
  await p.waitForTimeout(800);
  L.work.filtered = await p.evaluate(() => document.querySelectorAll('.pf__item:not([hidden])').length);

  // every project page answers
  L.projects = [];
  for (const href of L.work.links) {
    const r = await p.request.get(href);
    L.projects.push(r.status());
  }

  // one project page: play
  await p.goto(L.work.links[0], { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  await p.click('[data-pj-play]');
  await p.waitForTimeout(6000);
  L.player = await p.evaluate(() => {
    const v = document.querySelector('[data-pj-video]');
    return { src: v.currentSrc.split('/').slice(-2).join('/'), playing: !v.paused, t: +v.currentTime.toFixed(1), muted: v.muted, size: `${v.videoWidth}x${v.videoHeight}`, audio: v.webkitAudioDecodedByteCount ?? (v.audioTracks ? v.audioTracks.length : null), error: v.error?.code || null, h1: document.querySelector('h1').textContent, num: document.querySelector('.pj-label__num').textContent };
  });

  // contact
  await p.goto(root + contact, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.click('[data-ct-submit]');
  await p.waitForTimeout(400);
  L.contact = await p.evaluate(() => ({
    errorsShown: document.querySelectorAll('.ct-err:not([hidden])').length,
    key: !!document.querySelector('[data-ct-form]').dataset.key,
    status: document.querySelector('[data-ct-status]').textContent,
    whatsapp: document.querySelector('.ct-wa__link').href,
  }));

  // privacy
  await p.goto(root + privacy, { waitUntil: 'load' });
  L.privacy = await p.evaluate(() => ({ sections: document.querySelectorAll('.lg-sec').length, toc: document.querySelectorAll('[data-lg-link]').length, title: document.title }));

  L.errors = errors;
  L.bad = [...new Set(bad)];
  delete L.work.links;
  out.langs.push(L);
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
