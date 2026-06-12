# Traditional Chinese Transcreation Style Guide — Modalia AI Blog

Source: the **published English** article (the curated, KR-stripped canonical). Target audience: professional psychologists, therapists and counselors in Traditional-Chinese markets (Taiwan register).

## Voice
- Natural, professional 繁體中文 in the Taiwan clinical-psychology register.
- Peer-to-peer (clinician to clinician), evidence-based, never salesy.
- Use **Traditional** characters throughout (never Simplified).

## Transcreation (NOT literal translation)
- Re-create the article so it reads as if originally written for a Chinese-speaking clinician. Restructure freely for fluent Chinese.
- Preserve **all** core clinical claims, theory, and academic citations (authors, years, DOIs) exactly.
- Rewrite title and subheadings as natural, SEO-aware Chinese (not a literal gloss).

## Terminology
- Apply `glossary.zh-Hant.json` consistently (Taiwan conventions).
- Keep instrument names and codes **verbatim** in Latin form: MMPI-2, RC, RCd, RC2, Rorschach, Exner, WISC, TAT, DSM-5, and determinant/scale codes (F, F+, F−, M, FM, m, FC, CF, C, FD, V, T, Y, C', Erlebnistypus, etc.).
- Use established Taiwan clinical terms (e.g. 羅夏克墨漬測驗、艾克斯納綜合系統、失樂感、現實檢驗、治療同盟、行為活化).

## Brand
- Always **Modalia AI** (verbatim, never translate, never "Mindthos"). A security-first AI partner for clinicians (transcription, case conceptualization, documentation).

## Must NOT contain
- Any Hangul characters, ₩/"원", Korean hotline numbers (109/1393/1388), `/blog/...` internal links, or "Mindthos".
- Simplified Chinese characters.

## Structure (preserve from the English)
- Same heading hierarchy (`##` / `###`); the body starts with `##`.
- Keep tables, blockquotes, bold/italic, bullet lists, and score notations (`RCd ↑ / RC2 ↔`, `>65T`) verbatim.
- Keep the FAQ count and the table's columns/rows identical to the source.

## Fields to produce (localized)
- `title`, `excerpt` (≤80 chars), `summary` (2–4 sentences), `content` (Markdown), `keywords` (6–7 terms; keep instrument names as-is), `meta_title` (≤40 chars), `meta_description` (≤80 chars), `faq` (localized, same count as source).
- Do **not** invent a slug, references, or category — carried over from the English sibling (type-A: shared slug + translation group).
