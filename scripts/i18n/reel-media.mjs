// Media URLs of a reel (src/data/reels.json), shared by the Work and Services markup.
//
// Real reels live on Bunny Stream: `bunny: { videoId, resolutions, desktop, mobile, width, height }`.
// Every URL is derived from `fullBaseUrl` (the library's CDN hostname, the ONE switch) + videoId:
//   full     {base}{videoId}/play_{res}p.mp4   (desktop and mobile resolutions; MP4 fallback)
//   poster   {base}{videoId}/thumbnail.jpg
//   preview  {base}{videoId}/preview_hq.mp4    (Bunny's animated preview, used as the card loop)
// The CDN has hotlink protection (allowed referrers: publifix.github.io, localhost), so these URLs only
// load from the site; no API key is involved. MOCK reels are files of this repo (paths from the root).
export function reelMedia(r, { root, fullBaseUrl = '' }) {
  if (r.bunny) {
    const b = r.bunny;
    const base = `${fullBaseUrl}${b.videoId}/`;
    const play = res => `${base}play_${res}p.mp4`;
    const preview = `${base}preview_hq.mp4`;
    return {
      poster: `${base}thumbnail.jpg`,
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
    previewWebm: abs(r.preview.webm),
    previewMp4: abs(r.preview.mp4),
    full: abs(r.full),
    fullMobile: abs(r.full),
    width: 9,
    height: 16,
  };
}
