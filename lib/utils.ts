import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { HTML_LANG, type Locale } from '@/i18n/routing';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Locale-aware long date (e.g. "June 8, 2026" / "2026年6月8日" / "8 de junio de 2026"). */
export function formatDate(
  locale: Locale,
  dateStr: string | null | undefined,
): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(HTML_LANG[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
