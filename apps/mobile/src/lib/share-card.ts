import { ReadexPro_400Regular } from '@expo-google-fonts/readex-pro';
import {
  ImageFormat,
  loadData,
  PaintStyle,
  Skia,
  StrokeCap,
  TextAlign,
  TextDirection,
  TileMode,
  vec,
  type SkCanvas,
  type SkTypefaceFontProvider,
} from '@shopify/react-native-skia';
import {
  colors,
  glassToneFor,
  quranSizeRange,
  radius,
  skyAt,
  space,
  typeScale,
  type SunPosition,
} from '@murshid/tokens';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Share cards (SPEC 5.11): an ayah as an image, drawn on the phone with Skia, offline. Skia's
// paragraphs shape Arabic with HarfBuzz, so the King Fahd Complex font joins with all its marks.
// The card's sky is the one above the person when they share it. It is laid out in points on a
// phone-sized page and drawn at 2.7×: 1080 pixels wide, 4:5 unless a long ayah needs more.

const SCALE = 2.7;
const PAGE = { width: 400, height: 500 };
const MARGIN = space[6];
const PAD = space[6];
const GAP = space[4];
const MARK = space[8];

export interface AyahCard {
  /** The published text, untouched (SPEC 10). */
  text: string;
  translation: string | null;
  /** "Al-Baqarah 2:255", in the UI language. */
  reference: string;
  /** "Al-Murshid", in the UI language. */
  appName: string;
  rtl: boolean;
  sun: SunPosition;
  fileName: string;
  dialogTitle: string;
}

let fonts: Promise<SkTypefaceFontProvider> | null = null;

/** The card's two fonts, read once on the first share. */
function shareFonts(): Promise<SkTypefaceFontProvider> {
  fonts ??= Promise.all([
    loadData(require('../../assets/fonts/UthmanicHafs_V22.ttf'), (d) =>
      Skia.Typeface.MakeFreeTypeFaceFromData(d),
    ),
    loadData(ReadexPro_400Regular, (d) => Skia.Typeface.MakeFreeTypeFaceFromData(d)),
  ]).then(([hafs, readex]) => {
    if (!hafs || !readex) throw new Error('The card fonts did not load');
    const provider = Skia.TypefaceFontProvider.Make();
    provider.registerFont(hafs, 'Hafs');
    provider.registerFont(readex, 'Readex');
    return provider;
  });
  fonts.catch(() => (fonts = null));
  return fonts;
}

// The lattice's star {8/3} over the horizon arc, as in the web's mark (SPEC 6.7), on a 64 grid.
const INNER = Math.cos((3 * Math.PI) / 8) / Math.cos(Math.PI / 8);

function drawMark(
  canvas: SkCanvas,
  cx: number,
  top: number,
  size: number,
  starColor: string,
  arcColor: string,
) {
  const unit = size / 64;
  const x = (v: number) => cx + (v - 32) * unit;
  const y = (v: number) => top + v * unit;
  const star = Skia.PathBuilder.Make();
  for (let k = 0; k < 16; k++) {
    const r = k % 2 === 0 ? 15 : 15 * INNER;
    const a = (Math.PI / 8) * k - Math.PI / 2;
    const px = x(32 + r * Math.cos(a));
    const py = y(26 + r * Math.sin(a));
    if (k === 0) star.moveTo(px, py);
    else star.lineTo(px, py);
  }
  star.close();
  const fill = Skia.Paint();
  fill.setColor(Skia.Color(starColor));
  fill.setAntiAlias(true);
  canvas.drawPath(star.build(), fill);

  const curve = Skia.PathBuilder.Make();
  curve.moveTo(x(6), y(52));
  curve.quadTo(x(32), y(38), x(58), y(52));
  const stroke = Skia.Paint();
  stroke.setColor(Skia.Color(arcColor));
  stroke.setStyle(PaintStyle.Stroke);
  stroke.setStrokeWidth(3.5 * unit);
  stroke.setStrokeCap(StrokeCap.Round);
  stroke.setAntiAlias(true);
  canvas.drawPath(curve.build(), stroke);
}

/** Draws the card and opens the share sheet. */
export async function shareAyahCard(card: AyahCard) {
  const provider = await shareFonts();
  const sky = skyAt(card.sun);
  const palette = colors[glassToneFor(sky.bottom)];
  const inner = PAGE.width - 2 * MARGIN - 2 * PAD;
  const script = card.rtl ? 'arabic' : 'latin';

  const paragraph = (
    text: string,
    family: string,
    role: { size: number; lineHeight: number },
    color: string,
    rtl: boolean,
    width = inner,
  ) => {
    const p = Skia.ParagraphBuilder.Make(
      {
        textAlign: TextAlign.Center,
        textDirection: rtl ? TextDirection.RTL : TextDirection.LTR,
      },
      provider,
    )
      .pushStyle({
        fontFamilies: [family],
        fontSize: role.size * SCALE,
        heightMultiplier: role.lineHeight,
        color: Skia.Color(color),
      })
      .addText(text)
      .build();
    p.layout(width * SCALE);
    return p;
  };

  const translation = card.translation
    ? paragraph(card.translation, 'Readex', typeScale.body[script], palette.inkMuted, card.rtl)
    : null;
  const reference = paragraph(
    card.reference,
    'Readex',
    typeScale.callout[script],
    palette.lanternInk,
    card.rtl,
  );
  const name = paragraph(
    card.appName,
    'Readex',
    typeScale.caption[script],
    palette.ink,
    card.rtl,
    PAGE.width,
  );
  const footer = (MARK + space[1]) * SCALE + name.getHeight();
  const rest =
    (translation ? translation.getHeight() + GAP * SCALE : 0) + GAP * SCALE + reference.getHeight();
  // The ayah takes the largest size that fits a 4:5 card, within the reader's own range. Past
  // its smallest, the card grows taller instead.
  const room = (PAGE.height - 2 * MARGIN - 2 * PAD - space[6]) * SCALE - footer - rest;
  const quran = { size: quranSizeRange.max, lineHeight: typeScale.quran.arabic.lineHeight };
  let ayah = paragraph(card.text, 'Hafs', quran, palette.ink, true);
  while (ayah.getHeight() > room && quran.size > quranSizeRange.min) {
    quran.size -= 2;
    ayah = paragraph(card.text, 'Hafs', quran, palette.ink, true);
  }

  const boxHeight = 2 * PAD * SCALE + ayah.getHeight() + rest;
  const width = Math.round(PAGE.width * SCALE);
  const height = Math.ceil(
    Math.max(PAGE.height * SCALE, boxHeight + (2 * MARGIN + space[6]) * SCALE + footer),
  );
  const surface = Skia.Surface.MakeOffscreen(width, height) ?? Skia.Surface.Make(width, height);
  if (!surface) throw new Error('No surface to draw the card on');
  const canvas = surface.getCanvas();

  const ground = Skia.Paint();
  ground.setShader(
    Skia.Shader.MakeLinearGradient(
      vec(0, 0),
      vec(0, height),
      [Skia.Color(sky.top), Skia.Color(sky.bottom)],
      null,
      TileMode.Clamp,
    ),
  );
  canvas.drawRect(Skia.XYWHRect(0, 0, width, height), ground);

  // The glass card at the page's center, kept clear of the footer.
  const left = MARGIN * SCALE;
  const foot = height - MARGIN * SCALE - footer;
  const top = Math.max(
    left,
    Math.min((height - boxHeight) / 2, foot - space[6] * SCALE - boxHeight),
  );
  const box = Skia.RRectXY(
    Skia.XYWHRect(left, top, width - 2 * left, boxHeight),
    radius.sheet * SCALE,
    radius.sheet * SCALE,
  );
  const glass = Skia.Paint();
  glass.setColor(Skia.Color(palette.surfaceGlass));
  glass.setAntiAlias(true);
  canvas.drawRRect(box, glass);
  const edge = Skia.Paint();
  edge.setColor(Skia.Color(palette.hairline));
  edge.setStyle(PaintStyle.Stroke);
  edge.setStrokeWidth(SCALE);
  edge.setAntiAlias(true);
  canvas.drawRRect(box, edge);

  const x = (MARGIN + PAD) * SCALE;
  let y = top + PAD * SCALE;
  ayah.paint(canvas, x, y);
  y += ayah.getHeight() + GAP * SCALE;
  if (translation) {
    translation.paint(canvas, x, y);
    y += translation.getHeight() + GAP * SCALE;
  }
  reference.paint(canvas, x, y);

  // The mark and the name at the foot, in the sky's own tone.
  drawMark(canvas, width / 2, foot, MARK * SCALE, palette.lantern, palette.ink);
  name.paint(canvas, 0, foot + (MARK + space[1]) * SCALE);

  surface.flush();
  const bytes = surface.makeImageSnapshot().encodeToBytes(ImageFormat.PNG, 100);
  const file = new File(Paths.cache, card.fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(bytes);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: card.dialogTitle,
  });
}
