// Media URLs of a reel (src/data/reels.json), shared by the Work and Services markup.
//
// Real reels live on Bunny Stream: `bunny: { videoId, resolutions, desktop, mobile, width, height }`.
// Every URL is derived from `fullBaseUrl` (the library's CDN hostname, the ONE switch) + videoId:
//   full     {base}{videoId}/play_{res}p.mp4   (desktop and mobile resolutions; MP4 fallback)
//   poster   {base}{videoId}/thumbnail.jpg   (only until the self-hosted copy below exists)
//   preview  {base}{videoId}/preview_hq.mp4    (Bunny's animated preview, used as the card loop)
// The CDN has hotlink protection (allowed referrers: www.movomotiondesign.com, movomotiondesign.com, publifix.github.io, localhost), so these URLs only
// load from the site; no API key is involved. MOCK reels are files of this repo (paths from the root).
//
// Images are self-hosted when .github/workflows/thumbs.yml has copied them (src/data/thumbs.json lists them,
// with the videoId they were made from): Bunny answers 403 without the site's Referer, so Googlebot and the
// link previews of WhatsApp / LinkedIn / X could not fetch the CDN thumbnail. Same origin, sized, WebP:
//   poster        thumbs/<slug>-720.webp (+ posterSrcset 360/720/1080)
//   thumbnail     thumbs/<slug>.jpg      (1080 px JPEG, VideoObject thumbnailUrl)
//   ogImage       thumbs/<slug>-og.jpg   (1200x630, og:image of the project page)
// A reel without them (new, or its video replaced) keeps the Bunny thumbnail until the workflow runs.
import fs from 'node:fs';

const THUMBS = new URL('../../src/data/thumbs.json', import.meta.url);
export const THUMBS_DATA = THUMBS.pathname;
const thumbsData = () => {
  try {
    return JSON.parse(fs.readFileSync(THUMBS, 'utf8'));
  } catch {
    return {};
  }
};

export function reelMedia(r, { root, fullBaseUrl = '' }) {
  if (r.bunny) {
    const b = r.bunny;
    const base = `${fullBaseUrl}${b.videoId}/`;
    const play = res => `${base}play_${res}p.mp4`;
    const preview = `${base}preview_hq.mp4`;
    const own = r.slug && thumbsData()[r.slug]?.videoId === b.videoId;
    const th = f => `${root}thumbs/${r.slug}${f}`;
    return {
      poster: own ? th('-720.webp') : `${base}thumbnail.jpg`,
      posterSrcset: own ? [360, 720, 1080].map(w => `${th(`-${w}.webp`)} ${w}w`).join(', ') : '',
      thumbnail: own ? th('.jpg') : `${base}thumbnail.jpg`,
      ogImage: own ? th('-og.jpg') : '',
      previewWebm: preview, // Bunny only makes MP4 previews: both slots point to it
      previewMp4: preview,
      full: play(b.desktop),
      fullMobile: play(b.mobile),
      width: b.width,
      height: b.height,
    };
  }
  const abs = p => (/^https?:\/\//.test(p) ? p : root + p);
  return {
    poster: abs(r.poster),
    posterSrcset: '',
    thumbnail: abs(r.poster),
    ogImage: '',
    previewWebm: abs(r.preview.webm),
    previewMp4: abs(r.preview.mp4),
    full: abs(r.full),
    fullMobile: abs(r.full),
    width: 9,
    height: 16,
  };
}
