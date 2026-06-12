import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_CONFIG } from '@/constants/site';
import { DEFAULT_AUTHOR } from '@/constants/blog';
import {
  getGlobalPostBySlug,
  getGlobalPostSlugs,
  getSiblingLocaleVersions,
  getKoreanSourceSlug,
} from '@/lib/supabase/queries';
import { processMarkdown } from '@/lib/markdown/processor';
import { extractToc } from '@/lib/markdown/toc';
import { buildBlogPostMetadata } from '@/lib/seo/metadata';
import { blogPostUrl } from '@/lib/blog/hreflang';
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generatePersonSchema,
} from '@/lib/seo/schema';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import { SummaryBox } from '@/components/blog/SummaryBox';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ReferencesList } from '@/components/blog/ReferencesList';
import { FAQSection, extractFAQs } from '@/components/blog/FAQSection';
import { BottomCTA } from '@/components/blog/BottomCTA';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { formatDate } from '@/lib/utils';
import type { Reference } from '@/lib/blog/types';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    const slugs = await getGlobalPostSlugs(locale);
    for (const slug of slugs) params.push({ locale, slug });
  }
  return params;
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const post = await getGlobalPostBySlug(locale as Locale, slug);
  if (!post) {
    return {
      title: 'Not found',
      alternates: { canonical: blogPostUrl(locale as Locale, slug) },
      robots: { index: false, follow: true },
    };
  }

  const [siblings, koSlug] = await Promise.all([
    getSiblingLocaleVersions(post.translation_group_id),
    getKoreanSourceSlug(post.source_post_id),
  ]);

  return buildBlogPostMetadata({
    locale: locale as Locale,
    slug: post.slug,
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || '',
    image: post.og_image_url || post.thumbnail_url,
    keywords: post.keywords,
    publishedAt: post.published_at,
    updatedAt: post.updated_at,
    authorName: post.author?.name ?? DEFAULT_AUTHOR.name,
    siblings,
    koSlug,
  });
}

export default async function GlobalBlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const loc = locale as Locale;
  const post = await getGlobalPostBySlug(loc, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: 'blog' });

  const html = await processMarkdown(post.content);
  const toc = extractToc(post.content);

  const author = {
    name: post.author?.name ?? DEFAULT_AUTHOR.name,
    title: post.author?.title ?? t('author.role'),
    bio: post.author?.bio ?? null,
    image: post.author?.profile_image_url ?? null,
    specialties: post.author?.specialties ?? null,
  };

  const articleUrl = blogPostUrl(loc, post.slug);
  const readingTime =
    post.reading_time ?? Math.max(1, Math.ceil((post.content?.length ?? 0) / 900));
  const references = (post.references ?? null) as Reference[] | null;
  const faqs = extractFAQs((post.schema_markup ?? null) as Record<string, unknown> | null);

  const schemas: Record<string, unknown>[] = [
    generateArticleSchema(loc, {
      title: post.title,
      excerpt: post.excerpt,
      published_at: post.published_at,
      updated_at: post.updated_at,
      thumbnail_url: post.thumbnail_url,
      author: { name: author.name },
      url: articleUrl,
    }),
    generateBreadcrumbSchema([
      { name: t('breadcrumbHome'), url: `${SITE_CONFIG.url}/${loc}` },
      { name: t('title'), url: `${SITE_CONFIG.url}/${loc}/blog` },
      ...(post.category
        ? [{ name: post.category.name, url: `${SITE_CONFIG.url}/${loc}/blog/category/${post.category.slug}` }]
        : []),
      { name: post.title, url: articleUrl },
    ]),
    generatePersonSchema({
      name: author.name,
      jobTitle: author.title,
      description: author.bio,
      image: author.image,
      specialties: author.specialties,
    }),
  ];
  if (faqs.length > 0) schemas.push(generateFAQSchema(faqs));

  return (
    <>
      <SchemaMarkup schema={schemas} />

      {/* Vertical spacing lives on this wrapper, NOT on `.container` — `.container`
          (app/hifi/base.css) sets `padding: 0 var(--gutter)` as unlayered CSS, which
          would override any Tailwind py-* utility placed on the same element. */}
      <div className="pt-16 pb-12 md:pt-24 md:pb-16">
        <article className="container">
        <Link
          href="/blog"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--brand-primary-dark)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> {t('backToList')}
        </Link>

        <header className="mt-4 max-w-3xl">
          {post.category && (
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="inline-flex items-center text-[var(--text-eyebrow)] font-semibold uppercase tracking-wider text-[var(--brand-primary-dark)] hover:underline"
            >
              {post.category.name}
            </Link>
          )}
          <h1 className="mt-3 text-[var(--text-h2)] md:text-[var(--text-display)] font-bold text-[var(--text-heading-strong)]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-5 text-[var(--text-lead)] text-[var(--text-body)]">{post.excerpt}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-secondary)]">
              {author.name}
              {author.title && !author.name.includes(author.title) ? ` · ${author.title}` : ''}
            </span>
            <span aria-hidden>·</span>
            <time dateTime={post.published_at ?? undefined}>
              {formatDate(loc, post.published_at)}
            </time>
            <span aria-hidden>·</span>
            <span>
              {readingTime} {t('minRead')}
            </span>
          </div>
        </header>

        <div className="mt-10 grid gap-12 md:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            {post.thumbnail_url && (
              <div className="overflow-hidden rounded-2xl bg-[var(--bg-elevated)]">
                <Image
                  src={post.thumbnail_url}
                  alt={post.title}
                  width={1200}
                  height={630}
                  priority
                  sizes="(max-width: 1120px) 100vw, 880px"
                  className="h-auto w-full object-cover"
                />
              </div>
            )}

            <div className={post.thumbnail_url ? 'mt-8' : ''}>
              <SummaryBox summary={post.summary} label={t('keyTakeaway')} />
            </div>

            <div className="prose mt-10">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>

            {references && references.length > 0 && (
              <ReferencesList
                references={references}
                title={t('references')}
                typeLabels={{
                  academic: t('refType.academic'),
                  government: t('refType.government'),
                  industry: t('refType.industry'),
                }}
              />
            )}

            <FAQSection faqs={faqs} title={t('faqTitle')} />

            <p className="mt-12 border-t border-[var(--line-1)] pt-6 text-sm italic text-[var(--text-muted)]">
              {t('disclosure')}
            </p>
          </div>

          <aside className="hidden md:block">
            <TableOfContents items={toc} label={t('contents')} />
          </aside>
        </div>

        <BottomCTA title={t('cta.title')} body={t('cta.body')} cta={t('cta.button')} />

        <RelatedPosts currentPost={post} locale={loc} limit={3} />
        </article>
      </div>
    </>
  );
}
