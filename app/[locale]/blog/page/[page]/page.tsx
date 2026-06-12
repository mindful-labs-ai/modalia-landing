import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { BlogList } from '@/components/blog/BlogList';
import { getGlobalPostsTotal } from '@/lib/supabase/queries';
import { BLOG_PAGE_SIZE } from '@/constants/blog';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const params: { locale: string; page: string }[] = [];
  for (const locale of routing.locales) {
    const total = await getGlobalPostsTotal(locale);
    const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
    for (let p = 2; p <= totalPages; p++) {
      params.push({ locale, page: String(p) });
    }
  }
  return params;
}

interface PageProps {
  params: Promise<{ locale: string; page: string }>;
}

function parsePage(raw: string): number {
  return Math.max(1, Number.parseInt(raw, 10) || 1);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, page } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'blog' });
  const n = parsePage(page);
  return buildPageMetadata({
    locale: locale as Locale,
    title: `${t('title')} — ${t('pageN', { n })}`,
    description: t('subtitle'),
    path: `/blog/page/${n}`,
  });
}

export default async function BlogPaginatedPage({ params }: PageProps) {
  const { locale, page } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const n = parsePage(page);
  // Page 1 lives at /blog (canonical). Consolidate link equity there.
  if (n <= 1) redirect({ href: '/blog', locale });

  return <BlogList locale={locale as Locale} page={n} />;
}
