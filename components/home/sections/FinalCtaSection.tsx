'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/constants/site';

export function FinalCtaSection() {
  const t = useTranslations('finalCta');

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* === §11 final CTA in-view === */
    {
      const section = document.querySelector('.final-cta-section');
      if (section) {
        const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced || !('IntersectionObserver' in window)) {
          section.classList.add('final-in-view');
        } else {
          const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
              if (e.isIntersecting && e.intersectionRatio >= 0.18) {
                section.classList.add('final-in-view');
                io.unobserve(section);
              }
            });
          }, { threshold: [0, 0.18, 0.4] });
          io.observe(section);
          cleanups.push(() => io.disconnect());
        }
      }
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, []);

  return (
    <section className="wf-section final-cta-section" data-funnel-section="final_cta">
      <div className="container">
        <div className="wf-marker">
          <span className="num">{t('markerNum')}</span>
          <span className="name">{t('markerName')}</span>
          <span className="purpose">{t('markerPurpose')}</span>
        </div>

        <div className="final-cta-inner">
          <h2 className="final-cta-h2">
            {t.rich('heading', { br: () => <br /> })}
          </h2>
          <div className="final-cta-btns">
            <a
              className="btn lg primary"
              href={SITE_CONFIG.appUrl}
              data-cta-intent="signup"
              data-cta-location="final_cta"
              data-cta-label={t('ctaPrimary')}
            >{t('ctaPrimary')} <span className="arr" aria-hidden="true">→</span></a>
            <a
              className="final-cta-link"
              href={`mailto:${SITE_CONFIG.email}`}
              data-cta-intent="institution_inquiry"
              data-cta-location="final_cta"
              data-cta-label={t('ctaSecondary')}
            >{t('ctaSecondary')}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
