/**
 * Minimal Supabase Database type for the global blog.
 *
 * Covers only the tables the global site reads:
 * - global_posts, global_categories, global_post_tags (global-only, additive)
 * - authors (shared with the Korean site, read-only)
 * - posts (read-only — only the `slug` is read, for ko hreflang reciprocity)
 *
 * Keep in sync with web/supabase/migrations/011_global_blog.sql.
 */

export type GlobalPostStatus = 'draft' | 'published' | 'archived';

type GlobalPostRow = {
  id: string;
  locale: string;
  slug: string;
  translation_group_id: string;
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
  status: GlobalPostStatus;
  meta_title: string | null;
  meta_description: string | null;
  schema_markup: Record<string, unknown> | null;
  references: unknown;
  cta_type: string | null;
  reading_time: number | null;
  view_count: number | null;
  is_featured: boolean | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

type GlobalCategoryRow = {
  id: string;
  locale: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number | null;
  created_at: string;
}

type AuthorRow = {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  profile_image_url: string | null;
  credentials: string[] | null;
  specialties: string[] | null;
  role: string | null;
  is_active: boolean | null;
  sort_order: number | null;
}

type PostRow = {
  id: string;
  slug: string;
  status: string;
}

/** Pre-launch waitlist lead — see web/supabase/migrations/012_global_leads.sql. */
type GlobalLeadRow = {
  id: string;
  email: string;
  locale: string | null;
  source: string | null;
  page_path: string | null;
  utm: Record<string, string> | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Database {
  public: {
    // Each table carries `Relationships: []` so it satisfies supabase-js's
    // `GenericTable`. Without it the whole schema fails the `GenericSchema`
    // constraint, the client's `Schema` generic collapses to `never`, and every
    // insert/upsert payload is typed `never[]` (reads still work). Empty here
    // because we don't type embedded relations. Matches `supabase gen types`.
    Tables: {
      global_posts: {
        Row: GlobalPostRow;
        Insert: Partial<GlobalPostRow> &
          Pick<GlobalPostRow, 'locale' | 'slug' | 'translation_group_id' | 'title' | 'content'>;
        Update: Partial<GlobalPostRow>;
        Relationships: [];
      };
      global_categories: {
        Row: GlobalCategoryRow;
        Insert: Partial<GlobalCategoryRow> &
          Pick<GlobalCategoryRow, 'locale' | 'slug' | 'name'>;
        Update: Partial<GlobalCategoryRow>;
        Relationships: [];
      };
      global_post_tags: {
        Row: { post_id: string; tag: string };
        Insert: { post_id: string; tag: string };
        Update: Partial<{ post_id: string; tag: string }>;
        Relationships: [];
      };
      authors: {
        Row: AuthorRow;
        Insert: Partial<AuthorRow> & Pick<AuthorRow, 'name' | 'slug'>;
        Update: Partial<AuthorRow>;
        Relationships: [];
      };
      posts: {
        Row: PostRow;
        Insert: Partial<PostRow>;
        Update: Partial<PostRow>;
        Relationships: [];
      };
      global_leads: {
        Row: GlobalLeadRow;
        Insert: Partial<GlobalLeadRow> & Pick<GlobalLeadRow, 'email'>;
        Update: Partial<GlobalLeadRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
