// WCAG 2.2 relative luminance and contrast ratio, used to keep every token pair AA-compliant.

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseColor(value: string): Rgba {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const rgba = value.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (rgba?.[1]) {
    const [r = 0, g = 0, b = 0, a = 1] = rgba[1].split(',').map((p) => Number(p.trim()));
    return { r, g, b, a };
  }
  throw new Error(`Unsupported color: ${value}`);
}

/** Composite a possibly translucent color over an opaque backdrop. */
export function flatten(fg: string, bg: string): Rgba {
  const f = parseColor(fg);
  const b = parseColor(bg);
  return {
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a),
    a: 1,
  };
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance({ r, g, b }: Rgba): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between a foreground and an opaque background (1 to 21). */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(flatten(fg, bg));
  const l2 = luminance(parseColor(bg));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Which glass to float over a sky color: light glass over bright skies, dark glass over dark
 * ones, so ink and muted ink both keep 4.5:1 whatever the app theme (Today only).
 */
export function glassToneFor(skyColor: string): 'light' | 'dark' {
  return luminance(parseColor(skyColor)) >= 0.15 ? 'light' : 'dark';
}
