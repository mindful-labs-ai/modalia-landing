import { NextResponse, type NextRequest } from 'next/server';
import { SITE_CONFIG } from '@/constants/site';

/**
 * Submit URLs to IndexNow (Bing / Yandex / Naver / Seznam) for fast discovery
 * of new global blog posts. Called by the publishing pipeline.
 *
 * POST /api/indexnow?secret=...   body: { "urls": ["https://modalia.ai/en/blog/my-slug"] }
 *
 * Requires INDEXNOW_KEY (and the matching /<key>.txt hosted at the site root) and
 * REVALIDATE_SECRET (shared guard). Disabled (503) when either is unset.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const key = process.env.INDEXNOW_KEY;
  if (!secret || !key) {
    return NextResponse.json({ error: 'indexnow disabled' }, { status: 503 });
  }
  const provided =
    req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-revalidate-secret');
  if (provided !== secret) {
    return NextResponse.json({ error: 'invalid secret' }, { status: 401 });
  }

  let urls: string[] = [];
  try {
    const body = (await req.json()) as { urls?: unknown };
    if (Array.isArray(body.urls)) {
      urls = body.urls.filter((u): u is string => typeof u === 'string');
    }
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (urls.length === 0) {
    return NextResponse.json({ error: 'no urls provided' }, { status: 400 });
  }

  const host = new URL(SITE_CONFIG.url).host;
  const payload = {
    host,
    key,
    keyLocation: `${SITE_CONFIG.url}/${key}.txt`,
    urlList: urls,
  };

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  return NextResponse.json(
    { submitted: urls.length, indexnowStatus: res.status },
    { status: res.ok ? 200 : 502 },
  );
}
