#!/usr/bin/env node
/**
 * translate-post.mjs — Claude reads a PUBLISHED English article and RE-CREATES it as a
 * natural article in a target locale (es | zh-Hant | de) for that market's clinicians
 * (transcreation, not literal translation). Writes a publish-ready staging JSON for human
 * review; does NOT write to the DB.
 *
 * Type-A sibling linking: the target-locale row reuses the English sibling's `slug`,
 * `translation_group_id`, `source_post_id`, category, references and thumbnail — so
 * hreflang en↔es↔zh-Hant↔de(+ko) stays connected. Only the prose/SEO fields are localized.
 *
 * Source = the English canonical (already KR-stripped), NOT the Korean original.
 *
 * Usage:
 *   node --env-file=.env.local scripts/translate-post.mjs --locale es --limit 5
 *   node --env-file=.env.local scripts/translate-post.mjs --locale de --slug rorschach-determinants-exner-system
 *   node --env-file=.env.local scripts/translate-post.mjs --locale zh-Hant --slug <slug> --dry-run   # print prompt, no API call
 *   node --env-file=.env.local scripts/translate-post.mjs --locale es --slug <slug> --force          # overwrite existing target row
 *
 * Output: scripts/content/<en-slug>.<locale>.json  (nested staging shape, reviewed:false)
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, 'content');
const CONTENT_CAP = 24000;
const TARGET_LOCALES = new Set(['es', 'zh-Hant', 'de']);
const LANG_NAME = { es: 'Spanish', 'zh-Hant': 'Traditional Chinese (Taiwan)', de: 'German' };

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i !== -1 ? args[i + 1] : d; };
const has = (n) => args.includes(n);
const LOCALE = flag('--locale', '');
const LIMIT = parseInt(flag('--limit', '5'), 10) || 5;
const CONCURRENCY = parseInt(flag('--concurrency', '3'), 10) || 3;
const MODEL = flag('--model', 'claude-opus-4-8');
const DRY_RUN = has('--dry-run');
const FORCE = has('--force');
const SLUGS = args.filter((_v, i) => args[i - 1] === '--slug');

if (!TARGET_LOCALES.has(LOCALE)) {
  console.error(`--locale must be one of: ${[...TARGET_LOCALES].join(', ')}`);
  process.exit(1);
}

const STYLE = readFileSync(resolve(__dirname, `style-guide.${LOCALE}.md`), 'utf8');
const GLOSSARY = JSON.parse(readFileSync(resolve(__dirname, `glossary.${LOCALE}.json`), 'utf8'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON) { console.error('Missing Supabase env'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, ANON);

const EN_SELECT =
  'id, slug, title, excerpt, summary, content, keywords, meta_title, meta_description, ' +
  'schema_markup, references, thumbnail_url, og_image_url, source_post_id, translation_group_id, ' +
  'category:global_categories(slug)';

/** Pull the FAQ Q&A pairs out of an English post's schema_markup (FAQPage JSON-LD). */
function faqFromSchema(schema) {
  const main = schema && Array.isArray(schema.mainEntity) ? schema.mainEntity : [];
  return main
    .map((q) => ({ question: q?.name, answer: q?.acceptedAnswer?.text }))
    .filter((f) => f.question && f.answer);
}

function buildPrompt(en, faq) {
  const glossaryStr = JSON.stringify(GLOSSARY.terms);
  const brandStr = JSON.stringify(GLOSSARY.brand);
  const preserve = (GLOSSARY.preserve_verbatim || []).join(', ');
  const faqStr = faq.length
    ? faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n')
    : '(none)';
  return `You are a senior clinical-content editor who TRANSCREATES psychology/counseling articles into natural ${LANG_NAME[LOCALE]} for professional clinicians in that market. This is re-creation for cultural and linguistic fit — NOT literal translation.

# STYLE GUIDE
${STYLE}

# GLOSSARY (apply consistently)
brand: ${brandStr}
terms (en→${LOCALE}): ${glossaryStr}
preserve verbatim (do not translate): ${preserve}

# TASK
Re-create the English article below as a complete ${LANG_NAME[LOCALE]} article. Restructure sentences freely for natural flow; preserve ALL core clinical claims, theory, and academic citations (authors/years/DOIs). Preserve the markdown structure exactly: same heading hierarchy, the comparison TABLE (same columns/rows) if present, blockquotes, bold/italic, bullet lists, and any score notations (e.g. "RCd ↑ / RC2 ↔", ">65T") verbatim. Localize all ${faq.length} FAQ items.

Return ONLY a JSON object (no prose, no code fence) with EXACTLY these fields:
{
  "title": "natural ${LANG_NAME[LOCALE]} title",
  "excerpt": "short card/meta blurb",
  "summary": "self-contained answer, 2-4 sentences",
  "content": "Markdown body starting with ##",
  "keywords": ["6-7 ${LANG_NAME[LOCALE]} terms; keep instrument names as-is"],
  "meta_title": "concise",
  "meta_description": "value + soft action",
  "faq": [{"question":"...","answer":"..."}]
}
Do NOT output a slug, references, or category (carried over from the English sibling).
NO Hangul, NO ₩/원, NO Korean hotline numbers, NO /blog/ internal links, NEVER the word "Mindthos".

# ENGLISH SOURCE POST
Title: ${en.title}
Excerpt: ${en.excerpt || ''}
Summary: ${en.summary || ''}
FAQ:
${faqStr}
Content:
${(en.content || '').slice(0, CONTENT_CAP)}`;
}

function callClaude(prompt) {
  return new Promise((res, rej) => {
    const p = spawn('claude', ['-p', prompt, '--output-format', 'json', '--max-turns', '1', '--model', MODEL], { stdio: ['ignore', 'pipe', 'pipe'] });
    const out = [], err = [];
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => err.push(d));
    p.on('error', rej);
    p.on('close', (code) => {
      if (code !== 0) return rej(new Error(`claude exit ${code}: ${Buffer.concat(err).toString('utf8').slice(0, 300)}`));
      try {
        const parsed = JSON.parse(Buffer.concat(out).toString('utf8'));
        if (parsed.is_error) return rej(new Error(`claude api error: ${parsed.api_error_status}`));
        res({ text: parsed.result, costUsd: parsed.total_cost_usd });
      } catch (e) { rej(new Error(`parse fail: ${e.message}`)); }
    });
  });
}

function extractJson(raw) {
  let t = (raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const st = t.indexOf('{'), en = t.lastIndexOf('}');
  if (st !== -1 && en !== -1) t = t.slice(st, en + 1);
  return JSON.parse(t);
}

// deterministic leak check — these must never appear in any target locale (source is English).
// Note: Hangul check is Hangul-specific, so Traditional Chinese Han characters are NOT flagged.
function leakCheck(doc) {
  const blob = JSON.stringify(doc);
  const issues = [];
  if (/[가-힣]/.test(blob)) issues.push('Hangul present');
  if (/[₩]|원\b/.test(blob)) issues.push('won/₩ present');
  if (/\b(109|1393|1388)\b/.test(blob)) issues.push('KR hotline number');
  if (/\/blog\//.test(blob)) issues.push('internal /blog/ link');
  if (/mindthos/i.test(blob)) issues.push('"Mindthos" brand leak');
  return issues;
}

function validate(doc) {
  const req = ['title', 'excerpt', 'summary', 'content', 'meta_title', 'meta_description'];
  for (const k of req) if (!doc[k] || (typeof doc[k] === 'string' && !doc[k].trim())) return [`missing ${k}`];
  if (!Array.isArray(doc.keywords) || doc.keywords.length < 3) return ['keywords < 3'];
  if (!doc.content.trim().startsWith('#')) return ['content must start with a markdown heading'];
  return leakCheck(doc);
}

function readingTime(md) {
  if (LOCALE === 'zh-Hant') return Math.max(1, Math.ceil((md || '').length / 500));
  const w = (md || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(w / 200));
}

async function fetchEnPosts() {
  let q = supabase.from('global_posts').select(EN_SELECT).eq('locale', 'en').eq('status', 'published');
  if (SLUGS.length) q = q.in('slug', SLUGS);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((r) => ({ ...r, category: Array.isArray(r.category) ? r.category[0] : r.category }));
}

async function existingTargetSlugs() {
  const { data } = await supabase.from('global_posts').select('slug').eq('locale', LOCALE);
  return new Set((data || []).map((r) => r.slug));
}

async function main() {
  mkdirSync(CONTENT_DIR, { recursive: true });
  let posts = await fetchEnPosts();
  if (posts.length === 0) { console.log('No matching English posts.'); return; }

  if (!FORCE) {
    const taken = await existingTargetSlugs();
    posts = posts.filter((p) => !taken.has(p.slug));
  }
  if (!SLUGS.length) posts = posts.slice(0, LIMIT);
  if (posts.length === 0) { console.log(`Nothing to translate for ${LOCALE} (all targets already exist; use --force to overwrite).`); return; }

  console.log(`Translating ${posts.length} post(s) → ${LOCALE}  model=${MODEL} concurrency=${CONCURRENCY}${DRY_RUN ? '  [DRY RUN]' : ''}`);

  // Dry run: print the prompt for the first post and exit (verifies wiring without an API call).
  if (DRY_RUN) {
    const p = posts[0];
    const faq = faqFromSchema(p.schema_markup);
    console.log(`\n--- DRY RUN: ${p.slug} (category=${p.category?.slug}, faq=${faq.length}, group=${p.translation_group_id}) ---\n`);
    console.log(buildPrompt(p, faq));
    return;
  }

  let i = 0, ok = 0, fail = 0, cost = 0;
  async function worker() {
    while (true) {
      const idx = i++; if (idx >= posts.length) return;
      const en = posts[idx];
      const faq = faqFromSchema(en.schema_markup);
      const categorySlug = en.category?.slug;
      if (!categorySlug) { fail++; console.warn(`  ✗ ${en.slug}: English sibling has no category`); continue; }

      let attempt = 0, doc = null, lastErr = null;
      while (attempt < 3 && !doc) {
        attempt++;
        try {
          const { text, costUsd } = await callClaude(buildPrompt(en, faq));
          cost += costUsd || 0;
          const cand = extractJson(text);
          const issues = validate(cand);
          if (issues.length) throw new Error(issues.join('; '));
          doc = cand;
        } catch (e) { lastErr = e; }
      }
      if (!doc) { fail++; console.warn(`  ✗ ${en.slug}: ${lastErr?.message}`); continue; }

      const staging = {
        locale: LOCALE,
        source_post_id: en.source_post_id,
        translation_group_id: en.translation_group_id, // reuse the English sibling's group (type-A)
        category_slug: categorySlug,
        reviewed: false, // stays draft on publish until a human flips this to true
        status: 'published',
        content: {
          title: doc.title,
          slug: en.slug, // type-A: shared slug across locales
          excerpt: doc.excerpt,
          summary: doc.summary,
          content: doc.content,
          keywords: doc.keywords,
          meta_title: doc.meta_title,
          meta_description: doc.meta_description,
          faq: Array.isArray(doc.faq) ? doc.faq.filter((f) => f && f.question && f.answer) : [],
          references: Array.isArray(en.references) ? en.references : [], // language-neutral academic citations
          thumbnail_url: en.thumbnail_url || null,
          og_image_url: en.og_image_url || null,
          reading_time: readingTime(doc.content),
        },
        _source: { en_slug: en.slug, locale: LOCALE },
      };
      const outFile = resolve(CONTENT_DIR, `${en.slug}.${LOCALE}.json`);
      writeFileSync(outFile, JSON.stringify(staging, null, 2));
      ok++;
      console.log(`  ✓ ${en.slug} → ${LOCALE}  (${staging.content.reading_time}min, faq ${staging.content.faq.length})`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\nDONE. ok=${ok} fail=${fail} cost=$${cost.toFixed(2)}  → ${CONTENT_DIR}`);
  console.log(`Next: review the files, set "reviewed": true, then publish:`);
  console.log(`  node --env-file=.env.local scripts/publish-global-post.mjs scripts/content/*.${LOCALE}.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
