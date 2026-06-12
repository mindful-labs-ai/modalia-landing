# Global Blog — Publishing Guide

Single source of truth for publishing posts to `modalia.ai/{locale}/blog/*`.
Design rationale lives in `../../global-blog-plan.md`.

## Data model (recap)

- **Same Supabase project** as the Korean site (`ulrxefpxlsbpjgvpxxor`). Korean `posts` is untouched.
- Global posts live in **`global_posts`** (+ `global_categories`, `global_post_tags`). Migration: `web/supabase/migrations/011_global_blog.sql`.
- Three post types coexist (plan §2):
  - **A — translation**: `source_post_id` = the Korean post id (emits a `ko` hreflang).
  - **B — global-independent**: `source_post_id = NULL` (no `ko` hreflang).
  - **C — global-first, multilingual**: `source_post_id = NULL`, siblings share one `translation_group_id`.

## Authoring a post

Create a staging JSON file (see `scripts/content/example-en.json`). Fields:

| field | required | notes |
|---|---|---|
| `locale` | ✅ | `en` \| `es` \| `zh-Hant` \| `de` |
| `slug` | ✅ | unique per locale; for type A use the Korean slug when possible |
| `title`, `content` | ✅ | `content` is Markdown (GFM) |
| `reviewed` | — | **must be `true` to publish** — otherwise forced to `draft` (quality gate, plan §6.3) |
| `translation_group_id` | — | omit for a new post; reuse the same value to link sibling languages |
| `source_post_id` | — | Korean `posts.id` for type A; `null` otherwise |
| `category_slug` | — | resolved to `category_id` per locale via `global_categories` |
| `excerpt`, `summary`, `keywords`, `thumbnail_url`, `og_image_url`, `meta_title`, `meta_description`, `schema_markup`, `references`, `cta_type`, `is_featured`, `published_at` | — | optional |

`summary` powers the AI-answer box and should answer the title's question on its own.
`schema_markup` may carry an FAQPage (`mainEntity[]`) — it is rendered as an FAQ section **and** injected as `FAQPage` JSON-LD.

### Linking sibling languages (type C)

Give every language version the **same** `translation_group_id`. hreflang `en↔es↔zh-Hant↔de`
alternates are generated automatically from the group. Example: `scripts/content/example-{en,es,zh-Hant,de}.json`.

### Quality gates (plan §6.3, §8)

- ❌ Never publish raw machine translation — human review required (`reviewed: true` is the switch).
- Unfinished languages stay `draft` (no half-translated pages get indexed).
- Keep brand/term glossary consistent across languages.

## Publishing

```bash
# Validate only (reads category mapping; no writes; safe without the service key)
node --env-file=.env.local scripts/publish-global-post.mjs --dry-run scripts/content/example-en.json

# Publish (UPSERT on locale+slug, then revalidate + IndexNow)
node --env-file=.env.local scripts/publish-global-post.mjs \
  scripts/content/example-en.json scripts/content/example-es.json scripts/content/example-zh-Hant.json scripts/content/example-de.json
```

Required env for writes (server-only — never `NEXT_PUBLIC`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS for the upsert
- `NEXT_PUBLIC_SITE_URL` + `REVALIDATE_SECRET` — enable post-publish revalidate/IndexNow (optional)
- `INDEXNOW_KEY` — for IndexNow (also host `/<key>.txt` at the site root)

The script:
1. Validates required fields and locale.
2. Resolves `category_slug` → `category_id` for the locale.
3. Reuses an existing `translation_group_id` for the same `source_post_id`, else generates one.
4. Enforces the `reviewed` gate (drafts otherwise).
5. UPSERTs into `global_posts` (conflict: `locale,slug`).
6. POSTs affected paths to `/api/revalidate` and post URLs to `/api/indexnow`.

## After publish

- ISR: pages revalidate every hour automatically; the pipeline also triggers on-demand revalidation of `/{locale}/blog`, the post path, and `/sitemap.xml`.
- Verify the post at `https://modalia.ai/{locale}/blog/{slug}`.
- Verify hreflang: view source → `<link rel="alternate" hreflang=...>` should list every published sibling language (+ `ko` only for type A).
- `sitemap.xml` includes the post with per-URL `alternates`.

## Manual alternative (Supabase Studio)

You can also insert/update rows directly in `global_posts` via Supabase Studio, then call
`/api/revalidate` manually. The script is preferred because it enforces the review gate and
category resolution.

## Korean-site reciprocity (follow-up)

For type A posts, the Korean site should emit a reciprocal `ko`→global hreflang. This is an
additive read on `global_posts` (`WHERE source_post_id = $koPostId AND status='published'`)
in the `web/` app's blog detail page (plan §5.2, §9). Not yet implemented — no type A posts
exist today, so there is no live reciprocity gap.
