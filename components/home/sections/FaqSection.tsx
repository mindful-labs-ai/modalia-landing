'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/constants/site';

type FaqItem = { question: string; answer: string };

export function FaqSection() {
  const t = useTranslations('faq');

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* === §10 FAQ accordion === */
    {
      const list = document.querySelector('[data-faq-list]');
      if (list) {
        const items = list.querySelectorAll<HTMLElement>('[data-faq-item]');
        if (items.length) {
          const close = (item: HTMLElement): void => {
            item.classList.remove('open');
            const trig = item.querySelector('[data-faq-trigger]');
            if (trig) trig.setAttribute('aria-expanded', 'false');
            const tog = item.querySelector('.toggle');
            if (tog) tog.textContent = '+';
          };
          const open = (item: HTMLElement): void => {
            items.forEach(other => { if (other !== item) close(other); });
            item.classList.add('open');
            const trig = item.querySelector('[data-faq-trigger]');
            if (trig) trig.setAttribute('aria-expanded', 'true');
            const tog = item.querySelector('.toggle');
            if (tog) tog.textContent = '−';
          };
          items.forEach(item => {
            const trig = item.querySelector('[data-faq-trigger]');
            if (!trig) return;
            const handler = (): void => {
              if (item.classList.contains('open')) close(item);
              else open(item);
            };
            trig.addEventListener('click', handler);
            cleanups.push(() => trig.removeEventListener('click', handler));
          });
        }
      }
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, []);

  const items = t.raw('items') as FaqItem[];

  return (
    <section id="faq" className="wf-section alt" data-funnel-section="faq">
      <div className="container">
        <div className="wf-marker">
          <span className="num">10</span>
          <span className="name">{t('markerName')}</span>
          <span className="purpose">{t('markerPurpose')}</span>
        </div>

        <div className="faq-head">
          <h2 className="t-h2">{t('heading')}</h2>
        </div>

        <div className="faq-list" data-faq-list>
          {items.map((item, idx) => {
            const answerParagraphs = item.answer.split('\n\n');
            return (
              <article
                key={idx}
                className={`faq-item${idx === 0 ? ' open' : ''}`}
                data-faq-item
              >
                <button
                  type="button"
                  className="faq-q"
                  data-faq-trigger
                  aria-expanded={idx === 0 ? 'true' : 'false'}
                  aria-controls={`faq-a-${idx + 1}`}
                >
                  <h3 className="q-text">{item.question}</h3>
                  <span className="toggle" aria-hidden="true">{idx === 0 ? '−' : '+'}</span>
                </button>
                <div className="faq-answer" id={`faq-a-${idx + 1}`} role="region">
                  <div className="faq-answer-inner">
                    {answerParagraphs.map((para, pIdx) => (
                      <p key={pIdx} className="a-text">{para}</p>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="faq-foot">
          <p className="faq-foot-text">
            {t.rich('footerText', { br: () => <br /> })}
          </p>
          <a
            className="faq-foot-cta"
            href={`mailto:${SITE_CONFIG.email}`}
            data-cta-intent="institution_inquiry"
            data-cta-location="faq"
            data-cta-label={t('footerCta')}
          >{t('footerCta')}</a>
        </div>
      </div>
    </section>
  );
}
