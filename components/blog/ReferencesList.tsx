import { ExternalLink } from 'lucide-react';
import type { Reference } from '@/lib/blog/types';

interface ReferencesListProps {
  references: Reference[] | null;
  title: string;
  /** Optional localized labels for the academic/government/industry badges. */
  typeLabels?: Record<NonNullable<Reference['type']>, string>;
}

const typeBadgeClass: Record<NonNullable<Reference['type']>, string> = {
  academic: 'bg-[var(--brand-primary-tint)] text-[var(--brand-primary-dark)]',
  government: 'bg-[var(--brand-primary-soft)] text-[var(--bg-base)]',
  industry: 'bg-[var(--line-warm)] text-[var(--text-warm-dark)]',
};

export function ReferencesList({ references, title, typeLabels }: ReferencesListProps) {
  if (!references || references.length === 0) return null;

  return (
    <section className="mt-10 border-t border-[var(--line-1)] pt-8">
      <h2 className="mb-4 text-[var(--text-h3)] font-semibold text-[var(--text-heading-strong)]">
        {title}
      </h2>
      <ol className="space-y-3">
        {references.map((ref, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
            <span className="mt-0.5 shrink-0 font-medium text-[var(--text-body)]">{i + 1}.</span>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 py-1 text-[var(--text-body)] hover:text-[var(--brand-primary-dark)] hover:underline transition-colors"
                  >
                    {ref.name}
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-[var(--text-body)]">{ref.name}</span>
                )}
                {ref.type && typeLabels && (
                  <span
                    className={[
                      'inline-block rounded-full px-2 py-0.5 text-[var(--text-eyebrow)] font-medium',
                      typeBadgeClass[ref.type],
                    ].join(' ')}
                  >
                    {typeLabels[ref.type]}
                  </span>
                )}
              </div>
              {ref.description && <p className="text-[var(--text-muted)]">{ref.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
