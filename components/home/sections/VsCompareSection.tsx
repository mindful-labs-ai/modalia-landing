'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ModaliaLogo } from '@/components/layout/ModaliaLogo';

export function VsCompareSection() {
  const t = useTranslations('vs');

  type VsRow = { key: string; sub: string };
  const genericRows = t.raw('generic.rows') as VsRow[];
  const mindthosRows = t.raw('mindthos.rows') as VsRow[];

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* === §07 vs-compare in-view === */
    {
      const section = document.querySelector('.vs-compare');
      if (section) {
        const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced || !('IntersectionObserver' in window)) {
          section.classList.add('vs-in-view');
        } else {
          const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
              if (e.isIntersecting && e.intersectionRatio >= 0.15) {
                section.classList.add('vs-in-view');
                io.unobserve(section);
              }
            });
          }, { threshold: [0, 0.15, 0.4] });
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
<section className="wf-section" data-funnel-section="vs_compare">
  <div className="container">
    <div className="wf-marker">
      <span className="num">07</span>
      <span className="name">{t('markerName')}</span>
      <span className="purpose">{t('markerPurpose')}</span>
    </div>

    <div className="vs-head">
      <h2 className="t-h2">{t('h2Line1')}<br/>{t('h2Line2')}</h2>
    </div>

    <div className="vs-compare" aria-label={t('generic.ariaLabel') + ' / ' + t('mindthos.ariaLabel')}>

      <section className="vs-side vs-side-generic" aria-label={t('generic.ariaLabel')}>
        <header className="vs-side-head">
          <div className="vs-side-title">
            <span className="vs-side-name">{t('generic.name')}</span>
            <span className="vs-side-tag-brands" aria-hidden="true">
              <Image src="/logo-gemini.webp" alt="" className="vs-brand-img vs-brand-gemini" width={470} height={135} />
              <Image src="/logo-gpt.webp" alt="" className="vs-brand-img vs-brand-gpt" width={535} height={180} />
            </span>
          </div>
          <p className="vs-side-sub">{t('generic.sub')}</p>
        </header>
        <ol className="vs-rows">
          {genericRows.map((row, idx) => (
            <li key={idx} className="vs-row" data-num={String(idx + 1).padStart(2, '0')}>
              <h3 className="vs-row-key">{row.key}</h3>
              <p className="vs-row-sub">{row.sub}</p>
            </li>
          ))}
        </ol>
      </section>


      <section className="vs-side vs-side-mindthos" aria-label={t('mindthos.ariaLabel')}>
        <span className="vs-side-watermark" aria-hidden="true">
          <Image src="/logo-mindthos-webclip.webp" alt="" width={256} height={256} />
        </span>
        <header className="vs-side-head">
          <div className="vs-side-title">
            <ModaliaLogo className="vs-side-logo-img" aria-label={t('mindthos.logoAriaLabel')} />
          </div>
          <p className="vs-side-sub">{t('mindthos.sub')}</p>
        </header>
        <ol className="vs-rows">
          {mindthosRows.map((row, idx) => (
            <li key={idx} className="vs-row" data-num={String(idx + 1).padStart(2, '0')}>
              <h3 className="vs-row-key">{row.key}</h3>
              <p className="vs-row-sub">{row.sub}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>

    <div className="vs-bottom-note">
      <p><strong>{t('bottomNote.strong')}</strong><br/>{t('bottomNote.rest')}</p>
    </div>
  </div>


</section>
  );
}
