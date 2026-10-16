// Real reels (Bunny Stream) on the live site: do they show, preview and play with sound?
//
//   node scripts/perf/work-check.mjs <url> --device desktop|pixel7|iphone14 [--reels 5]
//
// For the first N reels: poster loaded, preview playing when the reel is the active one (strip on
// desktop, feed on phones), then the player: full video from the CDN playing, unmuted, with audio.
// Also lists every response >= 400 (a 403 means the CDN refused the site's Referer) and the requests
// made before the first scroll (none may come from Work / the CDN). Chrome (CHROME_PATH) for H.264.
import { chromium, webkit, devices } from 'playwright-core';

const args = process.argv.slice(2);
const url = args[0];
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const dev = opt('device', 'desktop');
const N = Number(opt('reels', 5));
const DEV = { desktop: { viewport: { width: 1440, height: 900 } }, pixel7: devices['Pixel 7'], iphone14: devices['iPhone 14'] };
const ctxOpts = { ...DEV[dev] };
const useWebkit = dev === 'iphone14';
delete ctxOpts.defaultBrowserType;
const browser = await (useWebkit ? webkit : chromium).launch(
  !useWebkit && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--autoplay-policy=no-user-gesture-required'] } : {},
);
const ctx = await browser.newContext(ctxOpts);
const page = await ctx.newPage();
const R = { device: dev, browser: useWebkit ? 'webkit' : 'chrome', errors: [], bad: [], beforeScroll: [], reels: [] };
page.on('pageerror', e => R.errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) R.bad.push(`${r.status()} ${r.url()}`); });
page.on('requestfailed', r => { if (!/ERR_ABORTED|cancelled/i.test(r.failure()?.errorText || '')) R.bad.push(`FAILED ${r.failure()?.errorText} ${r.url()}`); });
const reqs = [];
page.on('request', r => reqs.push(r.url()));
await page.addInitScript(() => sessionStorage.setItem('movo-intro-seen', '1'));

// 1) first load: nothing from Work or the CDN before the visitor scrolls
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(4000);
R.beforeScroll = reqs.filter(u => /b-cdn\.net|video\/work|assets\/index-/.test(u));

// 2) straight to Work (the hash loads it and lands where the strip / feed starts)
await page.goto(url + (url.includes('/en/') ? '#work' : '#trabajo'), { waitUntil: 'load' });
await page.waitForTimeout(5000);
R.mode = await page.evaluate(() => document.documentElement.className.match(/work-\w+/)?.[0]);

const cardState = i => page.evaluate(i => {
  const c = document.querySelectorAll('.reel')[i];
  const img = c.querySelector('.reel__poster'), v = c.querySelector('.reel__video');
  const r = c.querySelector('.reel__media').getBoundingClientRect();
  return { id: c.dataset.reel, title: c.dataset.title, poster: img.complete && img.naturalWidth > 0 ? `${img.naturalWidth}x${img.naturalHeight}` : 'not loaded',
    preview: (v.currentSrc || '').split('/').slice(-2).join('/'), previewPlaying: !v.paused && v.readyState >= 2, previewSize: v.videoWidth ? `${v.videoWidth}x${v.videoHeight}` : '',
    card: `${Math.round(r.width)}x${Math.round(r.height)}`, playingNow: [...document.querySelectorAll('video')].filter(x => !x.paused).length };
}, i);

for (let i = 0; i < N; i++) {
  if (R.mode === 'work-feed') {
    await page.evaluate(i => { const t = document.querySelector('[data-work-track]'); t.scrollTo({ top: i * t.clientHeight }); }, i);
  } else {
    // strip: scroll until card i is the centered (active) one
    await page.evaluate(i => {
      const items = [...document.querySelectorAll('.work__item')];
      const c = items.map(li => li.offsetLeft + li.offsetWidth / 2);
      const st = window.__movoStripStart ?? scrollY;
      window.__movoStripStart = st;
      scrollTo(0, st + (c[i] - c[0]));
    }, i);
  }
  await page.waitForTimeout(3500);
  R.reels.push(await cardState(i));
}

// 3) the player, for each real reel: full video from the CDN, unmuted, with sound
const players = [];
for (let i = 0; i < N; i++) {
  if (R.mode === 'work-feed') await page.evaluate(i => { const t = document.querySelector('[data-work-track]'); t.scrollTo({ top: i * t.clientHeight }); }, i);
  await page.waitForTimeout(800);
  await page.locator('.reel').nth(i).click({ force: true });
  await page.waitForTimeout(6000);
  players.push(await page.evaluate(() => {
    const v = document.querySelector('[data-player-video]');
    const audio = v.webkitAudioDecodedByteCount ?? (v.audioTracks ? v.audioTracks.length : null);
    return { src: v.currentSrc.split('/').slice(-2).join('/'), playing: !v.paused, t: +v.currentTime.toFixed(2), muted: v.muted, volume: v.volume,
      size: `${v.videoWidth}x${v.videoHeight}`, audioBytesOrTracks: audio, error: v.error?.code || null };
  }));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
}
R.player = players;
R.bad = [...new Set(R.bad)];
console.log(JSON.stringify(R, null, 1));
await browser.close();
