import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * On-demand ISR revalidation, called by the publishing pipeline after an upsert.
 *
 * POST /api/revalidate?secret=...   body: { "paths": ["/en/blog", "/en/blog/my-slug"] }
 * (or send the secret as the `x-revalidate-secret` header)
 *
 * Guarded by REVALIDATE_SECRET. If the secret is unset, the endpoint is disabled (503).
 */
export async function POST(req: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'revalidate disabled' }, { status: 503 });
  }
  const provided =
    req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-revalidate-secret');
  if (provided !== expected) {
    return NextResponse.json({ error: 'invalid secret' }, { status: 401 });
  }

  let paths: string[] = [];
  try {
    const body = (await req.json()) as { paths?: unknown };
    if (Array.isArray(body.paths)) {
      paths = body.paths.filter((p): p is string => typeof p === 'string');
    }
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (paths.length === 0) {
    return NextResponse.json({ error: 'no paths provided' }, { status: 400 });
  }

  for (const path of paths) revalidatePath(path);
  // The sitemap depends on the full post set — keep it fresh on every publish.
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ revalidated: true, paths, now: Date.now() });
}
