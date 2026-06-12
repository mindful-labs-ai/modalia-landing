import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Cookie-less Supabase client for static generation.
 * Use in generateStaticParams / sitemap.ts / route metadata — anywhere called at build time.
 * Public read queries only (published global posts, categories). RLS is evaluated as `anon`.
 *
 * The global site shares the SAME Supabase project as the Korean site, reading only the
 * additive `global_*` tables (and `posts` slugs for ko hreflang). No writes from the web app.
 */
export function createStaticClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
