import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Server-only Supabase client authenticated with the service-role key.
 *
 * This key bypasses RLS, so it must NEVER be imported into a Client Component or
 * any `NEXT_PUBLIC_` path. The only caller is the /api/lead route, which writes
 * pre-launch waitlist leads into the (policy-less) `global_leads` table.
 *
 * Returns null when the key is unset so callers can degrade gracefully (503)
 * instead of throwing at module load — the rest of the site (read-only blog,
 * landing) keeps building without the service-role key present.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
