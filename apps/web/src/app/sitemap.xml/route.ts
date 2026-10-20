import { sitemapFiles, sitemapIndexXml, xmlHeaders } from '@/lib/sitemaps';

// /sitemap.xml: the index of the public pages' sitemaps (Phase 6).
export async function GET() {
  return new Response(sitemapIndexXml([...(await sitemapFiles()).keys()]), { headers: xmlHeaders });
}
