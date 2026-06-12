# Global Blog — Publishing Automation Design

> Status: Proposal v2 (2026-06-08) · Builds on [global-blog-plan.md](../../global-blog-plan.md), [blog-publishing.md](./blog-publishing.md)
> **Reference architecture: the Korean auto-publish pipeline in `/Users/sicei/Documents/GitHub/mindthos-landing`** (NOT the read-only `web/` copy inside this repo — that copy has no scripts).
> Decisions locked: LLM-classify + human-review filtering · eligibility columns on `posts` · English-first translation · on-demand CLI pipeline.

---

## Part A — How the Korean blog actually auto-publishes (as-built)

Source of truth: `mindthos-landing/scripts/publish-blog/` + `scripts/seo-analysis/` + `ecosystem.config.js` + `web/context/` + `docs/fact-master/`.

### A.1 Orchestration — PM2 cron
`ecosystem.config.js` runs two cron apps (TZ Asia/Seoul):
- **`mindthos-daily-blog-publish`** — daily **06:00 KST**, runs `daily-auto-publish.sh --count 5`.
- **`mindthos-weekly-keyword-refresh`** — **Mon 05:00 KST**, refreshes the keyword pool.

### A.2 `daily-auto-publish.sh` (the orchestrator, ~960 lines)
- **Phase 0** — env + `claude` CLI presence + disk + **single-instance lock** checks; Slack alert on abort; sets `AUTO_PUBLISH_STRICT=1`.
- **Phase 1** — `select-daily-topics.ts` → `daily-topics.json`.
- **Phase 2** — for each topic: `claude -p` generates `content.json` (brand/style/fact guides **inlined** into the prompt so Claude needs no tool calls) → `insert-inlinks.ts` → SEO gate (`analyze.py`) → `publish.ts`.
- **Exit-code protocol** from `publish.ts`: `0` ok · `2` thumbnail/STRICT failure → **abort whole batch** · `3` fact error → **fact-fix loop** (re-call Claude with `revisionGuide`, max N iters, then publish anyway) · `4` slug/content duplicate → skip to next topic.

### A.3 Topic selection — `select-daily-topics.ts`
1. Parse `web/context/target-keywords.md` (per-category keyword pool, 8 categories).
2. Enrich scores with `scripts/seo-analysis/opportunity_scorer.py` (DataForSEO volume/competition/opportunity; cached fallback).
3. Dedupe vs existing `posts` (published+draft) keywords/titles via **Jaccard ≥ 0.7**.
4. Fill **quotas** in a strict→relaxed 2-pass: per-category cap, audience 65/15/20 (counselor/institution/general), longtail ≥30%, commercial ≥20%, and **format** (article/listicle/guide) targeted dynamically against the recent-30-day published distribution.

### A.4 Content generation — Claude CLI
`lib/claude-cli.ts` spawns `claude -p "<prompt+body>" --output-format json --max-turns 1 --model claude-sonnet-4-6`. The orchestrator inlines the brand voice, style guide, fact rules, product facts, SEO guidelines, and internal-link map (`web/context/*.md`) so generation is single-turn and deterministic-ish.

### A.5 `publish.ts` — 7 steps
1. **SEO analysis** — `analyze.py` → `seo-report.json` (keyword/readability/meta/structure → grade A–F).
2. **Review** — deterministic **citation gate** (`verifyCitations`, always, no API key needed) **+** AI multi-verify via **Gemini** (`NANOBANANA_API_KEY`): `aeo-structure`, `counselor-content`, `fact-check` (against `docs/fact-master/*.md` master docs). `aggregate.buildReviewFeedback` → **pass** / **revise** (exit 3) / **queue** (`status='draft'` + `auto_review_queue=true`). Stored in `posts.ai_review` JSONB.
3. **Outlink validation** — GET each reference, 3xx-follow, main-domain fallback, drop dead links.
4. **Thumbnail** — Gemini image (`gemini-3.x-flash-image`) with a strict brand-style, **text-free** prompt → `sharp` → WebP 1200w → Supabase Storage `blog-images/thumbnails/{slug}.webp`. STRICT: failure → exit 2.
5. **CTA matching** — score `content.keywords` vs `counseling_programs.match_keywords`; STRICT forces the default free-trial CTA.
6. **DB insert** — KST timestamp, `schema_markup` (FAQPage), `reading_time`, `format`, `ai_review`, `review_iterations`, `fact_check_topics`.
7. **revalidate + IndexNow** — `/api/revalidate` (`REVALIDATION_SECRET`) + IndexNow (`INDEXNOW_KEY`).

### A.6 Supporting assets
- **SEO stack** (`scripts/seo-analysis/`, Python): DataForSEO, GSC, GA4, keyword_research, opportunity_scorer, readability_scorer, seo_scorer, post_publish_analyzer.
- **Content guides** (`web/context/`): `brand-voice.md`, `style-guide.md`, `fact-check-protocol.md`, `mindthos-product-facts.md`, `seo-guidelines.md`, `internal-links-map.md`, `target-keywords.md`.
- **Fact masters** (`docs/fact-master/*.md`): topic-keyed source-of-truth the fact-check verifier consults.
- **Manual path**: `.claude/commands/publish-blog.md` — a slash command that runs validate→analyze→inlinks→publish interactively from a hand-written `content.json`.
- **Content input schema** (`content.json`): `{ categorySlug, targetAudience, authorSlug, status, skipImage, content: { format, title, slug, thumbnail_url, content, excerpt, summary, keywords, meta_title, meta_description, cta_type, faq[], references[], visual_keywords[] } }`.
- **One-time migration** (`scripts/migrate-blog/`): Baserow (table 763048) → turndown HTML→MD + Claude CLI metadata enrichment → Supabase upsert.

---

## Part B — Global pipeline (mirrors A, adds two tracks)

The global blog has **two content tracks**. We reuse the KR pipeline's shape (cron-able orchestrator → topic/candidate stage → Claude generation → verify → publish.ts-style step) and the existing `modalia-landing/scripts/publish-global-post.mjs` as the final publish stage.

| Track | KR analog | Global stage |
|---|---|---|
| **Reuse** (region-neutral KR post → translate, **type A**) | select-daily-topics → claude generate | **classify** KR posts → **translate** (transcreate) |
| **Net-new EN** (NA/AU/CA original, **type B**) | select-daily-topics → claude generate | **select-en-topics** → **draft-en** |

```
                 ┌── Track 1 (Reuse) ──────────────────────────────────────────┐
KR posts ─[classify]→ posts.global_* ─[human review]→ approved ─[translate en]→ staging JSON (reviewed:false)
                 └─────────────────────────────────────────────────────────────┘
                 ┌── Track 2 (Net-new EN) ─────────────────────────────────────┐
target-keywords-en ─[select-en-topics]→ topics ─[draft-en]→ staging JSON (reviewed:false)
                 └─────────────────────────────────────────────────────────────┘
                                          │
                       [human review → reviewed:true]
                                          ▼
                 [verify gate] → publish-global-post.mjs → global_posts + revalidate + IndexNow
```

### B.1 Eligibility marking — columns on `posts` (additive, SEO-safe)

Decided as the optimal place: nullable operational-metadata columns, **never rendered on KR public pages, never in the KR sitemap → zero SEO impact**; existing KR `select('*')` ignores them at runtime.

`web/supabase/migrations/012_posts_global_eligibility.sql`:
```sql
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS global_eligibility text
    CHECK (global_eligibility IN ('pending','global','review','kr_only')),
  ADD COLUMN IF NOT EXISTS global_eligibility_score integer,        -- 0..100
  ADD COLUMN IF NOT EXISTS global_eligibility_reason text,
  ADD COLUMN IF NOT EXISTS global_region_flags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS global_target_locales text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS global_suggested_category text,          -- global_categories.slug
  ADD COLUMN IF NOT EXISTS global_transcreation_notes text,
  ADD COLUMN IF NOT EXISTS global_eligibility_model text,
  ADD COLUMN IF NOT EXISTS global_eligibility_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS global_review_override text;             -- human verdict wins
CREATE INDEX IF NOT EXISTS idx_posts_global_eligibility
  ON posts(global_eligibility) WHERE global_eligibility IS NOT NULL;
```
**Effective verdict** = `COALESCE(global_review_override, global_eligibility)`. Translation *progress* stays derivable from `global_posts` (`source_post_id` + `locale`), not duplicated here.

### B.2 classify — the Track-1 analog of `select-daily-topics`

`scripts/classify-kr-posts.mjs` (Claude CLI, `claude-sonnet-4-6`, mirrors `lib/claude-cli.ts`):
- Input: KR post (title, excerpt, summary, content, category, keywords).
- **Region-neutrality rubric** (global applicability 0–100) **+ hard-marker scan**.
  - **Reusable (high):** universal clinical theory/skills — CBT/ACT/DBT, attachment, case conceptualization, the therapeutic alliance, intrusive thoughts, grief, burnout, supervision concepts, intl-literature evidence.
  - **Korea-specific hard markers (cap to `review`/`kr_only`):** 정신건강복지법/개인정보보호법(KR), 상담심리사 1·2급/임상심리사 수련/수련기관, 위탁계약/바우처/가족센터·EAP KR forms, 네이버·클로바노트·다글로, 109/1393, ₩/원 pricing, KR geography.
- Output (structured JSON → `posts.global_*`):
```jsonc
{ "score":86, "verdict":"global", "reason":"...",
  "region_flags":["crisis_line:109"], "target_locales":["en","es","zh-Hant","de"],
  "suggested_category":"case-conceptualization",
  "transcreation_notes":"Generalize 109; strip /blog internal links." }
```
- Verdict mapping: `global` (≥70, no hard markers) · `review` (40–69, or ≥70 w/ soft KR examples needing transcreation) · `kr_only` (<40 or structural hard marker).
- `suggested_category` is emitted from the six global categories: **case-conceptualization, assessment, clinical-skills, therapist-wellbeing, ethics-practice, professional-development**. `transcreate-post.mjs` maps any legacy value (e.g. `insights`, `technology`, `guides`, `case-studies`) to the best-fit new slug.
- Flags: `--unscored` (default), `--all`, `--since=DATE`, `--limit=N`, `--reclassify`.

`scripts/list-candidates.mjs --verdict=review` exports buckets to markdown/CSV; reviewer sets `global_review_override`. Only **effective=global** proceeds.

### B.3 translate — the Track-1 analog of content generation

`scripts/translate-post.mjs --locale es|zh-Hant|de [--slug <en-slug> | --limit N] [--dry-run] [--force]` (Claude CLI, `claude-opus-4-8`) — transcreates the published English canonical into the target locale:
- **Transcreate, not literal**: preserve structure/headings/tables/blockquotes and **academic citations**; strip KR internal `/blog/...` links to plain text (or map if a global equivalent exists); apply `transcreation_notes`; apply glossary + per-locale style guide.
- Writes `scripts/content/<slug>.<locale>.json` (`reviewed:false`, `source_post_id` + shared `translation_group_id` pre-filled, **thumbnail copied from KR source**).

### B.4 select-en-topics + draft-en — Track 2 (NA/AU/CA)

- `scripts/select-en-topics.mjs` — port of `select-daily-topics.ts`: pool from `scripts/target-keywords-en.md`, score via the Python `opportunity_scorer` (DataForSEO **en markets**), dedupe vs existing en `global_posts`, quota by market/intent/format.
- `scripts/draft-en-post.mjs --topic "…" --market us|au|ca` (Claude CLI opus): market framing — **US** HIPAA/insurance & CPT/PSYPACT · **AU** Medicare Better Access/AHPRA · **CA** provincial colleges (CRPO)/PHIPA. Produces a **type B** staging JSON (`source_post_id=NULL`, locale en). Later promotable to type C (translate to es/zh-Hant/de under one group).

### B.5 verify gate — ported from `publish.ts` step 2, adapted

Run before publish (deterministic first, AI optional):
- **citation gate** — port `verifyCitations` (deterministic; statistical claims need inline sources). Free, always on.
- **localization-leak check (NEW, deterministic)** — fail if a draft still contains KR-only leftovers: Hangul (in en/es), `₩`/원, KR hotlines (109/1393), `/blog/` internal links, KR brand names. Catches bad transcreation cheaply.
- **translation-fidelity check (Track 1, AI)** — does the translation faithfully preserve the source's claims & citations? (replaces KR's fact-check-from-master for translations).
- **fact-check (Track 2, AI)** — net-new EN checked against EN fact-master docs (to be authored per market).
- Aggregate → pass / revise(exit 3) / queue(draft). Reuse `aggregate.ts` thresholds + `review-feedback.json` shape + the orchestrator's fact-fix loop.

### B.6 publish — reuse existing `publish-global-post.mjs`, extend

Already does UPSERT(locale,slug) + `reviewed` gate + revalidate + IndexNow. Extend:
- when a source slug is given → auto-fill `source_post_id` + copy KR thumbnail (Track 1 = type A);
- optional Gemini thumbnail generation (reuse KR's brand-style prompt) for **net-new EN** (translations reuse the KR thumbnail);
- write `ai_review` equivalent + `reading_time` (locale-aware: zh-Hant chars/500, latin words/200 for en/es/de).

### B.7 Orchestration & assets

- **Now: on-demand CLI** (decided). Each stage is an `npm` script run with `node --env-file=.env.local`. A thin `daily-global-publish.sh` can chain classify→translate→verify→publish per batch, mirroring KR's phases + exit codes + lock + Slack — **promotable to PM2 cron later** (same `ecosystem.config.js` pattern) once trust is established.
- **Shared assets to add** under `modalia-landing/scripts/`: `glossary.json` (brand+clinical terms per locale), `style-guide.<locale>.md`, `target-keywords-en.md`, and (for net-new fact-check) `fact-master-en/*.md`. Per-locale assets now exist: `scripts/style-guide.{es,zh-Hant,de}.md` and `scripts/glossary.{es,zh-Hant,de}.json` (en→target term maps).
- **LLM**: Anthropic **Claude CLI** (`claude -p … --output-format json`), mirroring KR — classify `claude-sonnet-4-6`, translate/draft `claude-opus-4-8`. Image gen reuses Gemini (`NANOBANANA_API_KEY`) for net-new EN only.
- **Env** (`modalia-landing/.env.local`, server-only): `ANTHROPIC` via the `claude` CLI login (no key needed) or `ANTHROPIC_API_KEY`; existing `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`, `INDEXNOW_KEY`; optional `NANOBANANA_API_KEY`.

---

## Part C — Reuse vs build (so we don't reinvent)

| KR component | Global plan |
|---|---|
| `ecosystem.config.js` (PM2 cron) | reuse pattern later; start on-demand |
| `daily-auto-publish.sh` (phases, lock, Slack, exit codes, fact-fix loop) | **port** → `daily-global-publish.sh` |
| `select-daily-topics.ts` | **port** for Track 2 (`select-en-topics`); Track 1 uses `classify` instead |
| `lib/claude-cli.ts` | **reuse as-is** (copy) |
| `verifiers/` (citation/aeo/counselor/fact + aggregate) | **port**; add localization-leak + translation-fidelity verifiers |
| `scripts/seo-analysis/*` (Python) | **reuse** (locale-aware readability needed for en) |
| `publish.ts` | already have `publish-global-post.mjs`; **extend** (source_post_id, thumbnail copy, optional image gen) |
| `web/context/*` guides, `docs/fact-master/*` | author **en/locale** equivalents (glossary, style guide, target-keywords-en, fact-master-en) |
| `migrate-blog/` | not needed (we read `posts` directly, not Baserow) |

---

## Part D — Rollout

1. Migration `012_posts_global_eligibility.sql`.
2. Copy `lib/claude-cli.ts`; write `classify-kr-posts.mjs`; classify all 988 posts (sonnet) → eligibility.
3. `list-candidates.mjs` → human approves first ~10–20 `global` clinical posts.
4. `translate-post.mjs --locale es|zh-Hant|de [--slug <en-slug>]` → localization-leak + fidelity verify → human review → `publish-global-post` (type A). (We already shipped 2 such posts by hand — this automates that exact flow.)
5. Parallel: author `target-keywords-en.md` + `fact-master-en/` → `select-en-topics` + `draft-en-post` (US first) → verify → publish (type B).
6. Stabilize en → expand reuse to es/zh-Hant/de; promote strong net-new EN to type C; consider PM2 cron.

## Part E — Open items / defaults

- **DB marking** → columns on `posts` (chosen as optimal; SEO-safe).
- **LLM** → Claude CLI (sonnet classify / opus translate); Gemini for net-new images. Swap if preferred.
- **Net-new market priority** → US → AU → CA; needs seed `target-keywords-en.md` + `fact-master-en/`.
- **Author** → brand byline `Mindthos` (DEFAULT_AUTHOR); add a real global author row later if desired.
- **Cron** → start on-demand; promote to PM2 once the batch is trusted (KR uses 5/day at 06:00 KST).
