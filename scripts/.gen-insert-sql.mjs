#!/usr/bin/env node
/**
 * One-off: generate a single, escape-safe INSERT for the 5 transcreated samples,
 * to be run via the Supabase MCP (no service-role key needed). Reuses the exact
 * normalization that publish-global-post.mjs now performs (nested `content` +
 * `faq` -> flat fields + schema_markup FAQPage). Forces status=published.
 *
 * Output: scripts/.data/insert-samples.sql  (JSON embedded via dollar-quoting)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT = resolve(__dirname, 'content');
const FILES = [
  'body-signals-self-supervision-clinicians.en.json',
  'compassion-fatigue-counselor-self-care.en.json',
  'developmental-case-conceptualization-erikson-piaget.en.json',
  'mmpi-2-rcd-rc2-depression-interpretation.en.json',
  'rorschach-determinants-exner-system.en.json',
];

function normalizeDoc(doc) {
  if (!doc || typeof doc.content !== 'object' || doc.content === null) return doc;
  const c = doc.content;
  const faq = Array.isArray(c.faq) ? c.faq.filter((f) => f && f.question && f.answer) : [];
  const schema_markup =
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
  return { ...doc, ...c, content: c.content, schema_markup };
}

function estimateReadingTime(content, locale) {
  if (locale === 'ja') return Math.max(1, Math.ceil(content.length / 500));
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const rows = [];
for (const file of FILES) {
  const doc = normalizeDoc(JSON.parse(await readFile(resolve(CONTENT, file), 'utf8')));
  rows.push({
    locale: doc.locale,
    slug: doc.slug,
    translation_group_id: doc.translation_group_id,
    source_post_id: doc.source_post_id ?? null,
    title: doc.title,
    excerpt: doc.excerpt ?? null,
    content: doc.content,
    summary: doc.summary ?? null,
    keywords: doc.keywords ?? [],
    category_slug: doc.category_slug ?? null,
    author_id: doc.author_id ?? null,
    thumbnail_url: doc.thumbnail_url ?? null,
    og_image_url: doc.og_image_url ?? null,
    status: 'published',
    meta_title: doc.meta_title ?? null,
    meta_description: doc.meta_description ?? null,
    schema_markup: doc.schema_markup ?? null,
    references: doc.references ?? [],
    cta_type: doc.cta_type ?? 'free-trial',
    reading_time: doc.reading_time ?? estimateReadingTime(doc.content, doc.locale),
    is_featured: false,
  });
}

await mkdir(resolve(__dirname, '.data/sql'), { recursive: true });

function buildSql(rowArr) {
  const json = JSON.stringify(rowArr);
  let tag = 'omcjson';
  while (json.includes(`$${tag}$`)) tag += 'x';
  return `insert into global_posts (
  locale, slug, translation_group_id, source_post_id, title, excerpt, content,
  summary, keywords, category_id, author_id, thumbnail_url, og_image_url, status,
  meta_title, meta_description, schema_markup, "references", cta_type, reading_time,
  is_featured, published_at
)
select
  r.locale, r.slug, r.translation_group_id::uuid, r.source_post_id::uuid, r.title, r.excerpt, r.content,
  r.summary, r.keywords, gc.id, r.author_id::uuid, r.thumbnail_url, r.og_image_url, r.status,
  r.meta_title, r.meta_description, r.schema_markup, r."references", r.cta_type, r.reading_time,
  r.is_featured, now()
from jsonb_to_recordset($${tag}$${json}$${tag}$::jsonb) as r(
  locale text, slug text, translation_group_id uuid, source_post_id uuid, title text, excerpt text, content text,
  summary text, keywords text[], category_slug text, author_id uuid, thumbnail_url text, og_image_url text, status text,
  meta_title text, meta_description text, schema_markup jsonb, "references" jsonb, cta_type text, reading_time int,
  is_featured boolean
)
left join global_categories gc on gc.locale = r.locale and gc.slug = r.category_slug
on conflict (locale, slug) do update set
  translation_group_id = excluded.translation_group_id,
  source_post_id = excluded.source_post_id,
  title = excluded.title, excerpt = excluded.excerpt, content = excluded.content,
  summary = excluded.summary, keywords = excluded.keywords, category_id = excluded.category_id,
  thumbnail_url = excluded.thumbnail_url, og_image_url = excluded.og_image_url, status = excluded.status,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description,
  schema_markup = excluded.schema_markup, "references" = excluded."references",
  cta_type = excluded.cta_type, reading_time = excluded.reading_time, is_featured = excluded.is_featured,
  published_at = coalesce(global_posts.published_at, excluded.published_at), updated_at = now()
returning locale, slug, status, category_id;`;
}

let i = 0;
for (const row of rows) {
  i += 1;
  const out = resolve(__dirname, `.data/sql/${String(i).padStart(2, '0')}-${row.slug}.sql`);
  const sql = buildSql([row]);
  await writeFile(out, sql);
  console.log(`wrote ${out} (${sql.length} bytes)`);
}
console.log('category_slugs:', [...new Set(rows.map((r) => r.category_slug))].join(', '));
