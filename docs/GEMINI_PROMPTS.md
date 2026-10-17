# Gemini image prompts

Every prompt below is complete: copy one block, paste it into Gemini, download the image (JPG is
fine), rename it to the file name above the block, and put it in `design/inbox/`. Claude checks
it, crops or color-corrects it, and wires it in. Nothing in a prompt needs editing.

**Status of the first batch (Oct 17):** kept `og-fajr`, `ramadan-night`, `store-bg-dawn-orb` and
both icon explorations (in `design/source/`). Not used: anything that needed a transparent
background (Gemini paints a fake checkerboard), the plain gradients and the grain texture
(Claude makes those exactly in code), and the feeling tile (it drew a lantern object).

## Before you start

- **Aspect ratio:** pick it in Gemini if it offers a choice; it is also written in each prompt.
  Square = 1:1, Wide = 16:9, Tall = 9:16.
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

## 1. Social share backgrounds (web pages, Phase 6)

Wide (16:9). Text is added later on the empty left side.

**`og-fajr.jpg`** · done, already in `design/source/`.

**`og-sunrise.jpg`**

```text
A calm, minimal wide image in 16:9 landscape format, full bleed, no border, no frame. A smooth vertical sky gradient at sunrise, warm peach #F4C79A at the top fading to soft pale blue #A9C7E3 at the bottom, with a very fine film grain. In the right third, one small softly glowing amber light (#E8B25A) with a wide, gentle glow. A single thin pale horizon arc (#F7F4EE) curves across the lower fifth. The left two thirds stay empty and calm. Matte, soft, quiet, like Apple Weather skies. Absolutely no text, letters, numbers or calligraphy; no mosques, domes, minarets, crescents, lanterns or other objects; no people; no lens flare or sparkles; no green-and-gold colors.
```

**`og-dhuhr.jpg`**

```text
A calm, minimal wide image in 16:9 landscape format, full bleed, no border, no frame. A smooth vertical midday sky gradient, clear sky blue #6FA8DC at the top fading to almost white #E8F1FA at the bottom, with a very fine film grain. In the right third, one small softly glowing amber light (#E8B25A), its glow subtle against the bright sky. A single thin pale horizon arc (#F7F4EE) curves across the lower fifth. The left two thirds stay empty and calm. Matte, soft, quiet, like Apple Weather skies. Absolutely no text, letters, numbers or calligraphy; no mosques, domes, minarets, crescents, lanterns or other objects; no people; no lens flare or sparkles; no green-and-gold colors.
```

**`og-asr.jpg`**

```text
A calm, minimal wide image in 16:9 landscape format, full bleed, no border, no frame. A smooth vertical afternoon sky gradient, soft blue #8DB4D9 at the top fading to warm honey #F2D49B at the bottom, with a very fine film grain. In the right third, one small softly glowing amber light (#E8B25A) with a warm, wide glow. A single thin pale horizon arc (#F7F4EE) curves across the lower fifth. The left two thirds stay empty and calm. Matte, soft, quiet, like Apple Weather skies. Absolutely no text, letters, numbers or calligraphy; no mosques, domes, minarets, crescents, lanterns or other objects; no people; no lens flare or sparkles; no green-and-gold colors.
```

**`og-maghrib.jpg`**

```text
A calm, minimal wide image in 16:9 landscape format, full bleed, no border, no frame. A smooth vertical dusk sky gradient, deep violet #3B2D5C at the top fading to soft coral #E9876B at the bottom, with a very fine film grain. In the right third, one small softly glowing amber light (#E8B25A) sitting low, just above a single thin pale horizon arc (#F7F4EE) that curves across the lower fifth. The left two thirds stay empty and calm. Matte, soft, quiet, like Apple Weather skies. Absolutely no text, letters, numbers or calligraphy; no mosques, domes, minarets, crescents, lanterns or other objects; no people; no lens flare or sparkles; no green-and-gold colors.
```

**`og-night.jpg`**

```text
A calm, minimal wide image in 16:9 landscape format, full bleed, no border, no frame. A smooth vertical night sky gradient, deep navy #0B1020 at the top fading to dark indigo #1C2541 at the bottom, with a very fine film grain and a handful of tiny, faint, sparse stars. In the right third, one small softly glowing amber light (#E8B25A), the brightest thing in the image. A single thin pale horizon arc (#F7F4EE at 70% brightness) curves across the lower fifth. The left two thirds stay empty and calm. Matte, soft, quiet. Absolutely no text, letters, numbers or calligraphy; no moon, no crescent, no mosques, domes, minarets, lanterns or other objects; no people; no lens flare or sparkles; no green-and-gold colors.
```

## 2. Store screenshot backgrounds (Phase 9)

Tall (9:16). A phone mockup is placed in the middle later, and a headline at the top.

**`store-bg-dawn-orb.jpg`** · done, already in `design/source/`.

**`store-bg-noon.jpg`**

```text
A calm, minimal tall image in 9:16 portrait format, full bleed, no border, no frame. A smooth vertical midday sky gradient, clear blue #6FA8DC at the top fading to almost white #E8F1FA at the bottom, with a very fine film grain. Behind the center of the image, a very large, very soft warm glow (#F2D49B fading out), like sunlight diffused through frosted glass. The top quarter stays clean and calm. Matte, airy, quiet. Absolutely no text, letters or numbers; no phone or device; no mosques, domes, crescents, lanterns or other objects; no people; no lens flare; no green-and-gold colors.
```

**`store-bg-maghrib.jpg`**

```text
A calm, minimal tall image in 9:16 portrait format, full bleed, no border, no frame. A smooth vertical dusk sky gradient, deep violet #3B2D5C at the top fading to soft coral #E9876B at the bottom, with a very fine film grain. Behind the center of the image, a very large, very soft amber glow (#E8B25A fading out). A single thin pale horizon arc (#F7F4EE) curves across the bottom tenth. The top quarter stays clean and calm. Matte, warm, quiet. Absolutely no text, letters or numbers; no phone or device; no mosques, domes, crescents, lanterns or other objects; no people; no lens flare; no green-and-gold colors.
```

**`store-bg-night.jpg`**

```text
A calm, minimal tall image in 9:16 portrait format, full bleed, no border, no frame. A smooth vertical night sky gradient, deep navy #0B1020 at the top fading to dark indigo #1C2541 at the bottom, with a very fine film grain and a few tiny, faint stars in the upper half. Behind the center of the image, a large, very soft amber glow (#E8B25A fading out), gentle and warm. The top quarter stays clean and dark. Matte, peaceful, quiet. Absolutely no text, letters or numbers; no phone or device; no moon, no crescent, no mosques, domes, lanterns or other objects; no people; no lens flare; no green-and-gold colors.
```

## 3. Empty-state illustrations (Phase 2 onward)

Square (1:1). Each comes in a **day** version (on warm paper) and a **night** version (on deep
night). The background color must be flat and exact, because the illustration sits on the app
background of the same color.

**`empty-your-sky-day.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, warm paper color #F7F4EE from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: a single soft rounded square tile showing a peaceful, empty night sky (deep navy #1C2541), and in its corner a tiny warm amber light (#E8B25A) just beginning to glow, as if the first light is about to appear. Soft paper-and-glass feel, gentle diffuse shadow under the tile, matte, minimal, lots of empty space. No text, letters or numbers; no moon, crescent, mosques, domes, lanterns or other objects; no people.
```

**`empty-your-sky-night.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, very dark color #0E1116 from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: a single soft rounded square tile showing a peaceful, empty night sky (dark indigo #1C2541 with a thin, faint lighter edge), and in its corner a tiny warm amber light (#E8B25A) just beginning to glow, as if the first light is about to appear. Matte, minimal, lots of empty space, no harsh shadows. No text, letters or numbers; no moon, crescent, mosques, domes, lanterns or other objects; no people.
```

**`empty-bookmarks-day.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, warm paper color #F7F4EE from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: a single softly folded ribbon bookmark made of matte paper in a muted honey tone (#F2D49B), resting at a gentle angle, with one tiny warm amber light (#E8B25A) glowing beside it. Gentle diffuse shadow, matte, minimal, lots of empty space. No text, letters or numbers; no book, no pages, no mosques, crescents, lanterns or other objects; no people.
```

**`empty-bookmarks-night.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, very dark color #0E1116 from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: a single softly folded ribbon bookmark made of matte paper in a muted dusky honey tone, resting at a gentle angle, lit by one tiny warm amber light (#E8B25A) glowing beside it. Matte, minimal, lots of empty space, no harsh shadows. No text, letters or numbers; no book, no pages, no mosques, crescents, lanterns or other objects; no people.
```

**`empty-notes-day.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, warm paper color #F7F4EE from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: one blank sheet of soft white paper with a single gentle fold in one corner, completely empty, with one tiny warm amber light (#E8B25A) resting beside it. Gentle diffuse shadow, matte, minimal, lots of empty space. No text, writing, lines, letters or numbers on the paper; no pen; no mosques, crescents, lanterns or other objects; no people.
```

**`empty-notes-night.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, very dark color #0E1116 from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: one blank sheet of paper in a soft dim grey with a single gentle fold in one corner, completely empty, lit by one tiny warm amber light (#E8B25A) resting beside it. Matte, minimal, lots of empty space, no harsh shadows. No text, writing, lines, letters or numbers on the paper; no pen; no mosques, crescents, lanterns or other objects; no people.
```

**`empty-search-day.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, warm paper color #F7F4EE from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: a single round disc of soft frosted glass floating calmly, slightly translucent, showing a hint of pale sky blue (#E8F1FA) through it, with one tiny warm amber light (#E8B25A) glowing softly behind the glass. The mood is calm and patient, not sad. Matte, minimal, lots of empty space. No text, letters or numbers; no magnifying-glass handle; no mosques, crescents, lanterns or other objects; no people.
```

**`empty-search-night.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, very dark color #0E1116 from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: a single round disc of dark frosted glass floating calmly, slightly translucent with a faint lighter rim, and one tiny warm amber light (#E8B25A) glowing softly behind the glass. The mood is calm and patient, not sad. Matte, minimal, lots of empty space. No text, letters or numbers; no magnifying-glass handle; no mosques, crescents, lanterns or other objects; no people.
```

**`empty-offline-day.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, warm paper color #F7F4EE from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: a small sphere of soft frosted glass with one warm amber light (#E8B25A) glowing steadily inside it, protected and calm, as if to say "still here". Gentle diffuse shadow under the sphere, matte, minimal, lots of empty space. No text, letters, numbers or symbols; no wifi or signal icons; no mosques, crescents, lanterns or other objects; no people.
```

**`empty-offline-night.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, very dark color #0E1116 from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: a small sphere of dark frosted glass with a faint lighter rim and one warm amber light (#E8B25A) glowing steadily inside it, protected and calm, as if to say "still here". Matte, minimal, lots of empty space, no harsh shadows. No text, letters, numbers or symbols; no wifi or signal icons; no mosques, crescents, lanterns or other objects; no people.
```

**`empty-error-day.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, warm paper color #F7F4EE from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: one rounded pane of soft frosted glass with a single gentle, thin crack, and a soft line of warm amber light (#E8B25A) passing through the crack. Reassuring, not alarming. Gentle diffuse shadow, matte, minimal, lots of empty space. No text, letters, numbers or warning symbols; no red; no mosques, crescents, lanterns or other objects; no people.
```

**`empty-error-night.jpg`**

```text
A small, calm illustration in 1:1 square format, full bleed. The entire background is one flat, even, very dark color #0E1116 from edge to edge, with no gradient, no vignette, no border and no checkerboard. In the center, occupying about half of the image: one rounded pane of dark frosted glass with a faint lighter rim and a single gentle, thin crack, and a soft line of warm amber light (#E8B25A) passing through the crack. Reassuring, not alarming. Matte, minimal, lots of empty space, no harsh shadows. No text, letters, numbers or warning symbols; no red; no mosques, crescents, lanterns or other objects; no people.
```

## 4. Duas by feeling (Phase 7)

Square (1:1). Abstract: emotion through light and color only. The light is always a soft glowing
dot, never an object.

**`feeling-anxious.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. Soft, restless layers of pale grey-blue fog (#A9C7E3 and #8DB4D9) gently tangled across the frame, slowly unwinding toward the center, where one small steady glowing dot of warm amber light (#E8B25A) sits calmly with a soft halo. Smooth gradients, very fine film grain, matte, gentle and dignified. Absolutely no objects of any kind: no lantern, no lamp, no candle, no balloon, no moon, no crescent, no buildings, no people, no faces, no hands; no text, letters or numbers; no sharp lines or horizon split.
```

**`feeling-sad.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. A deep, soft blue dusk (#1E2A4A blending into #3B2D5C) with a slow, gentle rain of faint light streaks falling softly, and near the lower center one small glowing dot of warm amber light (#E8B25A) quietly present, like comfort nearby. Smooth gradients, very fine film grain, matte, tender and dignified. Absolutely no objects of any kind: no lantern, no lamp, no candle, no umbrella, no moon, no crescent, no buildings, no people, no faces, no hands; no text, letters or numbers; no hard horizon split.
```

**`feeling-grateful.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. Warm honey afternoon light (#F2D49B fading into soft peach #F4C79A) opening outward from the center like a wide, soft bloom of light, with one small glowing dot of warm amber light (#E8B25A) at its heart. Smooth gradients, very fine film grain, matte, warm and generous. Absolutely no objects of any kind: no flowers, no lantern, no lamp, no candle, no sun disc, no moon, no crescent, no buildings, no people, no faces, no hands; no text, letters or numbers; no hard horizon split.
```

**`feeling-angry.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. Warm coral (#E9876B) and violet (#3B2D5C) haze swirling at the edges and slowly settling and cooling toward the center into calm, soft dusky blue, where one small steady glowing dot of warm amber light (#E8B25A) holds still. The feeling is heat calming down. Smooth gradients, very fine film grain, matte, dignified. Absolutely no objects of any kind: no fire, no flames, no lantern, no lamp, no candle, no moon, no crescent, no buildings, no people, no faces, no hands; no text, letters or numbers; no hard horizon split.
```

**`feeling-afraid.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. A deep indigo night (#0B1020 to #1C2541) filling most of the frame, and in the center one small glowing dot of warm amber light (#E8B25A) held firm and safe inside a faint sphere of soft frosted glass, its glow pushing the darkness gently back. Smooth gradients, very fine film grain, matte, protective and calm. Absolutely no objects of any kind: no lantern, no lamp, no candle, no moon, no crescent, no stars shaped like symbols, no buildings, no people, no faces, no hands, no eyes; no text, letters or numbers; no hard horizon split.
```

**`feeling-hopeful.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. A sunrise sky, soft peach #F4C79A melting into pale sky blue #A9C7E3, with one small glowing dot of warm amber light (#E8B25A) rising just above a single thin, clean, pale horizon arc (#F7F4EE) in the lower third. Bright, open, gently uplifting. Smooth gradients, very fine film grain, matte. Absolutely no objects of any kind: no lantern, no lamp, no candle, no balloon, no birds, no moon, no crescent, no buildings, no people, no faces, no hands; no text, letters or numbers.
```

**`feeling-sick.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. A pale, quiet, soft-focus early morning (very light #E8F1FA and #F7F4EE with a hint of #A9C7E3), restful and hushed, with one small glowing dot of warm amber light (#E8B25A) resting close to the center, warm and near, like gentle care. Smooth gradients, very fine film grain, matte, tender. Absolutely no objects of any kind: no medical symbols, no bed, no lantern, no lamp, no candle, no moon, no crescent, no buildings, no people, no faces, no hands; no text, letters or numbers; no hard horizon split.
```

**`feeling-guilty.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. A heavy, dim, overcast sky in muted slate and dusky violet (#3B2D5C, #1E2A4A) slowly lifting, opening in the distance into a soft tall rounded gap of gentle light, and in that gap one small glowing dot of warm amber light (#E8B25A), welcoming. The mood is mercy and return, never punishment. Smooth gradients, very fine film grain, matte, dignified. Absolutely no objects of any kind: no door frame, no arch, no lantern, no lamp, no candle, no moon, no crescent, no buildings, no people, no faces, no hands; no text, letters or numbers.
```

**`feeling-lonely.jpg`**

```text
An abstract square image in 1:1 format, full bleed, no border, no frame. A wide, empty twilight (soft violet #3B2D5C fading to dusky rose #C98B8B) with one small glowing dot of warm amber light (#E8B25A) on one side, and a second, fainter dot of the same warm light gently approaching from the far side, so the two lights are not alone. Calm, spacious, quietly hopeful. Smooth gradients, very fine film grain, matte. Absolutely no objects of any kind: no lantern, no lamp, no candle, no moon, no crescent, no buildings, no people, no faces, no hands; no text, letters or numbers; no hard horizon split.
```

## 5. Ramadan (Phase 7)

**`ramadan-night.jpg`** · done, already in `design/source/`.
