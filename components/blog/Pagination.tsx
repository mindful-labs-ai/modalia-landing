import type { CSSProperties } from 'react';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Locale-relative base path, e.g. "/blog" or "/blog/category/guides". */
  basePath: string;
  prevLabel: string;
  nextLabel: string;
  navLabel: string;
}

const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 44,
  minWidth: 44,
  padding: '0 10px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1,
  transition: 'background-color 160ms, color 160ms',
};
const ellipsisStyle: CSSProperties = { ...btnStyle, minWidth: 24, padding: '0 4px', color: 'var(--text-muted)' };
const activeStyle: CSSProperties = { ...btnStyle, background: 'var(--brand-primary)', color: 'var(--text-primary)' };
const inactiveStyle: CSSProperties = { ...btnStyle, color: 'var(--text-body)' };
const disabledStyle: CSSProperties = { ...btnStyle, color: 'var(--line-1)', cursor: 'not-allowed' };

/**
 * Path-based pagination — page 1 = basePath, page N = `${basePath}/page/N`.
 * Each page is a self-canonical, crawlable URL so long-tail posts get discovered.
 */
export function Pagination({
  currentPage,
  totalPages,
  basePath,
  prevLabel,
  nextLabel,
  navLabel,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageHref = (page: number): string =>
    page <= 1 ? basePath : `${basePath}/page/${page}`;

  function getPages(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  return (
    <nav
      aria-label={navLabel}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 40 }}
    >
      {currentPage > 1 ? (
        <Link href={pageHref(currentPage - 1)} style={inactiveStyle} className="hover:bg-[var(--bg-warm)]" aria-label={prevLabel}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </Link>
      ) : (
        <span style={disabledStyle} aria-disabled="true" aria-label={prevLabel}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </span>
      )}

      {getPages().map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} style={ellipsisStyle}>&hellip;</span>
        ) : (
          <Link
            key={page}
            href={pageHref(page)}
            style={page === currentPage ? activeStyle : inactiveStyle}
            className={page === currentPage ? '' : 'hover:bg-[var(--bg-warm)]'}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link href={pageHref(currentPage + 1)} style={inactiveStyle} className="hover:bg-[var(--bg-warm)]" aria-label={nextLabel}>
          <ChevronRight style={{ width: 16, height: 16 }} />
        </Link>
      ) : (
        <span style={disabledStyle} aria-disabled="true" aria-label={nextLabel}>
          <ChevronRight style={{ width: 16, height: 16 }} />
        </span>
      )}
    </nav>
  );
}
