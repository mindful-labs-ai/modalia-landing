import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/constants/site';
import { OG_LOCALE, type Locale } from '@/i18n/routing';
import type { SiblingVersion } from '@/lib/supabase/queries';
import { buildBlogPostAlternates, blogPostUrl } from '@/lib/blog/hreflang';

/**
 * Builds cross-domain hreflang alternates.
 * - en/es/zh-Hant/de → global.mindthos.com/{locale}{path}
 * - ko → mindthos.com{path} (Korean site, reciprocal) — only when `crossDomainKo`
 * - x-default → Korean site when ko is mapped, otherwise the en global page
 *
 * `crossDomainKo` must be false for paths whose Korean equivalent differs or does not
 * exist 1:1 (e.g. /blog/category/{slug} — KR uses ?category= with different slugs).
 *
 * @param path Path after the locale prefix. Empty string for the home page.
 */
export function languageAlternates(path = '', crossDomainKo = true): Record<string, string> {
  const { url, koUrl } = SITE_CONFIG;
  const langs: Record<string, string> = {
    en: `${url}/en${path}`,
    es: `${url}/es${path}`,
    'zh-Hant': `${url}/zh-Hant${path}`,
    de: `${url}/de${path}`,
  };
  if (crossDomainKo) {
    langs.ko = `${koUrl}${path || '/'}`;
    langs['x-default'] = `${koUrl}${path || '/'}`;
  } else {
    langs['x-default'] = langs.en;
  }
  return langs;
}

/**
 * Builds per-locale page metadata. Each locale page is self-canonical
 * (cross-locale canonicals are disallowed); sibling locales are referenced only via alternates.languages.
 */
export function buildPageMetadata(options: {
  locale: Locale;
  title: string;
  description: string;
  /** Path after the locale prefix. Empty string for the home page. */
  path?: string;
  /** Set to true to use an absolute title instead of the "%s | Modalia AI" brand template. */
  absoluteTitle?: boolean;
  image?: string;
  noindex?: boolean;
  /** Emit a cross-domain ko alternate to the Korean site. Default true; false when no 1:1 KR equivalent. */
  crossDomainKo?: boolean;
}): Metadata {
  const path = options.path ?? '';
  const canonical = `${SITE_CONFIG.url}/${options.locale}${path}`;
  const ogImages = [
    {
      url: options.image || '/og-default.png',
      width: 1200,
      height: 630,
      alt: SITE_CONFIG.name,
    },
  ];

  return {
    title: options.absoluteTitle ? { absolute: options.title } : options.title,
    description: options.description,
    alternates: {
      canonical,
      languages: languageAlternates(path, options.crossDomainKo ?? true),
    },
    robots: options.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: options.title,
      description: options.description,
      url: canonical,
      type: 'website',
      siteName: SITE_CONFIG.name,
      locale: OG_LOCALE[options.locale],
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
      images: ogImages.map((i) => i.url),
    },
  };
}

/**
 * Metadata for a single global blog post.
 * Self-canonical always; hreflang alternates come from buildBlogPostAlternates (NULL-branch aware).
 */
export function buildBlogPostMetadata(options: {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  image?: string | null;
  keywords?: string[] | null;
  publishedAt?: string | null;
  updatedAt: string;
  authorName?: string | null;
  siblings: SiblingVersion[];
  koSlug: string | null;
  noindex?: boolean;
}): Metadata {
  const canonical = blogPostUrl(options.locale, options.slug);
  const image = options.image || '/og-default.png';
  const ogImages = [{ url: image, width: 1200, height: 630, alt: options.title }];

  return {
    title: options.title,
    description: options.description,
    keywords: options.keywords?.length ? options.keywords.join(', ') : undefined,
    alternates: {
      canonical,
      languages: buildBlogPostAlternates({
        locale: options.locale,
        slug: options.slug,
        siblings: options.siblings,
        koSlug: options.koSlug,
      }),
    },
    robots: options.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: options.title,
      description: options.description,
      url: canonical,
      type: 'article',
      siteName: SITE_CONFIG.name,
      locale: OG_LOCALE[options.locale],
      publishedTime: options.publishedAt || undefined,
      modifiedTime: options.updatedAt,
      authors: options.authorName ? [options.authorName] : undefined,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
      images: ogImages.map((i) => i.url),
    },
  };
}
