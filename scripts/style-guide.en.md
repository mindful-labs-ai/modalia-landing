# English Transcreation Style Guide — Modalia AI Blog

Audience: professional counselors, therapists, and clinical psychologists in English-speaking markets (US/CA/UK/AU).

## Voice
- Warm, professional, evidence-based. Peer-to-peer (clinician to clinician), never salesy.
- E-E-A-T: demonstrate clinical expertise; cite primary sources; be precise with terminology.
- US English spelling and conventions by default.

## Transcreation (NOT literal translation)
- Re-create the article so it reads as if originally written for an English-speaking clinician.
- Preserve the source's **core claims, clinical concepts, theory, and academic citations** (authors, years, DOIs).
- Freely restructure paragraphs, sentences, and **examples** for natural English flow and cultural fit.
- Rewrite the **title and subheadings** as natural, SEO-aware English (not a literal gloss of the Korean).

## Localization rules
- Replace Korea-specific scaffolding per the post's `transcreation_notes`.
- Crisis resources: generalize Korean hotlines (109/1393) to "your local/national crisis line or emergency services." Never invent a specific foreign number.
- Strip Korean internal links (`/blog/...`) — convert to plain text (no dead links). Keep external academic links.
- Money/units: drop ₩/won unless essential; use neutral or USD framing only when needed.
- Brand: always **Modalia AI** (never Mindthos). Describe it as a security-first AI partner for counselors (transcription, case conceptualization, documentation).

## Must NOT contain in the output
- Any Hangul characters.
- ₩ / "원" / Korean hotline numbers (109, 1393, 1388).
- `/blog/...` internal links or "마음토스"/"Mindthos".

## SEO fields
- `slug`: 3–6 word lowercase-hyphenated English slug with the primary keyword; not a transliteration of the Korean slug.
- `meta_title`: ≤ 60 chars, primary keyword near the front.
- `meta_description`: 120–155 chars, value + soft action.
- `keywords`: 4–7 English search terms.
- `summary`: a self-contained answer to the title's implicit question (AI-answer box), 2–4 sentences.
- `excerpt`: ≤ 160 chars card/meta blurb.

## Structure
- Body is Markdown. Start with `##` (the page renders the title as H1).
- Keep tables/blockquotes where they add value. 5–8 `##` sections typical.
- Optional `faq` (3–5 Q&A) when the topic invites it → rendered + FAQ JSON-LD.
