import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { routing } from '@/i18n/routing';

/**
 * Pre-launch waitlist lead capture.
 *
 * POST /api/lead
 *   body: {
 *     email: string,            // required
 *     locale?: string,          // site locale (validated against routing.locales)
 *     source?: string,          // CTA location that opened the modal
 *     page_path?: string,
 *     utm?: Record<string,string>,
 *     referrer?: string
 *   }
 *
 * Writes to `global_leads` via the service-role key. Re-submitting an email is
 * idempotent (unique email + on-conflict ignore) so the UX can always show success.
 * Disabled (503) when SUPABASE_SERVICE_ROLE_KEY is unset.
 */

export const runtime = 'nodejs';

/* Pragmatic RFC-5322-lite check — rejects obvious garbage without over-restricting. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 320; // RFC max email length

function asString(v: unknown, max = 512): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function sanitizeUtm(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== 'object') return null;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === 'string' && val) out[k.slice(0, 64)] = val.slice(0, 256);
  }
  return Object.keys(out).length ? out : null;
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'lead capture disabled' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const email = asString(body.email, MAX_LEN)?.toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const rawLocale = asString(body.locale, 16);
  const locale = (routing.locales as readonly string[]).includes(rawLocale ?? '')
    ? rawLocale
    : null;

  const { error } = await supabase
    .from('global_leads')
    .upsert(
      {
        email,
        locale,
        source: asString(body.source, 64),
        page_path: asString(body.page_path, 512),
        utm: sanitizeUtm(body.utm),
        referrer: asString(body.referrer, 1024),
        user_agent: req.headers.get('user-agent')?.slice(0, 1024) ?? null,
      },
      { onConflict: 'email', ignoreDuplicates: true },
    );

  if (error) {
    console.error('[api/lead] insert failed:', error.message);
    return NextResponse.json({ error: 'could not save' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
