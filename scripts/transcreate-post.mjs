#!/usr/bin/env node
/**
 * transcreate-post.mjs — Claude reads a full Korean post and RE-CREATES it as a
 * natural English article for English-speaking clinicians (transcreation, not literal
 * translation). Writes a staging JSON for human review; does NOT write to the DB.
 *
 * Selection is driven by scripts/.data/classify-results.jsonl (verdict='global'),
 * highest score first, skipping posts already present as en in global_posts.
 *
 * Usage:
 *   node --env-file=.env.local scripts/transcreate-post.mjs --limit 5           # top-5 sample
 *   node --env-file=.env.local scripts/transcreate-post.mjs --slug <kr-slug>    # specific post(s)
 *   node --env-file=.env.local scripts/transcreate-post.mjs --limit 30 --concurrency 4
 *
 * Output: scripts/content/<en-slug>.en.json  (reviewed:false)
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '.data', 'classify-results.jsonl');
const CONTENT_DIR = resolve(__dirname, 'content');
const GLOSSARY = JSON.parse(readFileSync(resolve(__dirname, 'glossary.json'), 'utf8'));
const STYLE = readFileSync(resolve(__dirname, 'style-guide.en.md'), 'utf8');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i !== -1 ? args[i + 1] : d; };
const LIMIT = parseInt(flag('--limit', '5'), 10) || 5;
const CONCURRENCY = parseInt(flag('--concurrency', '3'), 10) || 3;
const MODEL = flag('--model', 'claude-opus-4-8');
const SLUGS = args.filter((_v, i) => args[i - 1] === '--slug');
const CONTENT_CAP = 24000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON) { console.error('Missing Supabase env'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, ANON);

// Global taxonomy (6 categories). Legacy classify verdicts (insights/technology/guides/case-studies)
// map to the best-fit new slug so cached classify-results.jsonl rows still resolve.
const GLOBAL_CATEGORIES = ['case-conceptualization', 'assessment', 'clinical-skills', 'therapist-wellbeing', 'ethics-practice', 'professional-development'];
const LEGACY_CATEGORY = { insights: 'case-conceptualization', guides: 'clinical-skills', technology: 'professional-development', 'case-studies': 'professional-development' };
const resolveCategory = (s) => (GLOBAL_CATEGORIES.includes(s) ? s : (LEGACY_CATEGORY[s] || 'case-conceptualization'));

function buildPrompt(post, notes, suggestedCategory) {
  const glossaryStr = JSON.stringify(GLOSSARY.terms);
  const brandStr = JSON.stringify(GLOSSARY.brand);
  const preserve = GLOSSARY.preserve_verbatim.join(', ');
  return `You are a senior clinical-content editor who TRANSCREATES Korean counseling/psychology articles into natural English for an audience of professional counselors and therapists in English-speaking markets. This is re-creation for cultural and linguistic fit — NOT literal translation.

# STYLE GUIDE
${STYLE}

# GLOSSARY (apply consistently)
brand: ${brandStr}
terms (ko→en): ${glossaryStr}
preserve verbatim (do not translate): ${preserve}

# THIS POST'S LOCALIZATION NOTES (from a prior analysis — follow them)
${notes || '(none)'}

# TASK
Re-create the Korean post below as a complete English article. Restructure freely for natural English flow; preserve all core clinical claims, theory, and academic citations (authors/years/DOIs). Generate a fresh English SEO slug (not a transliteration). Output the suggested category as "${suggestedCategory}".

Return ONLY a JSON object (no prose, no code fence) with EXACTLY these fields:
{
  "title": "natural English title",
  "slug": "english-seo-slug",
  "excerpt": "<=160 chars",
  "summary": "2-4 sentence self-contained answer",
  "content": "Markdown body starting with ##",
  "keywords": ["4-7 english terms"],
  "meta_title": "<=60 chars",
  "meta_description": "120-155 chars",
  "category": "${suggestedCategory}",
  "faq": [{"question":"...","answer":"..."}],
  "references": [{"name":"...","url":"...","type":"academic|government|industry"}]
}
Rules: faq may be [] if not natural. references: keep/transcreate the source's citations; [] if none. NO Hangul, NO ₩/원, NO Korean hotline numbers, NO /blog/ internal links, NEVER the word "Mindthos" anywhere.

# KOREAN SOURCE POST
Title: ${post.title}
Keywords: ${(post.keywords || []).join(', ')}
Excerpt: ${post.excerpt || ''}
Summary: ${post.summary || ''}
Content:
${(post.content || '').slice(0, CONTENT_CAP)}`;
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

// deterministic localization-leak check — fail closed
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
  const req = ['title', 'slug', 'excerpt', 'summary', 'content', 'keywords', 'meta_title', 'meta_description', 'category'];
  for (const k of req) if (!doc[k] || (typeof doc[k] === 'string' && !doc[k].trim())) return [`missing ${k}`];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.slug)) return [`bad slug: ${doc.slug}`];
  if (!Array.isArray(doc.keywords) || doc.keywords.length < 3) return ['keywords < 3'];
  return leakCheck(doc);
}

function readingTime(md) { const w = (md || '').trim().split(/\s+/).filter(Boolean).length; return Math.max(1, Math.ceil(w / 200)); }

async function existingEnSlugsAndSources() {
  const slugs = new Set(), sources = new Set();
  const { data } = await supabase.from('global_posts').select('slug, source_post_id, locale').eq('locale', 'en');
  for (const r of data || []) { slugs.add(r.slug); if (r.source_post_id) sources.add(r.source_post_id); }
  // also reserve slugs from staging files already produced
  if (existsSync(CONTENT_DIR)) for (const f of readdirSync(CONTENT_DIR)) if (f.endsWith('.en.json')) {
    try {
      const s = JSON.parse(readFileSync(resolve(CONTENT_DIR, f), 'utf8'));
      if (s.content?.slug) slugs.add(s.content.slug);
      if (s.source_post_id) sources.add(s.source_post_id); // skip already-staged sources
    } catch {}
  }
  return { slugs, sources };
}

async function main() {
  mkdirSync(CONTENT_DIR, { recursive: true });
  // classify results: id -> {verdict, score, suggested_category, transcreation_notes}
  const cls = new Map();
  for (const line of readFileSync(DATA, 'utf8').split('\n')) { if (!line.trim()) continue; try { const r = JSON.parse(line); cls.set(r.id, r); } catch {} }

  const { slugs: takenSlugs, sources: doneSources } = await existingEnSlugsAndSources();

  // selection
  let targetIds = [];
  if (SLUGS.length) {
    const { data } = await supabase.from('posts').select('id, slug').in('slug', SLUGS).eq('status', 'published');
    targetIds = (data || []).map((p) => p.id);
  } else {
    targetIds = [...cls.values()]
      .filter((r) => r.verdict === 'global' && !doneSources.has(r.id))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, LIMIT)
      .map((r) => r.id);
  }
  if (targetIds.length === 0) { console.log('Nothing to transcreate.'); return; }

  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, title, keywords, excerpt, summary, content, thumbnail_url, og_image_url, category:categories(slug)')
    .in('id', targetIds);

  console.log(`Transcreating ${posts.length} post(s)  model=${MODEL} concurrency=${CONCURRENCY}`);
  let i = 0, ok = 0, fail = 0, cost = 0;

  async function worker() {
    while (true) {
      const idx = i++; if (idx >= posts.length) return;
      const post = posts[idx];
      const meta = cls.get(post.id) || {};
      const suggested = resolveCategory(meta.suggested_category);
      let attempt = 0, doc = null, lastErr = null;
      while (attempt < 3 && !doc) {
        attempt++;
        try {
          const { text, costUsd } = await callClaude(buildPrompt(post, meta.transcreation_notes, suggested));
          cost += costUsd || 0;
          const cand = extractJson(text);
          const issues = validate(cand);
          if (issues.length) throw new Error(issues.join('; '));
          if (takenSlugs.has(cand.slug)) cand.slug = `${cand.slug}-${post.slug.slice(0, 6)}`;
          takenSlugs.add(cand.slug);
          doc = cand;
        } catch (e) { lastErr = e; }
      }
      if (!doc) { fail++; console.warn(`  ✗ ${post.slug}: ${lastErr?.message}`); continue; }

      const staging = {
        locale: 'en',
        source_post_id: post.id,
        translation_group_id: randomUUID(),
        category_slug: doc.category,
        reviewed: false,
        status: 'published',
        content: {
          title: doc.title,
          slug: doc.slug,
          excerpt: doc.excerpt,
          summary: doc.summary,
          content: doc.content,
          keywords: doc.keywords,
          meta_title: doc.meta_title,
          meta_description: doc.meta_description,
          faq: Array.isArray(doc.faq) ? doc.faq : [],
          references: Array.isArray(doc.references) ? doc.references : [],
          thumbnail_url: post.thumbnail_url || null,
          og_image_url: post.og_image_url || null,
          reading_time: readingTime(doc.content),
        },
        _source: { kr_slug: post.slug, suggested_category: meta.suggested_category, score: meta.score },
      };
      const outFile = resolve(CONTENT_DIR, `${doc.slug}.en.json`);
      writeFileSync(outFile, JSON.stringify(staging, null, 2));
      ok++;
      console.log(`  ✓ ${post.slug}  →  ${doc.slug}  (${staging.content.reading_time}min, faq ${staging.content.faq.length})`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\nDONE. ok=${ok} fail=${fail} cost=$${cost.toFixed(2)}  → ${CONTENT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
