// Studio on a live site: the page and the home teaser work in a real browser.
//
//   node scripts/perf/studio-check.mjs <site root url> --device desktop|desktop1920|pixel7|iphone14
//
// For ES and EN: no JS errors or responses >= 400, no horizontal scroll, the marquee loops seamlessly
// (its shift = one list width), the network diagram is drawn after the scroll and its 5 links open in a new
// tab with rel=noopener, the CTA goes where the rest of the site's CTA goes, the footer has the 5 links.
// Home: nothing from Studio loads before the first scroll; the teaser links to the Studio page.
import { chromium, webkit, devices } from 'playwright-core';

const args = process.argv.slice(2);
const root = args[0].endsWith('/') ? args[0] : `${args[0]}/`;
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const dev = opt('device', 'desktop');
const DEV = {
  desktop: { viewport: { width: 1440, height: 900 } },
  desktop1920: { viewport: { width: 1920, height: 1080 } },
  pixel7: devices['Pixel 7'],
  iphone14: devices['iPhone 14'],
};
const ctxOpts = { ...DEV[dev] };
delete ctxOpts.defaultBrowserType;
const useWebkit = dev === 'iphone14';
const browser = await (useWebkit ? webkit : chromium).launch(!useWebkit && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const out = { device: dev, pages: [] };

for (const lang of ['es', 'en']) {
  // ---- Studio page
  const ctx = await browser.newContext(ctxOpts);
  const p = await ctx.newPage();
  const errors = [], bad = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  const url = root + (lang === 'es' ? 'estudio/' : 'en/studio/');
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  const page = await p.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.getAttribute('aria-label') || document.querySelector('h1')?.textContent.trim(),
    images: document.querySelectorAll('main img, main picture, main video').length,
  }));
  await p.evaluate(() => document.querySelector('.st-clients').scrollIntoView());
  await p.waitForTimeout(1200);
  page.marquee = await p.evaluate(() => [...document.querySelectorAll('.st-clients [data-mq]')].map(b => {
    const t = b.querySelector('[data-mq-track]');
    const w = t.children[0].getBoundingClientRect().width;
    const gap = t.children[1] ? t.children[1].getBoundingClientRect().left - t.children[0].getBoundingClientRect().left : 0;
    return { running: b.classList.contains('is-running'), dir: b.dataset.dir, seamless: Math.abs(parseFloat(b.style.getPropertyValue('--mq-shift')) - w) < 0.5 && Math.abs(gap - w) < 0.5, names: t.children[0].children.length };
  }));
  // scroll down to the network in steps (ScrollTrigger scrub), then to the end
  for (let i = 0; i < 8; i++) {
    await p.evaluate(k => { const m = document.querySelector('.net__map'); const top = m.getBoundingClientRect().top + scrollY; scrollTo(0, top - innerHeight + (m.offsetHeight + innerHeight * 0.6) * (k / 7)); }, i);
    await p.waitForTimeout(350);
  }
  await p.waitForTimeout(1000);
  page.network = await p.evaluate(() => ({
    drawn: document.querySelector('.net').classList.contains('is-drawn'),
    lines: [...document.querySelectorAll('.net__line')].map(l => l.style.strokeDashoffset || 'css').join(','),
    links: [...document.querySelectorAll('.net__link')].map(a => `${a.querySelector('.net__link-name').textContent} ${a.href} ${a.target} ${a.rel}`),
  }));
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(800);
  Object.assign(page, await p.evaluate(() => ({
    cta: document.querySelector('.st-close .btn')?.href,
    ctaText: document.querySelector('.st-close .btn')?.textContent.trim(),
    footer: document.querySelectorAll('[aria-labelledby="footer-net-title"] a').length,
    scrollWidth: document.documentElement.scrollWidth,
    viewport: innerWidth,
    clip: document.querySelector('[data-timecode-clip]')?.textContent,
  })));
  out.pages.push({ url, ...page, errors, bad });
  await ctx.close();

  // ---- Home: teaser
  const hctx = await browser.newContext(ctxOpts);
  const h = await hctx.newPage();
  const herrors = [], hreqs = [];
  h.on('pageerror', e => herrors.push(e.message));
  h.on('request', r => hreqs.push(r.url()));
  await h.addInitScript(() => sessionStorage.setItem('movo-intro-seen', '1'));
  const home = root + (lang === 'es' ? '' : 'en/');
  await h.goto(home, { waitUntil: 'load' });
  await h.waitForTimeout(3000);
  const beforeScroll = hreqs.filter(u => /assets\/(home|marquee|page)-/.test(u)).map(u => u.split('/').pop());
  const heroCta = await h.evaluate(() => document.querySelector('.hero a.btn')?.href);
  // first scroll intent (mobile WebKit has no mouse wheel: a real scroll there)
  if (useWebkit) await h.evaluate(() => scrollBy(0, 300)); else await h.mouse.wheel(0, 300);
  await h.waitForTimeout(2500);
  await h.evaluate(() => document.querySelector('[data-studio-teaser]').scrollIntoView());
  await h.waitForTimeout(2500);
  const teaser = await h.evaluate(() => ({
    heading: document.querySelector('#studio-title').textContent.trim(),
    link: document.querySelector('.stt__cta').href,
    marquee: document.querySelector('[data-studio-teaser] .mq').classList.contains('is-running'),
    footer: document.querySelectorAll('[aria-labelledby="footer-net-title"] a').length,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  out.pages.push({ url: home, beforeScroll, heroCta, ...teaser, errors: herrors });
  await hctx.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
