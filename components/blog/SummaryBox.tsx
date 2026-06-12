import { BookOpen } from 'lucide-react';

interface SummaryBoxProps {
  summary: string | null;
  label: string;
}

/**
 * Self-contained direct-answer block placed in the first ~30% of the article —
 * the zone generative AI most often quotes. `summary` should answer the title's
 * implicit question on its own, not merely introduce the post.
 */
export function SummaryBox({ summary, label }: SummaryBoxProps) {
  if (!summary) return null;
  return (
    <div
      className="my-6 rounded-r-lg border-l-4 border-[var(--brand-primary)] bg-[var(--bg-warm)] p-5"
      role="note"
      aria-label={label}
      data-ai-answer="true"
    >
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary-dark)]">
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </p>
      <p className="text-sm leading-relaxed text-[var(--text-body)]">{summary}</p>
    </div>
  );
}
