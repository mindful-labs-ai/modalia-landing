/**
 * FAQ UI only. The FAQPage JSON-LD is injected by the parent page (single responsibility).
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function extractFAQs(schema: Record<string, unknown> | null): FAQItem[] {
  if (!schema) return [];

  if (schema['@type'] === 'FAQPage') {
    const mainEntity = schema['mainEntity'];
    if (Array.isArray(mainEntity)) {
      return mainEntity
        .filter(
          (item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null,
        )
        .map((item) => {
          const acceptedAnswer = item['acceptedAnswer'] as Record<string, unknown> | undefined;
          return {
            question: String(item['name'] ?? ''),
            answer: String(acceptedAnswer?.['text'] ?? ''),
          };
        })
        .filter((faq) => faq.question && faq.answer);
    }
  }

  const mainEntity = schema['mainEntity'];
  if (Array.isArray(mainEntity)) {
    const faqPage = mainEntity.find(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && item['@type'] === 'FAQPage',
    );
    if (faqPage) return extractFAQs(faqPage);
  }
  return [];
}

export function FAQSection({ faqs, title }: { faqs: FAQItem[]; title: string }) {
  if (faqs.length === 0) return null;
  return (
    <section className="mt-10 border-t border-[var(--line-1)] pt-8">
      <h2 className="mb-6 text-[var(--text-h3)] font-semibold text-[var(--text-heading-strong)]">
        {title}
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-xl border border-[var(--line-1)] bg-[var(--bg-base)] overflow-hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-[var(--text-heading-strong)] list-none [&::-webkit-details-marker]:hidden hover:bg-[var(--bg-warm)] transition-colors">
              <span>{faq.question}</span>
              <span className="shrink-0 text-[var(--text-muted)] group-open:rotate-180 transition-transform" aria-hidden="true">
                ▼
              </span>
            </summary>
            <div className="border-t border-[var(--line-1)] px-5 py-4">
              <p className="text-sm leading-relaxed text-[var(--text-body)]">{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
