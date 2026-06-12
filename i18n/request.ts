import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * Message catalog split into per-namespace files (`messages/<locale>/<namespace>.json`).
 * File-per-section layout avoids parallel-work merge conflicts and makes adding a
 * new language as simple as duplicating a folder.
 *
 * NAMESPACES below is the single source of truth — add a line here when adding a section,
 * then create the matching file in every locale folder. Key sets must be identical across all locales.
 */
const NAMESPACES = [
  'common',
  'header',
  'footer',
  'hero',
  'trust',
  'pain',
  'features',
  'sample',
  'personas',
  'vs',
  'metrics',
  'pricing',
  'faq',
  'finalCta',
  'metadata',
  'blog',
  'waitlist',
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    }),
  );

  return {
    locale,
    messages: Object.fromEntries(entries),
  };
});
