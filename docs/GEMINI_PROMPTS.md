# Gemini image prompts

Every prompt below is complete: copy one block, paste it into Gemini, download the image (JPG is
fine), rename it to the file name above the block, and put it in `design/inbox/`. Claude checks
it, crops or color-corrects it, and wires it in. Nothing in a prompt needs editing.

## Status (Oct 18): complete

All 34 images are in `design/source/`: six share backgrounds, four store backgrounds,
`ramadan-night`, the 12 empty states (day and night), all nine feelings and two icon
explorations. Claude exports them for the apps with `design/scripts/export_illustrations.py`
(background re-keyed to the exact canvas, soft transparent edges). The prompts below stay
here in case an image ever needs to be redone.

## Before you start

- **Aspect ratio:** if Gemini shows an aspect-ratio option, pick the one named in the prompt.
  **The store backgrounds must be tall (9:16 portrait).** If one comes back wide, reply:
  "Same image, but tall portrait 9:16, taller than it is wide."
- **One image per prompt.** If Gemini returns several, keep the calmest one.
- **If it adds text, a frame or a checkerboard,** reply: "Same image, but remove all text, the
  border and any checkerboard. Full bleed."
- **If it drifts into clichés** (mosque, crescent, lantern object, green and gold), reply:
  "Abstract only: sky, light, paper and glass. No objects."

## Made in code, not with AI

App icon layers, adaptive icon, monochrome icon, splash mark, sky gradients, grain texture,
the star lattice, the prayer glyphs and all icons. These need exact shapes, transparency or exact
colors, which code does better. Any text, Arabic or Latin, is always added in code, and religious
text only ever comes from verified sources (SPEC section 10).

---

## Last prompts used

### Store screenshot backgrounds (tall 9:16 portrait)

**`store-bg-noon.jpg`**

```text
A tall portrait image in 9:16 format, taller than it is wide (like a phone screen), full bleed, no border, no frame. A smooth vertical midday sky gradient, clear blue #6FA8DC at the top fading to almost white #E8F1FA at the bottom, with a very fine film grain. In the middle of the image, a very large, very soft warm glow (#F2D49B fading out to nothing), like sunlight diffused through frosted glass. The top quarter stays clean and calm. Matte, airy, quiet. Absolutely no text, letters or numbers; no phone or device; no mosques, domes, crescents, lanterns or other objects; no people; no lens flare; no green-and-gold colors.
```

**`store-bg-maghrib.jpg`**

```text
A tall portrait image in 9:16 format, taller than it is wide (like a phone screen), full bleed, no border, no frame. A smooth vertical dusk sky gradient, deep violet #3B2D5C at the top fading to soft coral #E9876B at the bottom, with a very fine film grain. In the middle of the image, a very large, very soft amber glow (#E8B25A fading out to nothing). A single thin pale horizon arc (#F7F4EE) curves across the bottom tenth. The top quarter stays clean and calm. Matte, warm, quiet. Absolutely no text, letters or numbers; no phone or device; no mosques, domes, crescents, lanterns or other objects; no people; no lens flare; no green-and-gold colors.
```

**`store-bg-night.jpg`**

```text
A tall portrait image in 9:16 format, taller than it is wide (like a phone screen), full bleed, no border, no frame. A smooth vertical night sky gradient, deep navy #0B1020 at the top fading to dark indigo #1C2541 at the bottom, with a very fine film grain and a few tiny, faint stars in the upper half. In the middle of the image, a large, very soft, round amber glow (#E8B25A fading out to nothing), gentle and warm. The top quarter stays clean and dark. Matte, peaceful, quiet. Absolutely no text, letters or numbers; no phone or device; no moon, no crescent, no mosques, domes, lanterns or other objects; no people; no lens flare; no green-and-gold colors.
```

### Duas by feeling (square 1:1)

**`feeling-angry.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. A soft, blurred haze of warm coral (#E9876B) at the outer edges that gently cools toward the center into calm, dusky blue (#8DB4D9 mixed with soft violet #3B2D5C), like heat slowly settling into a quiet evening. In the center, one small steady glowing dot of warm amber light (#E8B25A) with a soft halo. Smooth, out-of-focus gradients only, very fine film grain, matte, gentle and dignified. No swirls, no texture of flames, smoke or clouds; absolutely no fire, no objects of any kind, no lantern, lamp or candle, no moon or crescent, no buildings, no people, faces or hands; no text, letters or numbers.
```

**`feeling-guilty.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. A heavy, dim, overcast sky in muted slate grey and dusky violet (#3B2D5C, #1E2A4A) across the top, gently thinning and lifting toward the bottom, where soft, warm, welcoming light spreads wide and low across the whole width, like the first light after a long night. Near the center of that warm light, one small glowing dot of amber (#E8B25A). The mood is mercy and return, never punishment. Smooth, out-of-focus gradients only, very fine film grain, matte, dignified. Absolutely no doors, doorways, arches, windows, pillars, stones or any shapes; no objects of any kind, no lantern, lamp or candle, no moon or crescent, no buildings, no people, faces or hands; no text, letters or numbers.
```
