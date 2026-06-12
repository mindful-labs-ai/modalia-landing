import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { BlogList } from '@/components/blog/BlogList';
import {
  getGlobalCategories,
  getNonEmptyGlobalCategories,
  getGlobalPostsTotal,
} from '@/lib/supabase/queries';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    // Only pre-render categories that have posts; empty-but-valid categories
    // still resolve on-demand (dynamicParams) and are noindex'd in metadata.
    const cats = await getNonEmptyGlobalCategories(locale);
    for (const cat of cats) params.push({ locale, slug: cat.slug });
  }
  return params;
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const cats = await getGlobalCategories(locale as Locale);
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) return {};
  const t = await getTranslations({ locale, namespace: 'blog' });
  // Empty categories exist in the taxonomy but carry no content yet → keep them
  // out of the index until they have posts (thin-content protection).
  const total = await getGlobalPostsTotal(locale as Locale, slug);
  return buildPageMetadata({
    locale: locale as Locale,
    title: `${cat.name} — ${t('title')}`,
    description: cat.description || t('subtitle'),
    path: `/blog/category/${slug}`,
    noindex: total === 0,
    // KR category structure differs (?category= with different slugs) — no 1:1 ko equivalent.
    crossDomainKo: false,
  });
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const cats = await getGlobalCategories(locale as Locale);
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) notFound();

  return (
    <BlogList
      locale={locale as Locale}
      page={1}
      categorySlug={slug}
      categoryName={cat.name}
    />
  );
}
