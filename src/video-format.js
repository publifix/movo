// Which video format this browser should get. All iOS browsers are WebKit, and Safari's WebM support is
// unreliable: use H.264 there; elsewhere VP9 WebM (smaller) when the browser can play it.
const ua = navigator.userAgent;
const isIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|Android/.test(ua);
export const preferMp4 = isIOS || isSafari;

let webm = null;
export const canWebm = () =>
  !preferMp4 && (webm ??= document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '');

/** Preview URL of an element carrying data-preview-webm / data-preview-mp4 (Work reels, Services). */
export const previewSrc = el => (canWebm() ? el.dataset.previewWebm : el.dataset.previewMp4);
