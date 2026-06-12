import { ArrowRight } from 'lucide-react';
import { SITE_CONFIG } from '@/constants/site';

/**
 * End-of-article conversion block. Links to the product app (all CTAs route there).
 * data-cta-* attributes are picked up by the global CtaTracker.
 */
export function BottomCTA({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <aside className="mt-16 rounded-2xl border border-[var(--line-1)] bg-[var(--bg-warm)] p-8 text-center">
      <h2 className="text-[var(--text-h3)] font-semibold text-[var(--text-heading-strong)]">
        {title}
      </h2>
      <p className="mt-3 max-w-prose mx-auto text-[var(--text-body)]">{body}</p>
      <a
        href={SITE_CONFIG.appUrl}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-6 py-3 text-[var(--text-cta)] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--brand-primary-soft)]"
        data-cta-intent="signup"
        data-cta-location="blog_bottom"
        data-cta-label="signup"
      >
        {cta}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </a>
    </aside>
  );
}
