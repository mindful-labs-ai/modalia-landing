import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BookOpen } from 'lucide-react';
import {
  getPublishedGlobalPosts,
  getNonEmptyGlobalCategories,
} from '@/lib/supabase/queries';
import { PostCard } from './PostCard';
import { Pagination } from './Pagination';
import { CategoryFilter } from './CategoryFilter';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import { generateBlogSchema } from '@/lib/seo/schema';
import { BLOG_PAGE_SIZE } from '@/constants/blog';
import type { Locale } from '@/i18n/routing';

interface BlogListProps {
  locale: Locale;
  page: number;
  /** Active category slug (category route) — undefined on the main index. */
  categorySlug?: string;
  /** Localized category name for the hero/title when filtering by category. */
  categoryName?: string;
}

/**
 * Shared blog list view — used by /blog, /blog/page/[page] and /blog/category/[slug].
 * Pagination is path-based so every page is a crawlable, self-canonical surface.
 */
export async function BlogList({ locale, page, categorySlug, categoryName }: BlogListProps) {
  const t = await getTranslations({ locale, namespace: 'blog' });

  const [{ posts, total }, categories] = await Promise.all([
    getPublishedGlobalPosts({ locale, page, perPage: BLOG_PAGE_SIZE, categorySlug }),
    getNonEmptyGlobalCategories(locale),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  const basePath = categorySlug ? `/blog/category/${categorySlug}` : '/blog';

  return (
    <>
      <SchemaMarkup
        schema={generateBlogSchema(locale, { name: t('title'), description: t('subtitle') })}
      />

      <section className="page-hero" aria-label={t('headerAria')}>
        <div className="container">
          <div className="page-hero-content">
            <span className="section-pill">{t('eyebrow')}</span>
            <h1 className="page-hero-h1">{categoryName ?? t('title')}</h1>
            <p className="page-hero-sub">{categoryName ? t('categorySubtitle') : t('subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="wf-section">
        <div className="container">
          <CategoryFilter
            categories={categories}
            activeSlug={categorySlug}
            allLabel={t('all')}
            navLabel={t('categoriesAria')}
          />

          <div className="mt-12">
            {posts.length === 0 ? (
              <EmptyState
                title={t('empty.title')}
                body={t('empty.body')}
                cta={t('empty.cta')}
              />
            ) : (
              <>
                <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {posts.map((post) => (
                    <li key={post.id}>
                      <PostCard post={post} locale={locale} minutesLabel={t('minRead')} />
                    </li>
                  ))}
                </ul>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  basePath={basePath}
                  prevLabel={t('prevPage')}
                  nextLabel={t('nextPage')}
                  navLabel={t('paginationAria')}
                />
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line-1)] bg-[var(--bg-elevated)] p-10 text-center">
      <BookOpen className="mx-auto h-8 w-8 text-[var(--brand-primary-dark)]" aria-hidden />
      <h2 className="mt-4 text-[var(--text-h3)] font-semibold text-[var(--text-heading-strong)]">
        {title}
      </h2>
      <p className="mt-3 max-w-prose mx-auto text-[var(--text-body)]">{body}</p>
      <Link
        href="/blog"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-5 py-3 text-[var(--text-cta)] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--brand-primary-soft)]"
      >
        {cta}
      </Link>
    </div>
  );
}
