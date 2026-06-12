# German Transcreation Style Guide — Modalia AI Blog

Source: the **published English** article (the curated, KR-stripped canonical). Target audience: professional psychologists, therapists and counselors in German-speaking markets (DE/AT/CH).

## Voice
- Natural, professional clinical German.
- Peer-to-peer (clinician to clinician), evidence-based, never salesy.
- Prefer impersonal/professional phrasing over direct "du"; where direct address is needed, use the formal **Sie**. Use gender-inclusive forms typical of German clinical writing (e.g. "Klientinnen und Klienten", "Behandelnde") where natural.

## Transcreation (NOT literal translation)
- Re-create the article so it reads as if originally written for a German-speaking clinician. Restructure freely for fluent German.
- Preserve **all** core clinical claims, theory, and academic citations (authors, years, DOIs) exactly.
- Rewrite title and subheadings as natural, SEO-aware German (not a literal gloss).

## Terminology
- Apply `glossary.de.json` consistently.
- Keep instrument names and codes **verbatim** in Latin form: MMPI-2, RC, RCd, RC2, Rorschach, Exner, WISC, TAT, DSM-5, and determinant/scale codes (F, F+, F−, M, FM, m, FC, CF, C, FD, V, T, Y, C', Erlebnistypus, etc.).
- Use established German clinical terms (e.g. Anhedonie, Realitätsprüfung, therapeutische Allianz, Verhaltensaktivierung, Comprehensive System nach Exner).

## Brand
- Always **Modalia AI** (verbatim, never translate, never "Mindthos"). A security-first AI partner for clinicians (transcription, case conceptualization, documentation).

## Must NOT contain
- Any Hangul characters, ₩/"원", Korean hotline numbers (109/1393/1388), `/blog/...` internal links, or "Mindthos".
- Long stretches of untranslated English prose (technical terms/codes excepted).

## Structure (preserve from the English)
- Same heading hierarchy (`##` / `###`); the body starts with `##`.
- Keep tables, blockquotes, bold/italic, bullet lists, and score notations (`RCd ↑ / RC2 ↔`, `>65T`) verbatim.
- Keep the FAQ count and the table's columns/rows identical to the source.

## Fields to produce (localized)
- `title`, `excerpt` (≤170 chars), `summary` (3–5 sentences), `content` (Markdown), `keywords` (6–7 German terms; keep instrument names as-is), `meta_title` (≤60 chars), `meta_description` (120–160 chars), `faq` (localized, same count as source).
- Do **not** invent a slug, references, or category — carried over from the English sibling (type-A: shared slug + translation group).
