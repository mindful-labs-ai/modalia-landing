import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/constants/site';
import { languageAlternates } from '@/lib/seo/metadata';
import { buildBlogPostAlternates } from '@/lib/blog/hreflang';
import { routing, type Locale } from '@/i18n/routing';
import {
  getAllPublishedGlobalPostsForSitemap,
  getKoreanSourceSlugs,
  getNonEmptyGlobalCategories,
  getGlobalPostsTotal,
  type SiblingVersion,
} from '@/lib/supabase/queries';
import { BLOG_PAGE_SIZE } from '@/constants/blog';

/**
 * Global sitemap. Each URL carries hreflang alternates (languages).
 * - Home + blog index → cross-domain alternates (ko via the Korean site).
 * - Blog posts → per-post alternates from sibling-language versions + ko source (NULL-branch aware).
 * - Category pages → global-locale alternates only (KR category structure differs).
 * Only existing, published pages are listed — no partial-page indexing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { url } = SITE_CONFIG;
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Home (one row per locale, shared alternates).
  const homeLanguages = languageAlternates('');
  for (const locale of routing.locales) {
    entries.push({
      url: `${url}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages: homeLanguages },
    });
  }

  // Blog index (ko equivalent exists at mindthos.com/blog).
  const blogLanguages = languageAlternates('/blog');
  for (const locale of routing.locales) {
    entries.push({
      url: `${url}/${locale}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: { languages: blogLanguages },
    });
  }

  // Pagination pages (page 2..N per locale).
  for (const locale of routing.locales) {
    const total = await getGlobalPostsTotal(locale);
    const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
    for (let p = 2; p <= totalPages; p++) {
      entries.push({
        url: `${url}/${locale}/blog/page/${p}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.4,
        alternates: { languages: languageAlternates(`/blog/page/${p}`) },
      });
    }
  }

  // Category pages (global locales only — categories are seeded with shared slugs per locale).
  // Only categories with published posts are listed; empty ones are noindex'd, not crawled.
  for (const locale of routing.locales) {
    const cats = await getNonEmptyGlobalCategories(locale);
    for (const cat of cats) {
      entries.push({
        url: `${url}/${locale}/blog/category/${cat.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: languageAlternates(`/blog/category/${cat.slug}`, false) },
      });
    }
  }

  // Blog posts — per-post alternates from the translation group + ko source.
  const posts = await getAllPublishedGlobalPostsForSitemap();
  const groups = new Map<string, SiblingVersion[]>();
  for (const p of posts) {
    const list = groups.get(p.translation_group_id) ?? [];
    list.push({ locale: p.locale, slug: p.slug });
    groups.set(p.translation_group_id, list);
  }
  const koMap = await getKoreanSourceSlugs(
    posts.map((p) => p.source_post_id).filter((id): id is string => Boolean(id)),
  );

  for (const p of posts) {
    const siblings = groups.get(p.translation_group_id) ?? [
      { locale: p.locale, slug: p.slug },
    ];
    const koSlug = p.source_post_id ? (koMap.get(p.source_post_id) ?? null) : null;
    entries.push({
      url: `${url}/${p.locale}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: buildBlogPostAlternates({
          locale: p.locale as Locale,
          slug: p.slug,
          siblings,
          koSlug,
        }),
      },
    });
  }

  return entries;
}
