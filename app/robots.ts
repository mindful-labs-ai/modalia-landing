import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/constants/site';

/** Allow crawling of all global routes and point to the global sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  };
}
