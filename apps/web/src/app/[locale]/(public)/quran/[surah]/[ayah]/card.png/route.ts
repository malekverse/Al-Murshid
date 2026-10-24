import Image from '../opengraph-image';

// The ayah's share image at a fixed address (Phase 7c), for the reader's "Share as an image": the
// Open Graph image's own address carries a hash Next chooses.
export function GET(
  _: Request,
  { params }: RouteContext<'/[locale]/quran/[surah]/[ayah]/card.png'>,
) {
  return Image({ params });
}
