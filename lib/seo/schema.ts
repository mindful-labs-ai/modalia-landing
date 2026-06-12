import { SITE_CONFIG } from '@/constants/site';
import { HTML_LANG, type Locale } from '@/i18n/routing';

/**
 * Global JSON-LD schemas. Every schema reflects the current locale in `inLanguage`.
 * Content strings (descriptions, feature lists) are passed in from messages — no hardcoding.
 * The Organization @id is based on the global origin, separate from the Korean site.
 */

function orgId(): string {
  return `${SITE_CONFIG.url}/#organization`;
}

export function generateOrganizationSchema(locale: Locale, description: string) {
  const sameAs = [
    SITE_CONFIG.legalUrl,
    SITE_CONFIG.social?.instagram,
    SITE_CONFIG.social?.threads,
    SITE_CONFIG.social?.linkedin,
    SITE_CONFIG.social?.twitter,
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId(),
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    url: SITE_CONFIG.url,
    description,
    inLanguage: HTML_LANG[locale],
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.url}/og-default.png`,
      width: 1200,
      height: 630,
    },
    address: {
      '@type': 'PostalAddress',
      ...SITE_CONFIG.address,
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(SITE_CONFIG.email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: SITE_CONFIG.email,
            availableLanguage: ['English', 'Spanish', 'Chinese', 'German', 'Korean'],
          },
        }
      : {}),
  };
}

export function generateWebSiteSchema(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.url}/#website`,
    url: `${SITE_CONFIG.url}/${locale}`,
    name: SITE_CONFIG.name,
    description,
    inLanguage: HTML_LANG[locale],
    publisher: { '@type': 'Organization', '@id': orgId() },
  };
}

export function generateSoftwareApplicationSchema(
  locale: Locale,
  opts: { description: string; featureList: string[] },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_CONFIG.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, All modern browsers',
    description: opts.description,
    inLanguage: HTML_LANG[locale],
    url: `${SITE_CONFIG.url}/${locale}`,
    screenshot: `${SITE_CONFIG.url}/og-default.png`,
    softwareVersion: '1.0',
    provider: {
      '@type': 'Organization',
      '@id': orgId(),
      name: `${SITE_CONFIG.legalName}`,
      url: SITE_CONFIG.url,
    },
    featureList: opts.featureList,
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

// ============================================================
// Blog schemas (global-blog-plan §7) — locale-aware, self-canonical
// ============================================================

/** Blog listing schema for /{locale}/blog. */
export function generateBlogSchema(
  locale: Locale,
  opts: { name: string; description: string },
) {
  const blogUrl = `${SITE_CONFIG.url}/${locale}/blog`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${blogUrl}/#blog`,
    url: blogUrl,
    name: opts.name,
    description: opts.description,
    inLanguage: HTML_LANG[locale],
    publisher: { '@type': 'Organization', '@id': orgId() },
  };
}

export function generateArticleSchema(
  locale: Locale,
  post: {
    title: string;
    excerpt?: string | null;
    published_at?: string | null;
    updated_at: string;
    thumbnail_url?: string | null;
    author?: { name: string } | null;
    url: string;
  },
) {
  const authorBlock = post.author?.name
    ? { '@type': 'Person' as const, name: post.author.name }
    : { '@type': 'Organization' as const, '@id': orgId(), name: SITE_CONFIG.legalName };

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': post.url },
    headline: post.title,
    description: post.excerpt || '',
    ...(post.thumbnail_url
      ? {
          image: {
            '@type': 'ImageObject',
            url: post.thumbnail_url,
            width: 1200,
            height: 630,
          },
        }
      : {}),
    datePublished: post.published_at || post.updated_at,
    dateModified: post.updated_at,
    url: post.url,
    inLanguage: HTML_LANG[locale],
    author: authorBlock,
    publisher: {
      '@type': 'Organization',
      '@id': orgId(),
      name: SITE_CONFIG.legalName,
      url: SITE_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/og-default.png`,
        width: 1200,
        height: 630,
      },
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generatePersonSchema(person: {
  name: string;
  jobTitle?: string | null;
  description?: string | null;
  image?: string | null;
  specialties?: string[] | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    ...(person.jobTitle ? { jobTitle: person.jobTitle } : {}),
    ...(person.description ? { description: person.description } : {}),
    ...(person.image ? { image: person.image } : {}),
    ...(person.specialties?.length ? { knowsAbout: person.specialties } : {}),
    affiliation: {
      '@type': 'Organization',
      '@id': orgId(),
      name: SITE_CONFIG.legalName,
      url: SITE_CONFIG.url,
    },
  };
}
