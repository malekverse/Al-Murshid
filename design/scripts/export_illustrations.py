"""Export the empty-state illustrations from design/source for both apps.

For each empty-<name>-<day|night>.jpg:
  1. Re-key the background toward the exact app canvas (Gemini's backgrounds drift a little).
  2. Fade the edges to transparent with a soft radial mask, so no seam or painted frame shows.
  3. Write WebP with alpha: web at 2x (384 px), mobile at 3x (576 px).

Run from the repo root:  python design/scripts/export_illustrations.py
"""

from pathlib import Path

from PIL import Image, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design' / 'source'
OUTPUTS = {
    ROOT / 'apps' / 'web' / 'public' / 'illustrations': 384,
    ROOT / 'apps' / 'mobile' / 'assets' / 'illustrations': 576,
}

# packages/tokens/src/color.ts: canvas (light) and canvas (dark).
CANVAS = {'day': (0xF7, 0xF4, 0xEE), 'night': (0x0E, 0x11, 0x16)}


def border_color(im: Image.Image) -> tuple[float, float, float]:
    w, h = im.size
    b = max(8, w // 25)
    strips = [im.crop((0, 0, w, b)), im.crop((0, h - b, w, h)), im.crop((0, 0, b, h)), im.crop((w - b, 0, w, h))]
    means = [ImageStat.Stat(s).median for s in strips]
    return tuple(sum(m[i] for m in means) / len(means) for i in range(3))


def rekey(im: Image.Image, target: tuple[int, int, int]) -> Image.Image:
    """Shift pixels that look like the background onto the exact target color."""
    bg = border_color(im)
    shift = [target[i] - bg[i] for i in range(3)]
    sigma = 60.0
    px = im.load()
    w, h = im.size
    out = Image.new('RGB', im.size)
    po = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            d2 = (r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2
            k = 2.718281828 ** (-d2 / (sigma * sigma))
            po[x, y] = (
                round(min(255, max(0, r + shift[0] * k))),
                round(min(255, max(0, g + shift[1] * k))),
                round(min(255, max(0, b + shift[2] * k))),
            )
    return out


def radial_alpha(size: int) -> Image.Image:
    """Opaque in the middle, fading to transparent before the edges."""
    mask = Image.new('L', (size, size), 0)
    pm = mask.load()
    c = (size - 1) / 2
    inner, outer = 0.34 * size, 0.49 * size
    for y in range(size):
        for x in range(size):
            r = ((x - c) ** 2 + (y - c) ** 2) ** 0.5
            t = min(1.0, max(0.0, (outer - r) / (outer - inner)))
            pm[x, y] = round(255 * t * t * (3 - 2 * t))
    return mask


def main() -> None:
    files = sorted(SOURCE.glob('empty-*-day.jpg')) + sorted(SOURCE.glob('empty-*-night.jpg'))
    for out_dir in OUTPUTS:
        out_dir.mkdir(parents=True, exist_ok=True)
    for f in files:
        tone = 'day' if f.stem.endswith('-day') else 'night'
        work = 512  # re-key at a moderate size, then scale for each app
        im = Image.open(f).convert('RGB').resize((work, work), Image.LANCZOS)
        im = rekey(im, CANVAS[tone])
        rgba = im.convert('RGBA')
        rgba.putalpha(radial_alpha(work).filter(ImageFilter.GaussianBlur(2)))
        for out_dir, px in OUTPUTS.items():
            rgba.resize((px, px), Image.LANCZOS).save(out_dir / f'{f.stem}.webp', 'WEBP', quality=84, method=6)
        print(f'exported {f.stem}')


if __name__ == '__main__':
    main()
