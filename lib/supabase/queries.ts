import { cache } from 'react';
import { createStaticClient } from './static';
import { BLOG_PAGE_SIZE } from '@/constants/blog';
import type { Locale } from '@/i18n/routing';
import type { GlobalPost, GlobalCategory } from '@/lib/blog/types';

/**
 * All functions use the cookie-less `createStaticClient`, so they are safe to call
 * from generateStaticParams / sitemap.ts at build time. RLS is evaluated as `anon`,
 * so only public data (published posts, categories) is readable.
 *
 * Every query is locale-scoped — the global blog is partitioned by `locale`.
 */

const POST_SELECT =
  '*, category:global_categories(*), author:authors(id,name,slug,title,bio,profile_image_url,specialties)';

/** PostgREST types a to-one embed as an array; normalize the joins to single objects. */
function normalizePost(raw: unknown): GlobalPost {
  const row = raw as Record<string, unknown>;
  const category = Array.isArray(row.category)
    ? (row.category[0] ?? null)
    : (row.category ?? null);
  const author = Array.isArray(row.author)
    ? (row.author[0] ?? null)
    : (row.author ?? null);
  return { ...(row as object), category, author } as GlobalPost;
}

export async function getPublishedGlobalPosts(options: {
  locale: Locale;
  page?: number;
  perPage?: number;
  categorySlug?: string;
}): Promise<{ posts: GlobalPost[]; total: number }> {
  const { locale, page = 1, perPage = BLOG_PAGE_SIZE, categorySlug } = options;
  const supabase = createStaticClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let categoryId: string | undefined;
  if (categorySlug) {
    const categories = await getGlobalCategories(locale);
    categoryId = categories.find((c) => c.slug === categorySlug)?.id;
    // Unknown category slug → no results (avoid leaking the full list).
    if (!categoryId) return { posts: [], total: 0 };
  }

  let query = supabase
    .from('global_posts')
    .select(POST_SELECT, { count: 'exact' })
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);
  if (categoryId) query = query.eq('category_id', categoryId);

  const { data, count, error } = await query;
  if (error) throw error;
  return { posts: (data ?? []).map(normalizePost), total: count ?? 0 };
}

export async function getGlobalPostBySlug(
  locale: Locale,
  slug: string,
): Promise<GlobalPost | null> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('global_posts')
    .select(POST_SELECT)
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error || !data) return null;
  return normalizePost(data);
}

export const getGlobalCategories = cache(
  async (locale: Locale): Promise<GlobalCategory[]> => {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from('global_categories')
      .select('*')
      .eq('locale', locale)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as GlobalCategory[];
  },
);

/**
 * Categories that currently have ≥1 published post in this locale.
 * Empty categories are kept in the taxonomy but hidden from navigation, the
 * sitemap, and search indexing until they have content — an empty category
 * page is thin content that would dilute the site's quality signals.
 */
export const getNonEmptyGlobalCategories = cache(
  async (locale: Locale): Promise<GlobalCategory[]> => {
    const supabase = createStaticClient();
    const [cats, { data }] = await Promise.all([
      getGlobalCategories(locale),
      supabase
        .from('global_posts')
        .select('category_id')
        .eq('locale', locale)
        .eq('status', 'published'),
    ]);
    const populated = new Set(
      (data ?? [])
        .map((r) => (r as { category_id: string | null }).category_id)
        .filter(Boolean),
    );
    return cats.filter((c) => populated.has(c.id));
  },
);

export async function getPopularGlobalPosts(
  locale: Locale,
  limit = 5,
): Promise<GlobalPost[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('global_posts')
    .select(POST_SELECT)
    .eq('locale', locale)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[getPopularGlobalPosts]', error);
    return [];
  }
  return (data ?? []).map(normalizePost);
}

/**
 * Related posts — same category first, then fill with latest. Excludes the current post
 * and its sibling-language versions (same translation_group_id) to avoid self-links.
 */
export async function getRelatedGlobalPosts(
  current: GlobalPost,
  limit = 3,
): Promise<GlobalPost[]> {
  const supabase = createStaticClient();
  let query = supabase
    .from('global_posts')
    .select(POST_SELECT)
    .eq('locale', current.locale)
    .eq('status', 'published')
    .neq('translation_group_id', current.translation_group_id)
    .order('published_at', { ascending: false })
    .limit(limit + 1);
  if (current.category_id) query = query.eq('category_id', current.category_id);

  const { data, error } = await query;
  if (error || !data) return [];
  const related = data.map(normalizePost).slice(0, limit);

  if (related.length < limit) {
    const { data: fill } = await supabase
      .from('global_posts')
      .select(POST_SELECT)
      .eq('locale', current.locale)
      .eq('status', 'published')
      .neq('translation_group_id', current.translation_group_id)
      .order('published_at', { ascending: false })
      .limit(limit + 1 + related.length);
    const seen = new Set(related.map((p) => p.id));
    for (const raw of fill ?? []) {
      const p = normalizePost(raw);
      if (!seen.has(p.id)) {
        related.push(p);
        seen.add(p.id);
      }
      if (related.length >= limit) break;
    }
  }
  return related;
}

export async function getGlobalPostsTotal(
  locale: Locale,
  categorySlug?: string,
): Promise<number> {
  const supabase = createStaticClient();
  let query = supabase
    .from('global_posts')
    .select('id', { count: 'exact', head: true })
    .eq('locale', locale)
    .eq('status', 'published');
  if (categorySlug) {
    const cats = await getGlobalCategories(locale);
    const cat = cats.find((c) => c.slug === categorySlug);
    if (!cat) return 0;
    query = query.eq('category_id', cat.id);
  }
  const { count } = await query;
  return count ?? 0;
}

/** Lightweight slug list for generateStaticParams (one locale). */
export async function getGlobalPostSlugs(locale: Locale): Promise<string[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('global_posts')
    .select('slug')
    .eq('locale', locale)
    .eq('status', 'published');
  if (error) return [];
  return (data ?? []).map((r) => (r as { slug: string }).slug);
}

// ============================================================
// hreflang support (global-blog-plan §5) — read-only, both directions
// ============================================================

export interface SiblingVersion {
  locale: Locale;
  slug: string;
}

/**
 * Sibling-language versions of a post (same translation_group_id, published).
 * Drives en↔ja↔es alternates. Includes the post itself (caller can keep or drop self).
 */
export async function getSiblingLocaleVersions(
  translationGroupId: string,
): Promise<SiblingVersion[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('global_posts')
    .select('locale, slug')
    .eq('translation_group_id', translationGroupId)
    .eq('status', 'published');
  if (error || !data) return [];
  return data.map((r) => {
    const row = r as { locale: Locale; slug: string };
    return { locale: row.locale, slug: row.slug };
  });
}

/**
 * Korean source slug for a global post (type A only).
 * Returns null when source_post_id is NULL (type B/C) or the source is not published.
 * Used to emit the ko alternate (mindthos.com/blog/{slug}).
 */
export async function getKoreanSourceSlug(
  sourcePostId: string | null,
): Promise<string | null> {
  if (!sourcePostId) return null;
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('posts')
    .select('slug, status')
    .eq('id', sourcePostId)
    .eq('status', 'published')
    .maybeSingle();
  if (error || !data) return null;
  return (data as { slug: string }).slug;
}

/**
 * Batch variant of getKoreanSourceSlug for the sitemap — resolves many source ids at once.
 * Returns a Map of source_post_id → published Korean slug (missing/unpublished omitted).
 */
export async function getKoreanSourceSlugs(
  sourcePostIds: string[],
): Promise<Map<string, string>> {
  const ids = [...new Set(sourcePostIds.filter(Boolean))];
  const out = new Map<string, string>();
  if (ids.length === 0) return out;
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, status')
    .in('id', ids)
    .eq('status', 'published');
  if (error || !data) return out;
  for (const r of data) {
    const row = r as { id: string; slug: string };
    out.set(row.id, row.slug);
  }
  return out;
}

// ============================================================
// sitemap support — all published posts across every locale, minimal fields
// ============================================================

export interface SitemapPostRow {
  locale: Locale;
  slug: string;
  updated_at: string;
  published_at: string | null;
  translation_group_id: string;
  source_post_id: string | null;
}

const SITEMAP_MAX_POSTS = 5000;

export async function getAllPublishedGlobalPostsForSitemap(): Promise<
  SitemapPostRow[]
> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('global_posts')
    .select(
      'locale, slug, updated_at, published_at, translation_group_id, source_post_id',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(0, SITEMAP_MAX_POSTS - 1);
  if (error || !data) return [];
  return data as SitemapPostRow[];
}
