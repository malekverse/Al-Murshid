import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// What search engines crawl (Phase 6): everything public; not the developer pages, onboarding,
// the personal You screen, the offline page or the service worker.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/*/dev', '/*/welcome', '/*/you', '/*/offline', '/serwist/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
