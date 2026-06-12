import { Link } from '@/i18n/navigation';
import type { GlobalCategory } from '@/lib/blog/types';

interface CategoryFilterProps {
  categories: GlobalCategory[];
  activeSlug?: string;
  allLabel: string;
  navLabel: string;
}

/**
 * Category pills. Each links to a crawlable path (/blog or /blog/category/{slug})
 * so categories are self-canonical index surfaces (hub-spoke internal linking).
 */
export function CategoryFilter({ categories, activeSlug, allLabel, navLabel }: CategoryFilterProps) {
  const base =
    'flex-shrink-0 inline-flex items-center px-4 min-h-[44px] rounded-full text-sm font-medium transition-colors whitespace-nowrap';
  const active = `${base} bg-[var(--brand-primary)] text-[var(--text-primary)]`;
  const inactive = `${base} bg-[var(--bg-elevated)] border border-[var(--line-1)] text-[var(--text-body)] hover:bg-[var(--bg-warm)]`;

  return (
    <nav aria-label={navLabel} className="flex gap-2 overflow-x-auto pb-1">
      <Link href="/blog" className={!activeSlug ? active : inactive}>
        {allLabel}
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/blog/category/${cat.slug}`}
          className={activeSlug === cat.slug ? active : inactive}
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
