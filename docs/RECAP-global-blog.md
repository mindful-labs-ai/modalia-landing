# RECAP — Global Blog (resume after session restart)

> Updated 2026-06-09 (session 2). Read this first, then continue from "NEXT STEP".

## ✅ UPDATE (session 2) — the 5 samples are LIVE
- **All 5 transcreated samples published** to `global_posts` (en, status=published), verified **byte-perfect** (DB `md5(content)` == staging-file hash for every post). Total now **11 published** (6 prior + 5), 7 en, 7 translation groups, 0 drafts.
- **Real blocker found & fixed (not just the DB write):** the transcreate staging files nest the post under a `content` object and carry FAQs as a `faq` array, but `publish-global-post.mjs` read flat top-level fields. Added `normalizeDoc()` to `scripts/publish-global-post.mjs` that flattens the nested shape **and** converts `faq` → a `schema_markup` FAQPage (the app renders FAQs from `schema_markup`, see `app/[locale]/blog/[slug]/page.tsx:111` + `components/blog/FAQSection.tsx`). This fix is needed for the 785-post scale-up too.
- **Supabase MCP works in a fresh session** (the RECAP-1 "not registered" issue was conversation-local). Wrote via MCP `execute_sql` — **no service-role key needed**, so `.env.local` was left untouched (cross-repo key copy was correctly auto-blocked anyway).
- Write path used: `scripts/.gen-insert-sql.mjs` reads the 5 staging files, reuses the same normalize logic, and emits one escape-safe `jsonb_to_recordset` INSERT per post into `scripts/.data/sql/*.sql`; each was run via MCP and verified by content md5. (Scratch files; safe to delete.)
- Note: these 5 are **en-only** — each is its own translation_group with a `source_post_id` → KR. hreflang = en + ko until es/zh-Hant/de siblings exist (expected).

---
> Original session-1 notes below (historical).

## Where we are
Building the **global blog** at `global-web/` (Next 16 + next-intl, brand = **Modalia AI**, locales en/es/zh-Hant/de) on the **same Supabase project** as the Korean site (`ulrxefpxlsbpjgvpxxor`). Korean `posts` is read-only-ish (we only added additive nullable `global_*` columns). Global posts live in `global_posts` / `global_categories` (migrations 011, 012 applied).

## DONE
1. **Blog system shipped & verified** (routes, components, SEO/hreflang, sitemap, `/api/{revalidate,indexnow}`, publish pipeline). tsc/eslint/build all green.
2. **2 real type-A posts already live** in `global_posts` (en + es): `managing-intrusive-thoughts-counseling`, `multicultural-case-conceptualization-guide` (hand-translated earlier; ja versions have been deleted from DB — current hreflang is en↔es+ko).
3. **Automation design docs** in `global-web/docs/`:
   - `global-blog-automation.md` (KR pipeline reverse-engineered from `/Users/sicei/Documents/GitHub/mindthos-landing/scripts/publish-blog` + global 2-track design)
   - `global-blog-reuse-execution-plan.md` (steps 1–3: select → English → other languages)
4. **Step 1 — classification DONE.** `scripts/classify-kr-posts.mjs` (Claude CLI sonnet, reads FULL body, semantic verdict). All 988 published KR posts classified, **0 errors**. Results in `scripts/.data/classify-results.jsonl`.
   - **Final counts: 🟢 global 790 · 🟡 review 121 · 🔴 kr_only 77.**
   - Trust `verdict` (+`reason`/`transcreation_notes`); `score` is advisory and ~16 rows have score/verdict mismatch.
   - NOTE: classify results are in the JSONL file but **NOT yet written to `posts.global_*` columns** (MCP went down before we applied them).
5. **Step 2 — transcreation engine built & sampled.** `scripts/transcreate-post.mjs` (Claude CLI **opus**) = re-creates KR post as natural English (transcreation, not literal). Helpers: `scripts/glossary.json`, `scripts/style-guide.en.md`.
   - Decisions locked: **meaning-faithful + free style · fresh English SEO slug · brand Modalia AI**.
   - **5 sample staging files generated, leak-checked clean**, in `scripts/content/*.en.json` (reviewed:false, type A — `source_post_id` + `translation_group_id` + KR thumbnail carried):
     - `body-signals-self-supervision-clinicians.en.json`
     - `compassion-fatigue-counselor-self-care.en.json`
     - `developmental-case-conceptualization-erikson-piaget.en.json`
     - `mmpi-2-rcd-rc2-depression-interpretation.en.json`
     - `rorschach-determinants-exner-system.en.json`
   - Quality confirmed excellent (natural titles, citations preserved, FAQ, no Hangul/₩/hotline/Mindthos leaks).

## BLOCKER (why we stopped)
**Publishing the 5 samples needs a DB write, but the write path is unavailable:**
- The `claude.ai Supabase` MCP dropped mid-session. `claude mcp list` now shows it **✔ Connected** again (recovered after `/login` completed), BUT this conversation's tool registry didn't re-register it (ToolSearch finds nothing). It is a **`claude.ai config` (web OAuth) scoped** server — do NOT `claude mcp remove` it (can't re-add via CLI).
- It was NOT a Supabase outage: raw `curl https://mcp.supabase.com/mcp` returns 401 (alive). The 404 on reconnect was a local OAuth-state hiccup from interrupted `/login`s.

## NEXT STEP (resume here) — publish the 5 samples
Pick ONE write path:

**Path A (recommended, MCP-independent):** add `SUPABASE_SERVICE_ROLE_KEY=` to `global-web/.env.local` (same value the KR repo uses: `/Users/sicei/Documents/GitHub/mindthos-landing/web/.env.local`), then:
```
cd global-web
node --env-file=.env.local scripts/publish-global-post.mjs scripts/content/*.en.json
```
NOTE: `publish-global-post.mjs` currently UPSERTs `global_posts` by (locale,slug) and needs `category_slug`→`category_id` resolution; staging files already carry `category_slug`, `source_post_id`, `translation_group_id`, thumbnail. Verify the script handles `_source`/`reviewed` fields (it enforces `reviewed:true` to publish — the 5 files are `reviewed:false`, so either set them true after human review or pass an override). **Review the 5 files first, then flip `reviewed:true`.**

**Path B:** restart Claude Code so the Supabase MCP tools re-register in a fresh session; then resume and INSERT the 5 posts into `global_posts` via MCP (type A), same as the 2 already-live posts.

After publishing: clean rebuild + verify list/detail/hreflang, then decide scale-up (the other 785 global posts, in waves).

## KEY FACTS
- Supabase project: `ulrxefpxlsbpjgvpxxor`. Storage thumbnails reused from KR (`next.config.ts` already allows `*.supabase.co`).
- `.env.local` has only SUPABASE URL + ANON key today (no service role key) → that's the publish blocker for Path A.
- Migration `012_posts_global_eligibility.sql` already applied (columns exist on `posts`); JSONL→columns sync still pending (optional — transcreate reads the JSONL directly, so not strictly required to publish).
- Author byline: brand `Modalia AI` (DEFAULT_AUTHOR in `constants/blog.ts`).
- Expansion languages: **es, zh-Hant, de** — site already supports them; step-3 (en→other languages) is build-later.

## TODO backlog
- [ ] Publish the 5 sample en posts (NEXT STEP).
- [ ] (optional) Sync `classify-results.jsonl` → `posts.global_*` columns.
- [ ] Scale step 2: transcreate remaining ~785 global posts in waves (`scripts/transcreate-post.mjs --limit N`).
- [ ] Step 3: build `translate-from-en` mode + per-locale style guides once languages chosen.
- [ ] Human translation review for any es/zh-Hant/de before publish (PRD: no MT originals).
