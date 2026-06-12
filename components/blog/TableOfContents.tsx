'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/markdown/toc';

interface TableOfContentsProps {
  items: TocItem[];
  label: string;
}

export function TableOfContents({ items, label }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (items.length < 2) return;

    // Pick the active heading from scroll position: the last heading whose top
    // has passed a line ~120px below the viewport top. This always resolves to
    // exactly one item (defaulting to the first), so the highlight is never lost
    // in the gaps between headings the way a narrow IntersectionObserver band is.
    const computeActive = () => {
      const threshold = 120;
      let current = items[0].id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) {
          current = item.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    computeActive();
    window.addEventListener('scroll', computeActive, { passive: true });
    window.addEventListener('resize', computeActive);
    return () => {
      window.removeEventListener('scroll', computeActive);
      window.removeEventListener('resize', computeActive);
    };
  }, [items]);

  if (items.length < 2) return null;

  const tocList = (
    <ul className="space-y-0.5 text-sm">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? '1rem' : '0' }}>
            <a
              href={`#${item.id}`}
              aria-current={isActive ? 'location' : undefined}
              className={[
                'block rounded-md border-l-2 py-1 pl-3 pr-2 leading-snug transition-all duration-200',
                isActive
                  ? 'border-brand-primary-dark bg-brand-primary-dark/10 font-semibold text-brand-primary-dark'
                  : 'border-transparent font-normal text-[var(--text-muted)] opacity-65 hover:opacity-100 hover:text-brand-primary-dark',
              ].join(' ')}
            >
              {item.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <nav
        className="hidden md:block md:sticky md:top-32 rounded-xl border border-[var(--line-1)] bg-[var(--bg-warm)] p-5"
        aria-label={label}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        {tocList}
      </nav>

      <details className="md:hidden my-6 rounded-xl border border-[var(--line-1)] bg-[var(--bg-warm)]">
        <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-semibold text-[var(--text-heading-strong)] list-none [&::-webkit-details-marker]:hidden">
          <span>{label}</span>
          <span className="text-[var(--text-muted)]" aria-hidden="true">▼</span>
        </summary>
        <div className="border-t border-[var(--line-1)] px-5 py-3">{tocList}</div>
      </details>
    </>
  );
}
