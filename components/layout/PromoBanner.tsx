'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/constants/site';

const STORAGE_KEY = 'mt-promo-1month-dismissed';

export function PromoBanner() {
  const t = useTranslations('header');
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    // Read sessionStorage on mount (browser-only). setState-in-effect is required here:
    // SSR can't access sessionStorage, so the controlled initial cannot be derived synchronously.
    let initial = false;
    try {
      initial = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      // sessionStorage unavailable (e.g., privacy mode) — default to visible
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(initial);
  }, []);

  // Toggle the html.has-promo-top class so hifi.css can offset .gnb under the banner.
  useEffect(() => {
    if (dismissed === null) return;
    const html = document.documentElement;
    if (dismissed) {
      html.classList.remove('has-promo-top');
    } else {
      html.classList.add('has-promo-top');
    }
    return () => {
      html.classList.remove('has-promo-top');
    };
  }, [dismissed]);

  if (dismissed) return null;

  function handleClose(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  return (
    <div className="promo-top" data-promo-top role="region" aria-label={t('promoBanner.regionLabel')}>
      <div className="promo-top-inner">
        <p className="promo-top-msg">
          <span className="promo-tag">NEW</span>
          <span>
            {t('promoBanner.text')}
            <a
              href={`${SITE_CONFIG.appUrl}?utm_source=landing&utm_medium=display&utm_campaign=banner`}
              data-promo-cta
              data-cta-intent="signup"
              data-cta-location="promo_banner_top"
              data-cta-label="signup"
            >
              {t('promoBanner.cta')}
            </a>
          </span>
        </p>
        <button
          type="button"
          className="promo-close"
          onClick={handleClose}
          aria-label="Close promotion banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
