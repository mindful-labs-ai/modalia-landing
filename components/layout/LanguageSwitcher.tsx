'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';

/**
 * Language switcher — swaps only the locale while keeping the current path (without locale prefix).
 * usePathname from i18n/navigation returns the prefix-stripped path,
 * so router.replace(pathname, { locale }) navigates to the same path in the target locale.
 */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function change(next: Locale) {
    if (next !== locale) {
      router.replace(pathname, { locale: next });
    }
    setOpen(false);
  }

  // Single-locale phase (English only): nothing to switch between, so render nothing.
  if (routing.locales.length <= 1) return null;

  return (
    <div ref={ref} className="lang-switch">
      <button
        type="button"
        className="lang-switch-toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('langSwitcher.label')}
        onClick={() => setOpen((s) => !s)}
      >
        <Globe size={16} aria-hidden="true" />
        <span>{LOCALE_LABELS[locale]}</span>
      </button>
      {open && (
        <ul className="lang-switch-menu" role="listbox" aria-label={t('langSwitcher.label')}>
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                className="lang-switch-option"
                onClick={() => change(l)}
              >
                <span>{LOCALE_LABELS[l]}</span>
                {l === locale && <Check size={15} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
