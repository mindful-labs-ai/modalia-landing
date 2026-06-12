#!/usr/bin/env node
/**
 * Global blog publishing pipeline (global-blog-plan §6).
 *
 * Reads one or more staging JSON files and UPSERTs them into `global_posts`
 * (conflict target: locale+slug), then optionally triggers ISR revalidation
 * and IndexNow submission for the affected paths.
 *
 * Usage:
 *   node --env-file=.env.local scripts/publish-global-post.mjs <file.json> [more.json ...]
 *   node --env-file=.env.local scripts/publish-global-post.mjs --dry-run scripts/content/example-en.json
 *
 * Env (server-only):
 *   NEXT_PUBLIC_SUPABASE_URL        (required)
 *   SUPABASE_SERVICE_ROLE_KEY       (required for writes; not needed for --dry-run)
 *   NEXT_PUBLIC_SITE_URL            (optional — enables revalidate + indexnow)
 *   REVALIDATE_SECRET               (optional — guards the API routes)
 *
 * Staging JSON shape (see scripts/content/example-en.json):
 *   { locale, slug, title, content, ... , category_slug?, translation_group_id?,
 *     source_post_id?, reviewed? }
 *
 * Quality gate (§6.3): a post is only published when `reviewed: true`. Otherwise it is
 * forced to status:'draft' so machine-translated or unreviewed drafts never go live.
 */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const files = args.filter((a) => !a.startsWith('--'));

if (files.length === 0) {
  console.error('Usage: node --env-file=.env.local scripts/publish-global-post.mjs [--dry-run] <file.json> ...');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

if (!SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}
if (!dryRun && !SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY (required for writes). Use --dry-run to validate only.');
  process.exit(1);
}
// Writes need the service role (bypasses RLS). --dry-run only reads, so the anon key suffices.
const ACTIVE_KEY = dryRun ? (SERVICE_KEY ?? ANON_KEY) : SERVICE_KEY;
if (!ACTIVE_KEY) {
  console.error('Missing Supabase key. Provide SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY (dry-run).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ACTIVE_KEY, {
  auth: { persistSession: false },
});

const LOCALES = new Set(['en', 'es', 'zh-Hant', 'de']);
const CJK_LOCALES = new Set(['zh-Hant']);
const REQUIRED = ['locale', 'slug', 'title', 'content'];

function estimateReadingTime(content, locale) {
  // CJK has no word spacing — estimate by character count instead of words.
  if (CJK_LOCALES.has(locale)) return Math.max(1, Math.ceil(content.length / 500));
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Resolve category_slug → category_id for the post's locale. */
async function resolveCategoryId(locale, categorySlug) {
  if (!categorySlug) return null;
  const { data, error } = await supabase
    .from('global_categories')
    .select('id')
    .eq('locale', locale)
    .eq('slug', categorySlug)
    .maybeSingle();
  if (error) throw new Error(`category lookup failed: ${error.message}`);
  if (!data) throw new Error(`unknown category "${categorySlug}" for locale "${locale}"`);
  return data.id;
}

/** Reuse the translation_group_id of an existing sibling (same source_post_id) if present. */
async function findGroupForSource(sourcePostId) {
  if (!sourcePostId) return null;
  const { data } = await supabase
    .from('global_posts')
    .select('translation_group_id')
    .eq('source_post_id', sourcePostId)
    .limit(1)
    .maybeSingle();
  return data?.translation_group_id ?? null;
}

/**
 * Flatten the transcreate staging shape into the flat shape buildRow expects.
 * Transcreate (scripts/transcreate-post.mjs) nests the post fields under a `content`
 * object and carries FAQs as a `faq` array; the app renders FAQs from `schema_markup`
 * (a FAQPage JSON-LD), so synthesize that here. Flat docs pass through unchanged.
 */
function normalizeDoc(doc) {
  if (!doc || typeof doc.content !== 'object' || doc.content === null) return doc;
  const c = doc.content;
  const faq = Array.isArray(c.faq) ? c.faq.filter((f) => f && f.question && f.answer) : [];
  const schemaMarkup =
    doc.schema_markup ??
    (faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null);
  return {
    ...doc,
    ...c, // title, slug, excerpt, summary, content(body), keywords, meta_*, references, thumbnail_url, og_image_url, reading_time
    content: c.content, // ensure `content` is the markdown body string, not the nested object
    schema_markup: schemaMarkup,
  };
}

function validate(doc, file) {
  for (const key of REQUIRED) {
    if (!doc[key] || String(doc[key]).trim() === '') {
      throw new Error(`${file}: missing required field "${key}"`);
    }
  }
  if (!LOCALES.has(doc.locale)) {
    throw new Error(`${file}: invalid locale "${doc.locale}" (expected en|es|zh-Hant|de)`);
  }
}

async function buildRow(doc) {
  const status = doc.reviewed === true ? (doc.status ?? 'published') : 'draft';
  const categoryId = await resolveCategoryId(doc.locale, doc.category_slug);

  // translation_group_id: explicit > reuse existing sibling by source > new uuid.
  let groupId = doc.translation_group_id;
  if (!groupId) groupId = await findGroupForSource(doc.source_post_id ?? null);
  if (!groupId) groupId = randomUUID();

  const publishedAt =
    status === 'published' ? (doc.published_at ?? new Date().toISOString()) : doc.published_at ?? null;

  return {
    locale: doc.locale,
    slug: doc.slug,
    translation_group_id: groupId,
    source_post_id: doc.source_post_id ?? null,
    title: doc.title,
    excerpt: doc.excerpt ?? null,
    content: doc.content,
    summary: doc.summary ?? null,
    keywords: doc.keywords ?? [],
    category_id: categoryId,
    author_id: doc.author_id ?? null,
    thumbnail_url: doc.thumbnail_url ?? null,
    og_image_url: doc.og_image_url ?? null,
    status,
    meta_title: doc.meta_title ?? null,
    meta_description: doc.meta_description ?? null,
    schema_markup: doc.schema_markup ?? null,
    references: doc.references ?? [],
    cta_type: doc.cta_type ?? 'free-trial',
    reading_time: doc.reading_time ?? estimateReadingTime(doc.content, doc.locale),
    is_featured: doc.is_featured ?? false,
    published_at: publishedAt,
  };
}

async function postJson(path, body) {
  if (!SITE_URL || !REVALIDATE_SECRET) return { skipped: true };
  const res = await fetch(`${SITE_URL}${path}?secret=${encodeURIComponent(REVALIDATE_SECRET)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, ok: res.ok };
}

async function main() {
  const published = [];

  for (const file of files) {
    const doc = normalizeDoc(JSON.parse(await readFile(file, 'utf8')));
    validate(doc, file);
    const row = await buildRow(doc);

    if (row.status !== 'published') {
      console.warn(`⚠ ${file}: status="${row.status}" (set "reviewed": true to publish). Upserting as draft.`);
    }

    if (dryRun) {
      console.log(`[dry-run] would upsert ${row.locale}/${row.slug} (status=${row.status}, group=${row.translation_group_id}, category_id=${row.category_id ?? 'none'})`);
      continue;
    }

    const { error } = await supabase
      .from('global_posts')
      .upsert(row, { onConflict: 'locale,slug' });
    if (error) {
      console.error(`✗ ${file}: upsert failed — ${error.message}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`✓ upserted ${row.locale}/${row.slug} (status=${row.status})`);
    if (row.status === 'published') {
      published.push({ locale: row.locale, slug: row.slug });
    }
  }

  if (!dryRun && published.length > 0) {
    const paths = new Set();
    for (const p of published) {
      paths.add(`/${p.locale}/blog`);
      paths.add(`/${p.locale}/blog/${p.slug}`);
    }
    const urls = published.map((p) => `${SITE_URL}/${p.locale}/blog/${p.slug}`);

    const rev = await postJson('/api/revalidate', { paths: [...paths] });
    console.log('revalidate:', JSON.stringify(rev));
    const idx = await postJson('/api/indexnow', { urls });
    console.log('indexnow:', JSON.stringify(idx));
  }

  console.log(dryRun ? 'Dry run complete.' : 'Publish complete.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
