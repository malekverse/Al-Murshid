"""Al-Murshid's icons, drawn in code (SPEC 6.7; docs/GEMINI_PROMPTS.md: icons are made in code).

The mark is one eight-pointed star from the lattice, in lantern light, rising over the horizon arc
of the prayer glyphs: the same geometry as apps/web/src/components/ui/mark.tsx (a 64-unit box). The
app icon puts it over the Fajr sky with a soft lantern glow. Colors are read from the tokens.

Run from the repository root:  python design/scripts/make_brand.py
"""

import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SS = 4  # supersampling
STAR_INNER = math.cos(3 * math.pi / 8) / math.cos(math.pi / 8)


def token(path: str, pattern: str) -> str:
    text = (ROOT / path).read_text(encoding="utf-8")
    match = re.search(pattern, text, re.S)
    if not match:
        raise SystemExit(f"token not found: {pattern} in {path}")
    return match.group(1)


FAJR_TOP = token("packages/tokens/src/sky.ts", r"fajr: \{ top: '(#[0-9A-Fa-f]{6})'")
FAJR_BOTTOM = token("packages/tokens/src/sky.ts", r"fajr: \{ top: '#[0-9A-Fa-f]{6}', bottom: '(#[0-9A-Fa-f]{6})'")
# The night lantern (dark theme): the light that glows in the dark.
LANTERN = token("packages/tokens/src/color.ts", r"dark: \{.*?lantern: '(#[0-9A-Fa-f]{6})'")
CANVAS = token("packages/tokens/src/color.ts", r"light: \{.*?canvas: '(#[0-9A-Fa-f]{6})'")


def rgb(hex_: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha)


def star_points(cx: float, cy: float, r_out: float, r_in: float) -> list[tuple[float, float]]:
    return [
        (
            cx + (r_out if k % 2 == 0 else r_in) * math.cos(math.pi / 8 * k - math.pi / 2),
            cy + (r_out if k % 2 == 0 else r_in) * math.sin(math.pi / 8 * k - math.pi / 2),
        )
        for k in range(16)
    ]


def arc_points(x0: float, y0: float, cx: float, cy: float, x1: float, y1: float, n: int = 160):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t**2 * x1
        y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t**2 * y1
        pts.append((x, y))
    return pts


def draw_mark(
    size: int,
    scale: float,
    *,
    star=None,
    arc=None,
    glow=None,
    stroke: float = 3.5,
    background=None,
    lift: float = 0.0,
) -> Image.Image:
    """The mark in a `size` square: `scale` of the size for its 52-unit width, centered."""
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    if background:
        top, bottom = background
        grad = Image.new("RGBA", (1, S))
        for y in range(S):
            t = y / (S - 1)
            c = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(4))
            grad.putpixel((0, y), c)
        img = grad.resize((S, S))
    unit = S * scale / 52
    # The mark's box spans x 6..58 and y 11..52 in its 64-unit space; center it.
    ox = S / 2 - 32 * unit
    oy = S / 2 - (31.5 + lift) * unit
    P = lambda x, y: (ox + x * unit, oy + y * unit)  # noqa: E731
    if glow:
        layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        g = ImageDraw.Draw(layer)
        cx, cy = P(32, 26)
        r = 15 * unit * 2.4
        g.ellipse((cx - r, cy - r, cx + r, cy + r), fill=glow)
        layer = layer.filter(ImageFilter.GaussianBlur(r * 0.45))
        img = Image.alpha_composite(img, layer)
    d = ImageDraw.Draw(img)
    if arc:
        # A round stroke: discs along the curve, drawn on their own layer so alpha stays even.
        layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        a = ImageDraw.Draw(layer)
        r = stroke * unit / 2
        for x, y in arc_points(*P(6, 52), *P(32, 38), *P(58, 52), n=1200):
            a.ellipse((x - r, y - r, x + r, y + r), fill=arc[:3] + (255,))
        if arc[3] < 255:
            layer.putalpha(layer.getchannel("A").point(lambda v: v * arc[3] // 255))
        img = Image.alpha_composite(img, layer)
        d = ImageDraw.Draw(img)
    if star:
        cx, cy = P(32, 26)
        # The lattice's star {8/3}: inner radius cos(3π/8)/cos(π/8) of the outer.
        d.polygon(star_points(cx, cy, 15 * unit, 15 * unit * STAR_INNER), fill=star)
    return img.resize((size, size), Image.LANCZOS)


def save(img: Image.Image, path: str, mode: str = "RGBA") -> None:
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    (img.convert(mode) if mode != "RGBA" else img).save(out, optimize=True)
    print(f"{path} {img.size[0]}x{img.size[1]}")


sky = (rgb(FAJR_TOP), rgb(FAJR_BOTTOM))
lantern = rgb(LANTERN)
glow = rgb(LANTERN, 150)
arc_light = rgb(CANVAS, 235)
white = (255, 255, 255, 255)


def app_icon(size: int, scale: float = 0.6) -> Image.Image:
    return draw_mark(size, scale, star=lantern, arc=arc_light, glow=glow, stroke=2.4, background=sky)


# Mobile: the app icon, Android's adaptive layers (content inside the central 66% safe zone),
# the monochrome layer, the splash mark and the notification icon.
save(app_icon(1024), "apps/mobile/assets/images/icon.png", "RGB")
save(draw_mark(1024, 1, background=sky), "apps/mobile/assets/images/android-icon-background.png", "RGB")
save(
    draw_mark(1024, 0.42, star=lantern, arc=arc_light, glow=glow, stroke=2.4),
    "apps/mobile/assets/images/android-icon-foreground.png",
)
save(draw_mark(1024, 0.42, star=white, arc=white, stroke=3), "apps/mobile/assets/images/android-icon-monochrome.png")
# The splash shows on the light and the dark canvas: the arc takes the lantern too.
save(draw_mark(512, 0.62, star=lantern, arc=rgb(LANTERN, 170), stroke=2.6), "apps/mobile/assets/images/splash-icon.png")
save(draw_mark(96, 0.86, star=white, arc=white, stroke=4), "apps/mobile/assets/images/notification-icon.png")
# Small sizes draw the mark larger and its arc bolder, so it still reads at 48 px.
save(app_icon(48, 0.8), "apps/mobile/assets/images/favicon.png", "RGB")

# Web: the favicon, the Apple touch icon, and the install icons (the maskable one keeps the
# mark inside the safe zone).
save(app_icon(48, 0.8), "apps/web/src/app/icon.png", "RGB")
save(app_icon(180), "apps/web/src/app/apple-icon.png", "RGB")
save(app_icon(192, 0.62), "apps/web/public/icons/icon-192.png", "RGB")
save(app_icon(512, 0.5), "apps/web/public/icons/icon-512.png", "RGB")

# iOS 18+ appearances: dark (the system draws its own dark ground behind a transparent icon) and
# tinted (a grayscale mark the system colors).
save(
    draw_mark(1024, 0.6, star=lantern, arc=arc_light, glow=rgb(LANTERN, 90), stroke=2.4),
    "apps/mobile/assets/images/icon-dark.png",
)
save(
    draw_mark(1024, 0.6, star=white, arc=rgb("#BBBBBB"), stroke=2.4),
    "apps/mobile/assets/images/icon-tinted.png",
)
