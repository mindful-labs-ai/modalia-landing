#!/usr/bin/env node
/**
 * classify-kr-posts.mjs — Claude reads the FULL body of each Korean post and
 * judges, semantically, whether it is reusable on the global blog.
 *
 * Unlike the SQL heuristic (keyword regex), this actually comprehends the article.
 *
 * Usage:
 *   node --env-file=.env.local scripts/classify-kr-posts.mjs            # all published, resumable
 *   node --env-file=.env.local scripts/classify-kr-posts.mjs --limit 5  # smoke test
 *   node --env-file=.env.local scripts/classify-kr-posts.mjs --only-verdict review
 *   node --env-file=.env.local scripts/classify-kr-posts.mjs --concurrency 6 --model claude-sonnet-4-6
 *
 * Reads posts with the ANON key (published posts are publicly readable).
 * Writes results to scripts/.data/classify-results.jsonl (one JSON per line, resumable).
 * It does NOT write to the DB (no service key here) — apply the JSONL to posts.global_* afterwards.
 *
 * Env (via --env-file=.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '.data', 'classify-results.jsonl');

// ---- args ----
const args = process.argv.slice(2);
const getFlag = (name, def) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : def;
};
const LIMIT = parseInt(getFlag('--limit', '0'), 10) || 0;
const CONCURRENCY = parseInt(getFlag('--concurrency', '6'), 10) || 6;
const MODEL = getFlag('--model', 'claude-sonnet-4-6');
const ONLY_VERDICT = getFlag('--only-verdict', ''); // current heuristic verdict to re-judge
const CONTENT_CAP = 16000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, ANON);

const PROMPT = `You are classifying a Korean counseling/psychology blog post for reuse on a GLOBAL English (and later multilingual) blog for clinicians and counselors (North America, Europe, Japan, etc.).

Read the FULL content and judge SEMANTICALLY (not by keywords) whether the topic is reusable internationally:
- "global": the clinical topic/theory/technique/insight applies internationally with only light localization (translate, generalize a crisis hotline, drop KR internal links). E.g. universal psychotherapy theory, worldwide assessments (WISC, MMPI, etc.), counseling skills, case conceptualization, self-care.
- "review": mostly universal BUT has meaningful Korea-specific scaffolding needing real adaptation (KR statistics/law as the core, KR institutional workflow, KR-only examples), OR genuinely ambiguous.
- "kr_only": fundamentally about the Korean system — licensure/exams (상담심리사 1급, 임상심리사 수련), Korean law/policy, KR institutions/contracts/tax, KR-only tools/services, KR job market. Not reusable without a rewrite.

suggested_category: clinical theory/skills/case-conceptualization/self-care → "insights"; security/AI/infra/product/tech → "technology"; how-to/workflow/training concepts → "guides"; adoption stories → "case-studies".

Return ONLY a JSON object, no prose, no code fence:
{"verdict":"global|review|kr_only","score":0-100,"reason":"<=160 chars English","region_flags":["kr-specific tags or empty"],"target_locales":["en"],"suggested_category":"insights|technology|guides|case-studies","transcreation_notes":"<=200 chars: what to adapt; '' if none"}

POST:`;

function callClaude(body) {
  return new Promise((res, rej) => {
    const p = spawn('claude', ['-p', `${PROMPT}\n${body}`, '--output-format', 'json', '--max-turns', '1', '--model', MODEL], { stdio: ['ignore', 'pipe', 'pipe'] });
    const out = [], err = [];
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => err.push(d));
    p.on('error', rej);
    p.on('close', (code) => {
      if (code !== 0) return rej(new Error(`claude exit ${code}: ${Buffer.concat(err).toString('utf8').slice(0, 300)}`));
      try {
        const parsed = JSON.parse(Buffer.concat(out).toString('utf8'));
        if (parsed.is_error) return rej(new Error(`claude api error: ${parsed.api_error_status}`));
        res({ text: parsed.result, costUsd: parsed.total_cost_usd, ms: parsed.duration_ms });
      } catch (e) { rej(new Error(`parse fail: ${e.message}`)); }
    });
  });
}

function extractJson(raw) {
  let t = (raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  return JSON.parse(t);
}

function buildBody(post) {
  const cat = Array.isArray(post.category) ? post.category[0]?.slug : post.category?.slug;
  const content = (post.content || '').slice(0, CONTENT_CAP);
  return [
    `KR category: ${cat || 'unknown'}`,
    `Title: ${post.title}`,
    `Keywords: ${(post.keywords || []).join(', ')}`,
    `Excerpt: ${post.excerpt || ''}`,
    `Summary: ${post.summary || ''}`,
    `Content:\n${content}`,
  ].join('\n');
}

async function fetchAllPosts() {
  const all = [];
  const PAGE = 200;
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from('posts')
      .select('id, slug, title, keywords, excerpt, summary, content, video_url, global_eligibility, category:categories(slug)')
      .eq('status', 'published')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (ONLY_VERDICT) q = q.eq('global_eligibility', ONLY_VERDICT);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

function loadDoneIds() {
  const done = new Set();
  if (!existsSync(OUT_PATH)) return done;
  for (const line of readFileSync(OUT_PATH, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); if (r.id && r.verdict && r.verdict !== 'error') done.add(r.id); } catch {}
  }
  return done;
}

async function main() {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  let posts = await fetchAllPosts();
  const done = loadDoneIds();
  posts = posts.filter((p) => !done.has(p.id));
  if (LIMIT) posts = posts.slice(0, LIMIT);

  console.log(`To classify: ${posts.length} (already done: ${done.size})  model=${MODEL} concurrency=${CONCURRENCY}`);
  if (posts.length === 0) return;

  let i = 0, ok = 0, fail = 0, cost = 0;
  const counts = { global: 0, review: 0, kr_only: 0 };

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= posts.length) return;
      const post = posts[idx];
      // Deterministic rule: a post with an embedded (Korean) video is never globally
      // reusable — the video can't be translated. Skip the LLM and mark kr_only.
      if (post.video_url) {
        const rec = {
          id: post.id, slug: post.slug, verdict: 'kr_only', score: 0,
          reason: 'Contains a Korean-language video (video_url); not reusable globally.',
          region_flags: ['kr-video'], target_locales: [], suggested_category: '',
          transcreation_notes: '', model: 'rule:video',
        };
        appendFileSync(OUT_PATH, JSON.stringify(rec) + '\n');
        ok++; counts.kr_only++;
        continue;
      }
      let attempt = 0, result = null, lastErr = null;
      while (attempt < 2 && !result) {
        attempt++;
        try {
          const { text, costUsd } = await callClaude(buildBody(post));
          cost += costUsd || 0;
          const v = extractJson(text);
          if (!['global', 'review', 'kr_only'].includes(v.verdict)) throw new Error(`bad verdict: ${v.verdict}`);
          result = v;
        } catch (e) { lastErr = e; }
      }
      const rec = result
        ? { id: post.id, slug: post.slug, ...result, model: MODEL }
        : { id: post.id, slug: post.slug, verdict: 'error', reason: String(lastErr?.message || lastErr).slice(0, 200), model: MODEL };
      appendFileSync(OUT_PATH, JSON.stringify(rec) + '\n');
      if (result) { ok++; counts[result.verdict]++; } else fail++;
      const n = ok + fail;
      if (n % 10 === 0 || n === posts.length) {
        console.log(`[${n}/${posts.length}] ok=${ok} fail=${fail} | global=${counts.global} review=${counts.review} kr_only=${counts.kr_only} | $${cost.toFixed(2)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\nDONE. ok=${ok} fail=${fail} cost=$${cost.toFixed(2)}`);
  console.log(`counts: global=${counts.global} review=${counts.review} kr_only=${counts.kr_only}`);
  console.log(`results: ${OUT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
