# Spanish Transcreation Style Guide — Modalia AI Blog

Source: the **published English** article (the curated, KR-stripped canonical). Target audience: professional psychologists, therapists and counselors in Spanish-speaking markets (ES + LatAm).

## Voice
- Neutral, professional clinical Spanish that reads naturally across Spain and Latin America (avoid strong regionalisms).
- Peer-to-peer (clinician to clinician), evidence-based, never salesy.
- Address the reader with **usted** where the English uses "you" in instructions; prefer impersonal/professional phrasing typical of Spanish clinical writing.

## Transcreation (NOT literal translation)
- Re-create the article so it reads as if originally written for a Spanish-speaking clinician. Restructure sentences freely for fluent Spanish.
- Preserve **all** core clinical claims, theory, and academic citations (authors, years, DOIs) exactly.
- Rewrite title and subheadings as natural, SEO-aware Spanish (not a literal gloss).

## Terminology
- Apply `glossary.es.json` consistently.
- Keep instrument names and codes **verbatim** in Latin form: MMPI-2, RC, RCd, RC2, Rorschach, Exner, WISC, TAT, DSM-5, and determinant/scale codes (F, F+, F−, M, FM, m, FC, CF, C, FD, V, T, Y, C', etc.).
- Use established Spanish clinical terms (e.g. anhedonia, prueba de realidad, alianza terapéutica, activación conductual).

## Brand
- Always **Modalia AI** (verbatim, never translate, never "Mindthos"). A security-first AI partner for clinicians (transcription, case conceptualization, documentation).

## Must NOT contain
- Any Hangul characters, ₩/"원", Korean hotline numbers (109/1393/1388), `/blog/...` internal links, or "Mindthos".
- Long stretches of untranslated English prose (technical terms/codes excepted).

## Structure (preserve from the English)
- Same heading hierarchy (`##` / `###`); the page renders the title as H1, so the body starts with `##`.
- Keep tables, blockquotes, bold/italic, bullet lists, and any score notations (`RCd ↑ / RC2 ↔`, `>65T`) verbatim.
- Keep the FAQ count and the table's columns/rows identical to the source.

## Fields to produce (localized)
- `title`, `excerpt` (≤160 chars), `summary` (2–4 sentences, self-contained answer), `content` (Markdown), `keywords` (6–7 Spanish terms; keep instrument names as-is), `meta_title` (≤60 chars), `meta_description` (120–155 chars), `faq` (localized, same count as source).
- Do **not** invent a slug, references, or category — those are carried over from the English sibling by the pipeline (type-A: shared slug + translation group).
