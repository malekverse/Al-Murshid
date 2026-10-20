import { sitemapFiles, sitemapXml, xmlHeaders } from '@/lib/sitemaps';

// /sitemaps/quran.xml, /sitemaps/places-1.xml, ...: built once, at build time (Phase 6).
export async function generateStaticParams() {
  return [...(await sitemapFiles()).keys()].map((name) => ({ name }));
}

export async function GET(_: Request, { params }: RouteContext<'/sitemaps/[name]'>) {
  const paths = (await sitemapFiles()).get((await params).name);
  if (!paths) return new Response('Not found', { status: 404 });
  return new Response(sitemapXml(paths), { headers: xmlHeaders });
}
