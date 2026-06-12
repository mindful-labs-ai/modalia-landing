import { SITE_CONFIG } from '@/constants/site';
import type { Locale } from '@/i18n/routing';
import type { SiblingVersion } from '@/lib/supabase/queries';

/**
 * hreflang alternates for a global blog post (global-blog-plan §5).
 *
 * Built entirely from read queries on the shared DB — no sync writes, no service key.
 *
 *   1) Sibling languages — every published row in the same translation_group_id
 *      → en↔ja↔es alternates (slugs may differ per locale).
 *   2) Korean source — only when source_post_id resolves to a published KR post (type A)
 *      → ko alternate at mindthos.com/blog/{koSlug}. Type B/C (source_post_id NULL)
 *        produce no ko alternate.
 *   3) x-default — the representative language (en if present in the group, else self).
 *
 * The caller sets `alternates.canonical` to the self URL separately (self-canonical always;
 * cross-locale canonicals are disallowed).
 */
export function buildBlogPostAlternates(input: {
  locale: Locale;
  slug: string;
  siblings: SiblingVersion[];
  koSlug: string | null;
}): Record<string, string> {
  const { url, koUrl } = SITE_CONFIG;
  const languages: Record<string, string> = {};

  // (1) sibling languages — includes self; that is valid and recommended for hreflang.
  for (const sib of input.siblings) {
    languages[sib.locale] = `${url}/${sib.locale}/blog/${sib.slug}`;
  }
  // Ensure self is present even if the siblings query missed it (defensive).
  if (!languages[input.locale]) {
    languages[input.locale] = `${url}/${input.locale}/blog/${input.slug}`;
  }

  // (2) Korean source (type A only).
  if (input.koSlug) {
    languages.ko = `${koUrl}/blog/${input.koSlug}`;
  }

  // (3) x-default → en if the group has it, else the current locale.
  const xDefaultLocale: Locale = languages.en ? 'en' : input.locale;
  languages['x-default'] = languages[xDefaultLocale];

  return languages;
}

/** Self-canonical URL for a global blog post. */
export function blogPostUrl(locale: Locale, slug: string): string {
  return `${SITE_CONFIG.url}/${locale}/blog/${slug}`;
}
