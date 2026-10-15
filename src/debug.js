// On-screen diagnostics for ?debug — viewport, device, chosen hero file, intro state, errors and
// which video files were actually downloaded. Tap the panel to collapse it.
export function initDebug() {
  const t0 = performance.now();
  const errors = [];
  addEventListener('error', e => errors.push(`js: ${e.message}`));
  addEventListener('unhandledrejection', e => errors.push(`promise: ${e.reason?.message || e.reason}`));

  // movo:intro-done may already have fired before this module loaded: hero.js records it.
  let introShown = !!document.querySelector('#movo-intro');
  // the intro layer appears asynchronously; remember if it ever existed
  new MutationObserver(() => { if (document.querySelector('#movo-intro')) introShown = true; })
    .observe(document.body, { childList: true });

  const panel = document.createElement('pre');
  panel.id = 'movo-debug';
  Object.assign(panel.style, {
    position: 'fixed', left: '8px', right: '8px', bottom: '8px', zIndex: 2000, margin: 0, padding: '10px 12px',
    maxHeight: '55vh', overflow: 'auto', background: 'rgba(11,11,16,.92)', color: '#D7FF3B', border: '1px solid #D7FF3B',
    borderRadius: '8px', font: '11px/1.45 ui-monospace, Menlo, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
  });
  let collapsed = false;
  panel.addEventListener('click', () => { collapsed = !collapsed; render(); });
  document.body.appendChild(panel);

  const video = document.querySelector('[data-hero-video]');
  const playEvents = [];
  ['loadstart', 'loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled', 'error'].forEach(ev =>
    video?.addEventListener(ev, () => playEvents.push(`${ev}@${Math.round(performance.now())}`)));

  const fmt = n => (n / 1024).toFixed(0) + ' KB';
  function render() {
    if (collapsed) { panel.textContent = 'MOVO debug ▸ (tap)'; return; }
    const html = document.documentElement;
    const hero = window.__movoHero || {};
    const introDoneAt = hero.introDoneAt ?? null;
    introShown = introShown || !!hero.introLayerSeen;
    const media = performance.getEntriesByType('resource')
      .filter(r => /\.(mp4|webm|jpg)(\?|$)/.test(r.name))
      .map(r => `  ${r.name.split('/').pop()}  ${r.transferSize ? fmt(r.transferSize) : '(stream/cache)'}  @${Math.round(r.startTime)}ms`);
    const v = video || {};
    const lines = [
      'MOVO debug ▾ (tap to collapse)',
      `viewport      ${innerWidth} × ${innerHeight}   dpr ${devicePixelRatio}`,
      `screen        ${screen.width} × ${screen.height}`,
      `orientation   ${matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'}   (${screen.orientation?.type || 'n/a'})`,
      `pointer       ${matchMedia('(pointer: coarse)').matches ? 'coarse' : 'fine'}`,
      `user agent    ${navigator.userAgent}`,
      '',
      `intro         ${html.dataset.intro}${introShown ? ' → shown' : ' → skipped'}${introDoneAt != null ? `, done @${Math.round(introDoneAt)}ms` : ', not done yet'}`,
      `hero format   ${hero.format || '?'}   orientation ${hero.orientation || '?'}`,
      `hero chosen   ${hero.file || '(not assigned yet)'}`,
      `currentSrc    ${v.currentSrc ? v.currentSrc.split('/').pop() : '(none)'}`,
      `poster        ${v.poster ? v.poster.split('/').pop() : '(none)'}`,
      `video state   ${v.paused ? 'paused' : 'playing'}  ready ${v.readyState}  net ${v.networkState}  ${v.videoWidth}×${v.videoHeight}`,
      `video events  ${playEvents.slice(-8).join(' ') || '-'}`,
      `errors        ${[...(hero.errors || []), ...errors].join(' | ') || 'none'}`,
      '',
      'media downloaded:',
      ...(media.length ? media : ['  (none)']),
      `uptime ${Math.round(performance.now() - t0)} ms`,
    ];
    panel.textContent = lines.join('\n');
  }
  render();
  setInterval(render, 500);
}
