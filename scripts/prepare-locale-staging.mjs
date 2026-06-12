#!/usr/bin/env node
/**
 * prepare-locale-staging.mjs — wrap the per-locale transcreation files produced for
 * the es/zh-Hant/de versions of two type-A assessment posts into the nested staging
 * shape that publish-global-post.mjs consumes (it synthesizes schema_markup from `faq`).
 *
 * Bakes in the shared type-A metadata (same translation_group_id + source_post_id as the
 * English sibling, shared slug, same thumbnail, language-neutral academic references).
 *
 * Input : scripts/content/<base>.<locale>.json   (flat: title/content/faq/...)
 * Output: scripts/content/<base>.<locale>.ready.json  (nested, reviewed:true)
 *
 * Usage: node scripts/prepare-locale-staging.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, 'content');
const LOCALES = ['es', 'zh-Hant', 'de'];

// Shared type-A metadata, keyed by the canonical (English) slug.
const POSTS = {
  'rorschach-determinants-exner-system': {
    source_post_id: '2c5c618b-43ec-4a95-a0ce-9759e87c2ed8',
    translation_group_id: 'fca79f84-497b-4a6b-ba37-967bd20c8f34',
    thumbnail_url:
      'https://ulrxefpxlsbpjgvpxxor.supabase.co/storage/v1/object/public/blog-images/rorschach-test-interpretation-determinants-guide.webp',
    references: [
      {
        url: 'https://www.worldcat.org/title/rorschach-a-comprehensive-system/oclc/50630802',
        name: 'Exner, J. E. (2003). The Rorschach: A Comprehensive System, Volume 1: Basic Foundations and Principles of Interpretation (4th ed.). Wiley.',
        type: 'academic',
      },
    ],
  },
  'mmpi-2-rcd-rc2-depression-interpretation': {
    source_post_id: '6e708656-12d7-40df-ac54-2c67b44962f3',
    translation_group_id: 'a330b2fa-930b-4c09-ae62-eba8d40279b5',
    thumbnail_url:
      'https://ulrxefpxlsbpjgvpxxor.supabase.co/storage/v1/object/public/blog-images/distinguishing-real-pain-mmpi-2-rc-scales.webp',
    references: [
      {
        url: 'https://www.upress.umn.edu/test-division/mmpi-2-rc',
        name: 'Tellegen, A., Ben-Porath, Y. S., McNulty, J. L., Arbisi, P. A., Graham, J. R., & Kaemmer, B. (2003). MMPI-2 Restructured Clinical (RC) Scales: Development, validation, and interpretation. University of Minnesota Press.',
        type: 'academic',
      },
    ],
  },
};

function readingTime(md, locale) {
  if (locale === 'zh-Hant') return Math.max(1, Math.ceil(md.length / 500));
  return Math.max(1, Math.ceil(md.trim().split(/\s+/).filter(Boolean).length / 200));
}

let made = 0;
for (const [base, meta] of Object.entries(POSTS)) {
  for (const locale of LOCALES) {
    const inFile = resolve(DIR, `${base}.${locale}.json`);
    if (!existsSync(inFile)) {
      console.warn(`✗ missing ${base}.${locale}.json`);
      continue;
    }
    const d = JSON.parse(readFileSync(inFile, 'utf8'));
    if (d.slug !== base) throw new Error(`${inFile}: slug "${d.slug}" != "${base}"`);
    if (d.locale !== locale) throw new Error(`${inFile}: locale "${d.locale}" != "${locale}"`);

    const staging = {
      locale,
      source_post_id: meta.source_post_id,
      translation_group_id: meta.translation_group_id,
      category_slug: 'assessment',
      reviewed: true,
      status: 'published',
      content: {
        title: d.title,
        slug: base,
        excerpt: d.excerpt,
        summary: d.summary,
        content: d.content,
        keywords: d.keywords,
        meta_title: d.meta_title,
        meta_description: d.meta_description,
        faq: Array.isArray(d.faq) ? d.faq : [],
        references: meta.references,
        thumbnail_url: meta.thumbnail_url,
        og_image_url: meta.thumbnail_url,
        reading_time: readingTime(d.content, locale),
      },
    };
    const outFile = resolve(DIR, `${base}.${locale}.ready.json`);
    writeFileSync(outFile, JSON.stringify(staging, null, 2));
    made++;
    console.log(`✓ ${base}.${locale}.ready.json  (faq ${staging.content.faq.length}, ${staging.content.reading_time}min)`);
  }
}
console.log(`\nWrote ${made} staging file(s).`);
