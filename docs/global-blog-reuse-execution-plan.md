# Global Blog — Reuse Track Execution Plan (Steps 1–3)

> Status: Plan (2026-06-08) · Scope: **reuse Korean posts → English → other languages**. No scheduler. Net-new English (step 4) excluded.
> Design reference: [global-blog-automation.md](./global-blog-automation.md) · Pipeline source: `mindthos-landing/scripts/publish-blog`.

## Work order (user-defined)
1. **Select universal posts** — classify region-neutral KR posts.
2. **Write English** — translate ALL universal posts to en (type A), publish.
3. **Expand to other languages** — translate **from the English canonical** into **es, zh-Hant, de**.
4. ~~Net-new English-market posts~~ — later, out of scope here.

Key decision baked in: **step 3 translates from the published English version, not from Korean** — en is the curated, KR-specific-stripped canonical, so es/zh-Hant/de derive from it. Type A is preserved (`source_post_id` = KR original, shared `translation_group_id`); hreflang stays en↔es↔zh-Hant↔de + ko.

---

## Phase 0 — Foundation (one-time, ~0.5 day)

- **Env** (`modalia-landing/.env.local`): add `SUPABASE_SERVICE_ROLE_KEY` (writes bypass RLS). Translation/classification use the **Claude CLI** (already logged in — no API key needed), mirroring KR's `lib/claude-cli.ts`.
- **Copy** `mindthos-landing/scripts/publish-blog/src/lib/claude-cli.ts` → `modalia-landing/scripts/lib/claude-cli.mjs` (spawn `claude -p --output-format json --max-turns 1`).
- **Migration `012_posts_global_eligibility.sql`** — add nullable `posts.global_*` columns + partial index (see automation doc B.1). Apply via Supabase. SEO-safe (never rendered on KR pages).

Exit criteria: env set, claude-cli helper in place, migration applied (verify columns exist).

---

## Step 1 — 범용 글 선정 (classify + human review) · ~1 day

### Build
- `scripts/classify-kr-posts.mjs` — Claude CLI (`claude-sonnet-4-6`). For each KR post (title/excerpt/summary/content/category/keywords):
  - score **global applicability 0–100** + **hard-marker scan** (정신건강복지법/개인정보보호법(KR), 상담심리사 1·2급/수련/수련기관, 위탁·바우처·가족센터/EAP KR forms, 네이버·클로바노트·다글로, 109/1393, ₩/원, KR geography);
  - write `posts.global_*` (verdict `global`≥70&no-marker / `review` 40–69 or soft-marker / `kr_only`), `reason`, `region_flags`, `target_locales`, `suggested_category` (from: case-conceptualization, assessment, clinical-skills, therapist-wellbeing, ethics-practice, professional-development), `transcreation_notes`, `model`, `checked_at`.
  - Flags: `--unscored` (default, idempotent), `--limit=N`, `--reclassify`. Batch ~30–50/run.
- `scripts/list-candidates.mjs --verdict=review|global|kr_only` — export to a markdown table for human review.

### Run
1. `node --env-file=.env.local scripts/classify-kr-posts.mjs --all` (in batches) → fills eligibility for all 988.
2. Human reviews the **`review`** bucket; sets `global_review_override` per row. Spot-check ~10% of `global` and `kr_only`.
3. Finalize the universal set = `COALESCE(global_review_override, global_eligibility) = 'global'`.

Exit criteria: finalized universal set with per-category counts reported (e.g., "X global / Y review / Z kr_only").
Confirm before running: score thresholds (70/40) and the hard-marker list.

---

## Step 2 — 영문 글 작성 (translate ALL universal → en) · iterative, batched

### Build
- `scripts/glossary.json` — brand + clinical term map (ko→en), e.g. 사례개념화→case conceptualization, 축어록→session transcript, 슈퍼비전→supervision, 마음토스→Mindthos.
- `scripts/style-guide.en.md` — tone (warm, professional, E-E-A-T), US spelling, units, date format, transcreation rules (strip KR internal `/blog/` links → plain text; generalize KR crisis numbers → "local crisis resources"; keep academic citations & DOIs).
- `scripts/translate-post.mjs --locale es|zh-Hant|de [--slug <en-slug> | --limit N] [--dry-run] [--force]` — Claude CLI (`claude-opus-4-8`), **transcreate not literal**, transcreates the published English canonical into the target locale, applies the per-locale glossary + style guide. Reuses the English sibling's `slug`, `translation_group_id`, `source_post_id`, category, `references`, and thumbnail. Writes `scripts/content/<slug>.<locale>.json` (`reviewed:false`, stays draft until a human sets `reviewed:true`, then `publish-global-post.mjs` publishes). ✅ **Script exists.**
- `scripts/verify-draft.mjs <file>` — two gates:
  - **localization-leak (deterministic):** fail on Hangul, `₩`/원, `109`/`1393`, `/blog/` internal links, KR brand names left in the draft.
  - **translation-fidelity (AI, opus):** are the source's claims, structure, and citations preserved? → pass / revise / queue (reuse KR `aggregate.ts` decision shape + `review-feedback.json`).
- Extend `publish-global-post.mjs`: when `source_post_id`/source-slug present → auto-fill `source_post_id` + copy KR thumbnail; publish as **type A**.

### Run (per wave of ~10–20 posts)
1. `translate-post.mjs --locale es|zh-Hant|de [--slug <en-slug>]` for each post in the wave.
2. `verify-draft` → auto-revise (claude) up to N on `revise`; `queue` → set aside for human.
3. **Human review** the wave's drafts → set `reviewed:true`.
4. `publish-global-post.mjs <files…>` → type A en posts + revalidate + IndexNow.
5. Repeat waves until the **entire universal set** has published en versions.

Exit criteria: every universal post has a published English version. Progress query: `global_posts WHERE locale='en'` count vs universal set size.
Confirm before running: wave size + whether to cap the first wave (e.g., 20) before scaling to all.

---

## Step 3 — 영문 기반 타 언어 확장 (en → es / zh-Hant / de) · ✅ script built

### Build (mechanism, locale-parameterized)
- `scripts/style-guide.<locale>.md` + glossary entries per target locale — **per-locale assets exist**: `scripts/style-guide.{es,zh-Hant,de}.md` and `scripts/glossary.{es,zh-Hant,de}.json` (en→target term maps). ✅
- `scripts/translate-post.mjs --locale es|zh-Hant|de [--slug <en-slug> | --limit N] [--dry-run] [--force]` — reads the published `global_posts` en row as the source text, transcreates into the target locale, reuses the English sibling's `slug`, `translation_group_id`, `source_post_id` (KR original), category, `references`, and thumbnail. Output: publish-ready staging `scripts/content/<slug>.<locale>.json` (`reviewed:false`; stays draft until a human sets `reviewed:true`, then `publish-global-post.mjs` publishes). ✅ **Script exists.**
- `verify-draft` adapted per locale: localization-leak still flags Hangul / ₩ / KR hotlines / `/blog/` links (the target should contain none); fidelity checked **against the en canonical**.

### Run
1. Target locales: **es, zh-Hant, de** (site already supports them).
2. For each en post: `translate-post.mjs --locale <X> --slug <en-slug>` → `verify-draft` → human review (`reviewed:true`) → `publish-global-post` (type A, locale X).
3. hreflang auto-updates (siblings en↔es↔zh-Hant↔de + ko); sitemap auto-includes.

Exit criteria: es, zh-Hant, de versions published for the universal set.
Status: script built; execute per language (es first, then zh-Hant, then de).

---

## Cross-cutting

- **Quality gate:** `reviewed:true` required to publish (PRD §8) — human-in-the-loop each wave. No machine-translated original goes live unreviewed.
- **Type-A integrity:** same slug across locales · shared `translation_group_id` · `source_post_id` = KR original · KR thumbnail reused.
- **Post-publish:** `publish-global-post.mjs` triggers `/api/revalidate` + IndexNow (set `REVALIDATE_SECRET`, `INDEXNOW_KEY` to enable; otherwise rebuild/redeploy).
- **Reuse from KR repo:** `lib/claude-cli.ts`, the `verifiers/aggregate.ts` decision shape, and (optionally) `scripts/seo-analysis/*` for an en SEO score.
- **Tracking:** `SELECT locale, count(*) FROM global_posts GROUP BY locale;` + `SELECT global_eligibility, count(*) FROM posts GROUP BY 1;`.

## Decisions to confirm before execution
1. **Step-1 thresholds & hard-marker list** — accept 70/40 + the list above?
2. **Step-2 scale** — translate all eligible at once, or cap the first wave (e.g., 20) then scale?
3. **Step-3 source** — confirmed **English canonical** (per "영문 기반"). ✅
4. **Models** — Claude CLI sonnet (classify) / opus (translate)?

## Deliverables checklist (build order)
- [ ] `012_posts_global_eligibility.sql` applied
- [ ] `scripts/lib/claude-cli.mjs`
- [ ] `scripts/classify-kr-posts.mjs` + `scripts/list-candidates.mjs`
- [ ] `scripts/glossary.json` + `scripts/style-guide.en.md`
- [x] `scripts/translate-post.mjs` (supports `--locale es|zh-Hant|de`, `--slug`, `--limit`, `--dry-run`, `--force`)
- [ ] `scripts/verify-draft.mjs`
- [ ] `publish-global-post.mjs` extended (source_post_id + thumbnail copy)
- [ ] `scripts/style-guide.<locale>.md` (step 3, per chosen locale)
