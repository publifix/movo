// Network / loading measurement for the MOVO site.
//
//   node scripts/perf/measure.mjs <url> [--device pixel7|iphone14|desktop] [--landscape]
//        [--browser chromium|webkit] [--throttle fast4g|none] [--enter] [--wait 20000] [--repeat]
//
// Prints one JSON object: every request (order, start/end ms from navigation, bytes on the wire,
// status), LCP, when the intro finished / the hero became visible, and which hero file played.
// Chromium uses CDP (exact transfer sizes + DevTools "Fast 4G"); WebKit uses Playwright events.
import { chromium, webkit, devices } from 'playwright-core';

const args = process.argv.slice(2);
const url = args[0];
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
};
const deviceName = opt('device', 'pixel7');
const landscape = !!opt('landscape', false);
const browserName = opt('browser', deviceName === 'iphone14' ? 'webkit' : 'chromium');
const throttle = opt('throttle', 'fast4g');
const clickEnter = !!opt('enter', false);
const waitMs = Number(opt('wait', 20000));
const repeat = !!opt('repeat', false);
const viewportArg = opt('viewport', null); // e.g. 980x1743: iPhone with "Request desktop website"
const desktopUA = !!opt('mac-ua', false);  // iOS desktop mode reports a Mac Safari user agent

const DEVICES = { pixel7: devices['Pixel 7'], iphone14: devices['iPhone 14'], desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } };
let ctxOpts = { ...DEVICES[deviceName] };
if (landscape && ctxOpts.viewport) ctxOpts = { ...ctxOpts, viewport: { width: ctxOpts.viewport.height, height: ctxOpts.viewport.width } };
if (viewportArg) { const [w, h] = viewportArg.split('x').map(Number); ctxOpts = { ...ctxOpts, viewport: { width: w, height: h } }; }
if (desktopUA) ctxOpts.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
if (browserName === 'chromium') delete ctxOpts.defaultBrowserType;

// Chrome DevTools "Fast 4G" preset (latency ×2.75, throughput ×0.9 as DevTools applies them)
const FAST_4G = { offline: false, latency: 60 * 2.75, downloadThroughput: (9 * 1000 * 1000) / 8 * 0.9, uploadThroughput: (1.5 * 1000 * 1000) / 8 * 0.9 };

const launcher = browserName === 'webkit' ? webkit : chromium;
const browser = await launcher.launch(process.env.CHROME_PATH && browserName === 'chromium' ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await browser.newContext(ctxOpts);
const page = await ctx.newPage();

await page.addInitScript(() => {
  const m = (window.__movoMetrics = { lcp: 0, lcpEl: '', introDone: null, heroPlaying: null, introShown: false, errors: [] });
  try {
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) { m.lcp = e.startTime; m.lcpEl = (e.element?.tagName || '') + (e.url ? ' ' + e.url.split('/').pop() : ''); }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  addEventListener('movo:intro-done', () => { m.introDone = performance.now(); m.introShown = !!document.querySelector('#movo-intro'); });
  addEventListener('error', e => m.errors.push(String(e.message)));
  document.addEventListener('playing', e => { if (e.target.matches?.('[data-hero-video]') && m.heroPlaying == null) m.heroPlaying = performance.now(); }, true);
});

const reqs = new Map();
let t0 = null;
if (browserName === 'chromium') {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  if (throttle === 'fast4g') await cdp.send('Network.emulateNetworkConditions', FAST_4G);
  cdp.on('Network.requestWillBeSent', e => {
    if (t0 == null && e.type === 'Document') t0 = e.timestamp;
    reqs.set(e.requestId, { url: e.request.url, type: e.type, start: e.timestamp, bytes: 0, status: null, range: e.request.headers.Range || e.request.headers.range || '' });
  });
  cdp.on('Network.responseReceived', e => { const r = reqs.get(e.requestId); if (r) { r.status = e.response.status; r.mime = e.response.mimeType; r.fromCache = e.response.fromDiskCache; r.enc = e.response.headers['content-encoding'] || ''; } });
  cdp.on('Network.dataReceived', e => { const r = reqs.get(e.requestId); if (r) r.bytes += e.encodedDataLength; });
  cdp.on('Network.loadingFinished', e => { const r = reqs.get(e.requestId); if (r) { r.end = e.timestamp; r.bytes = Math.max(r.bytes, e.encodedDataLength); } });
  cdp.on('Network.loadingFailed', e => { const r = reqs.get(e.requestId); if (r) { r.end = e.timestamp; r.failed = e.canceled ? 'canceled' : e.errorText; } });
} else {
  let n = 0;
  page.on('request', r => reqs.set(r, { id: n++, url: r.url(), type: r.resourceType(), startWall: Date.now(), bytes: 0, status: null, range: r.headers().range || '' }));
  page.on('requestfinished', async r => {
    const x = reqs.get(r); if (!x) return;
    x.endWall = Date.now();
    try { const s = await r.sizes(); x.bytes = s.responseBodySize + s.responseHeadersSize; } catch {}
    try { x.status = (await r.response())?.status(); } catch {}
  });
  page.on('requestfailed', r => { const x = reqs.get(r); if (x) { x.endWall = Date.now(); x.failed = r.failure()?.errorText; } });
}

if (repeat) {
  await page.goto(url, { waitUntil: 'commit' });
  await page.evaluate(() => sessionStorage.setItem('movo-intro-seen', '1'));
  reqs.clear(); t0 = null;
}
const navWall = Date.now();
await page.goto(url, { waitUntil: 'commit' });
let enteredAt = null;
if (clickEnter) {
  try {
    await page.waitForSelector('#movo-gate.ready', { timeout: waitMs });
    enteredAt = Date.now() - navWall;
    await page.click('.gate-enter');
  } catch { /* no gate (intro skipped) */ }
}
await page.waitForTimeout(waitMs);

const metrics = await page.evaluate(() => {
  const v = document.querySelector('[data-hero-video]');
  const nav = performance.getEntriesByType('navigation')[0];
  return { ...window.__movoMetrics, heroSrc: v?.currentSrc.split('/').pop() || '', heroPoster: v?.poster.split('/').pop() || '', heroPaused: v?.paused,
    heroVideoSize: v ? `${v.videoWidth}x${v.videoHeight}` : '', heroRect: v ? (r => `${Math.round(r.width)}x${Math.round(r.height)}`)(v.getBoundingClientRect()) : '',
    viewport: `${innerWidth}x${innerHeight}`, dpr: devicePixelRatio, domContentLoaded: nav?.domContentLoadedEventEnd, load: nav?.loadEventEnd,
    debugText: document.querySelector('#movo-debug')?.innerText || null, intro: window.__movoIntro || null };
});

const rows = [...reqs.values()].map(r => {
  const start = r.start != null ? (r.start - t0) * 1000 : r.startWall - navWall;
  const end = r.end != null ? (r.end - t0) * 1000 : r.endWall != null ? r.endWall - navWall : null;
  return { file: decodeURIComponent(r.url.replace(/^https?:\/\/[^/]+/, '')).slice(0, 80), type: r.type, status: r.status, kb: +(r.bytes / 1024).toFixed(1),
    startMs: Math.round(start), endMs: end == null ? null : Math.round(end), range: r.range, enc: r.enc, failed: r.failed };
}).filter(r => !/^(data|blob):/.test(r.file)).sort((a, b) => a.startMs - b.startMs);

const heroVideos = new Set(rows.filter(r => /movo-hero-.*\.(mp4|webm)/.test(r.file)).map(r => r.file.split('/').pop()));
console.log(JSON.stringify({
  url, device: deviceName, landscape, browser: browserName, throttle: browserName === 'chromium' ? throttle : 'none (webkit)', enter: clickEnter, repeat, enteredAt,
  totalKB: +rows.reduce((a, r) => a + r.kb, 0).toFixed(1), requests: rows.length, heroVideoFiles: [...heroVideos], metrics, rows,
}, null, 1));
await browser.close();
