import { defineRouting } from 'next-intl/routing';

/**
 * Global site routing.
 * `localePrefix: 'always'` — every locale has an explicit URL prefix (/en, /es, /zh-Hant, /de).
 * To add a language: add the locale here, create messages/<locale>/<namespace>.json for every
 * namespace (key sets identical to en), and extend the OG_LOCALE/HTML_LANG/LOCALE_LABELS maps below
 * plus the `langs` block in lib/seo/metadata.ts → languageAlternates().
 * The root (/) is redirected by middleware to the defaultLocale prefix (simple prefix redirect, not an auto-detect 301).
 */
export const routing = defineRouting({
  locales: ['en', 'es', 'zh-Hant', 'de'],
  defaultLocale: 'en',
  localePrefix: 'always',
  // Disable automatic locale detection and forced redirect (PRD FR10). Locale is determined solely by the URL prefix.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** OpenGraph og:locale tags (language_TERRITORY). */
export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
  'zh-Hant': 'zh_TW',
  de: 'de_DE',
};

/** IETF language tags used in <html lang>, JSON-LD inLanguage, etc. */
export const HTML_LANG: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
  'zh-Hant': 'zh-Hant',
  de: 'de-DE',
};

/** Language switcher labels (each language's own endonym). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  'zh-Hant': '繁體中文',
  de: 'Deutsch',
};
