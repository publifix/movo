#!/usr/bin/env python3
"""MOCK reels for the Work section — placeholder videos, replace with real work.

For every reel in src/data/reels.json writes to public/video/work/<id>/:
  full.mp4      540x960, 12 s, H.264 + AAC (stands in for the streaming file)
  preview.mp4   480x854, 3.5 s, H.264, no audio (~200 KB)
  preview.webm  same, VP9
  poster.jpg    480x854
reel-01 reuses the hero's vertical loop (preview/poster point at public/video/hero/), only its full
video is generated here. Requires ffmpeg with libx264, libvpx-vp9 and drawtext.

  python3 scripts/mocks/make-reels.py
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FONTS = Path(__file__).resolve().parent / 'fonts'
BLACK = FONTS / 'archivo-black-wide.ttf'       # Archivo 900 / 125 %
SEMI = FONTS / 'archivo-semibold.ttf'          # Archivo 600 / 110 %
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'

# background, foreground, accent — brand palette (volt/magenta only on dark, ink text on volt)
THEMES = [
    ('0x6A3DFF', 'white', '0xD7FF3B'),   # violet
    ('0x0B0B10', 'white', '0xFF2D87'),   # ink + magenta
    ('0xD7FF3B', '0x0B0B10', '0x0B0B10'),  # volt, ink text
    ('0x2A2A33', 'white', '0xD7FF3B'),   # gray + volt
    ('0xFF2D87', 'white', '0x0B0B10'),   # magenta
]
CATEGORY = {'social': 'SOCIAL', 'branding': 'BRANDING', 'explainer': 'EXPLAINER', 'advertising': 'ADVERTISING'}
DUR, FPS, W, H = 12, 24, 540, 960


def esc(text):
    return text.replace('\\', '\\\\').replace(':', '\\:').replace("'", "’").replace('%', '\\%')


def run(args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def beat_audio():
    # simple pulse: a decaying low tone every half second plus a soft high blip on the off-beat
    return (f"aevalsrc='0.35*sin(2*PI*82*t)*exp(-9*mod(t,0.5))+0.08*sin(2*PI*880*t)*exp(-30*mod(t+0.25,0.5))'"
            f":s=48000:d={DUR}")


def overlay_text(number, reel, fg, accent):
    title = esc(reel['title']['es'])
    client = esc(reel['client'])
    cat = CATEGORY[reel['category']]
    return ','.join([
        # sweeping accent band + a thin progress line along the bottom
        f"drawbox=x='-160+mod(t*300\\,{W + 320})':y=0:w=90:h=ih:color={accent}@0.85:t=fill",
        f"drawbox=x=0:y=ih-6:w='iw*t/{DUR}':h=6:color={accent}:t=fill",
        # huge number that breathes
        f"drawtext=fontfile={BLACK}:text='{number}':fontsize=330:fontcolor={fg}"
        f":x=(w-text_w)/2:y='(h-text_h)/2-90+24*sin(2*PI*t/3)'",
        # MOCK tag, category, client, title, running timecode
        f"drawtext=fontfile={BLACK}:text='MOCK':fontsize=26:fontcolor={fg}:box=1:boxcolor={fg}@0.0"
        f":boxborderw=10:borderw=0:x=w-text_w-36:y=40",
        f"drawtext=fontfile={SEMI}:text='{cat}':fontsize=22:fontcolor={fg}@0.8:x=36:y=46",
        # client/title high up: the site overlays its own caption at the bottom (mobile feed)
        f"drawtext=fontfile={SEMI}:text='{client}':fontsize=26:fontcolor={fg}:x=36:y=96",
        f"drawtext=fontfile={BLACK}:text='{title}':fontsize=28:fontcolor={fg}:x=36:y=132",
        f"drawtext=fontfile={MONO}:timecode='00\\:00\\:00\\:00':rate={FPS}:fontsize=22:fontcolor={fg}@0.75"
        f":x=w-text_w-36:y=196",
    ])


def make(reel, index):
    out = ROOT / 'public/video/work' / reel['id']
    out.mkdir(parents=True, exist_ok=True)
    bg, fg, accent = THEMES[index % len(THEMES)]
    number = f"{index + 1:02d}"
    full = out / 'full.mp4'

    if reel['id'] == 'reel-01':
        # Showreel mock: the hero's vertical loop, scaled, with the MOCK overlay and a beat
        src = ROOT / 'public/video/hero/movo-hero-mobile-720x1280.mp4'
        vf = (f"scale={W}:{H},fps={FPS},"
              f"drawtext=fontfile={BLACK}:text='MOCK':fontsize=26:fontcolor=white:x=w-text_w-36:y=40,"
              f"drawtext=fontfile={MONO}:timecode='00\\:00\\:00\\:00':rate={FPS}:fontsize=22:fontcolor=white@0.75"
              f":x=36:y=h-82")
        run(['-stream_loop', '1', '-i', str(src), '-f', 'lavfi', '-i', beat_audio(), '-t', str(DUR),
             '-vf', vf, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '27',
             '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(full)])
        return

    vf = overlay_text(number, reel, fg, accent)
    run(['-f', 'lavfi', '-i', f"color=c={bg}:s={W}x{H}:r={FPS}:d={DUR}", '-f', 'lavfi', '-i', beat_audio(),
         '-vf', vf, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '26',
         '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-shortest', str(full)])

    # preview: 3.5 s from second 2, 480p, silent
    pv = ['-ss', '2', '-t', '3.5', '-i', str(full), '-an', '-vf', 'scale=480:854:flags=lanczos']
    run([*pv, '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p',
         '-movflags', '+faststart', str(out / 'preview.mp4')])
    run([*pv, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '42', '-row-mt', '1', str(out / 'preview.webm')])
    run(['-ss', '1', '-i', str(full), '-frames:v', '1', '-vf', 'scale=480:854:flags=lanczos', '-q:v', '4',
         str(out / 'poster.jpg')])


def main():
    data = json.loads((ROOT / 'src/data/reels.json').read_text())
    for i, reel in enumerate(data['reels']):
        make(reel, i)
        print('ok', reel['id'])


if __name__ == '__main__':
    main()
