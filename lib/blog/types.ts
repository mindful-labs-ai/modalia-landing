import type { Locale } from '@/i18n/routing';

/** A reference/citation entry stored in global_posts.references (jsonb array). */
export interface Reference {
  name: string;
  url?: string;
  type?: 'academic' | 'government' | 'industry';
  description?: string;
}

export interface GlobalCategory {
  id: string;
  locale: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number | null;
}

export interface GlobalAuthor {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  profile_image_url: string | null;
  specialties: string[] | null;
}

/**
 * A global blog post with its joined category/author.
 * Mirrors the Korean `Post` shape but adds the global-specific i18n columns
 * (`locale`, `translation_group_id`, `source_post_id`).
 */
export interface GlobalPost {
  id: string;
  locale: Locale;
  slug: string;
  translation_group_id: string;
  /** Korean source post id — null for global-independent posts (type B/C). */
  source_post_id: string | null;
  title: string;
  excerpt: string | null;
  content: string;
  summary: string | null;
  keywords: string[] | null;
  category_id: string | null;
  author_id: string | null;
  thumbnail_url: string | null;
  og_image_url: string | null;
  status: 'draft' | 'published' | 'archived';
  meta_title: string | null;
  meta_description: string | null;
  schema_markup: Record<string, unknown> | null;
  references: Reference[] | null;
  cta_type: string | null;
  reading_time: number | null;
  view_count: number | null;
  is_featured: boolean | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category: GlobalCategory | null;
  author: GlobalAuthor | null;
}
