import { getTranslations } from 'next-intl/server';
import { getRelatedGlobalPosts } from '@/lib/supabase/queries';
import { PostCard } from './PostCard';
import type { GlobalPost } from '@/lib/blog/types';
import type { Locale } from '@/i18n/routing';

interface RelatedPostsProps {
  currentPost: GlobalPost;
  locale: Locale;
  limit?: number;
}

export async function RelatedPosts({ currentPost, locale, limit = 3 }: RelatedPostsProps) {
  const posts = await getRelatedGlobalPosts(currentPost, limit);
  if (posts.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'blog' });

  return (
    <section className="mt-16 border-t border-[var(--line-1)] pt-12">
      <h2 className="mb-6 text-[var(--text-h3)] font-semibold text-[var(--text-heading-strong)]">
        {t('related')}
      </h2>
      <ul className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} locale={locale} minutesLabel={t('minRead')} />
          </li>
        ))}
      </ul>
    </section>
  );
}
