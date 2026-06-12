import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { GlobalPost } from '@/lib/blog/types';
import { formatDate } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

interface PostCardProps {
  post: GlobalPost;
  locale: Locale;
  /** Localized "min read" suffix (e.g. "min read"). */
  minutesLabel: string;
}

function readingMinutes(post: GlobalPost): number {
  return post.reading_time ?? Math.max(1, Math.ceil((post.content?.length ?? 0) / 900));
}

export function PostCard({ post, locale, minutesLabel }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-[var(--bg-base)] rounded-xl border border-[var(--line-1)] hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      <div className="relative w-full aspect-video bg-[var(--bg-elevated)] overflow-hidden">
        {post.thumbnail_url ? (
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            width={1200}
            height={630}
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary-soft)] to-[var(--brand-primary)]/20" />
        )}
        {post.category && (
          <span className="absolute top-3 left-3 inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-base)]/90 text-[var(--brand-primary-dark)]">
            {post.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h2 className="font-semibold text-[var(--text-heading)] text-base leading-snug line-clamp-2 group-hover:text-[var(--brand-primary-dark)] transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-[var(--text-muted)] line-clamp-2 flex-1">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mt-auto pt-2 border-t border-[var(--line-1)]">
          <time dateTime={post.published_at ?? undefined}>
            {formatDate(locale, post.published_at)}
          </time>
          <span aria-hidden="true">·</span>
          <span>
            {readingMinutes(post)} {minutesLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
