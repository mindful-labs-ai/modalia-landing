'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export function TrustEncryptSection() {
  const t = useTranslations('trust');

  /* Localized sentence for the §02 typing animation. Passed into the effect via
     its dependency array so it re-runs if the locale (and thus the text) changes. */
  const sentence = t('encmini.sentence');

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* === §02 encmini typing === */
    {
      const sentenceEl = document.querySelector<HTMLElement>('[data-encmini-sentence]');
      const cipherEl = document.querySelector<HTMLElement>('[data-encmini-cipher]');
      if (sentenceEl && cipherEl) {
        const cipher = 'a3asd73f9k2x  9f2k7x  x4mn82';
        const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
          sentenceEl.textContent = sentence;
          cipherEl.textContent = cipher;
        } else {
          const typeInto = (el: HTMLElement, text: string, speed: number, done?: () => void): void => {
            let i = 0;
            el.textContent = '';
            const step = (): void => {
              if (i <= text.length) {
                el.textContent = text.slice(0, i);
                i++;
                setTimeout(step, speed);
              } else if (done) {
                done();
              }
            };
            step();
          };
          const play = (): void => {
            typeInto(sentenceEl, sentence, 38, () => {
              setTimeout(() => typeInto(cipherEl, cipher, 28), 320);
            });
          };
          let played = false;
          const stage = document.querySelector('.trust-visual-encrypt');
          if (!stage || !('IntersectionObserver' in window)) {
            play();
          } else {
            const io = new IntersectionObserver((entries) => {
              entries.forEach((en) => {
                if (en.isIntersecting && !played) {
                  played = true;
                  play();
                  io.disconnect();
                }
              });
            }, { threshold: 0.4 });
            io.observe(stage);
            cleanups.push(() => io.disconnect());
          }
        }
      }
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, [sentence]);

  return (
<section className="wf-section alt" data-funnel-section="trust" id="trust">
  <div className="container">
    <div className="wf-marker">
      <span className="num">02</span>
      <span className="name">Trust &amp; Security</span>
      <span className="purpose">{t('wfPurpose')}</span>
    </div>

    <div className="trust-head trust-head--lean">
      <h2 className="t-h2">{t.rich('h2', { br: () => <br /> })}</h2>
    </div>


    <div className="trust-body">

      <aside className="trust-team">
        <h3 className="trust-team-title">{t.rich('team.title', { br: () => <br /> })}</h3>

        <div className="expanel" aria-label={t('team.panelAriaLabel')}>
          <ul className="expanel-grid" role="list">
            <li className="expanel-card">
              <span className="expanel-badge" aria-hidden="true">BE</span>
              <h4 className="expanel-role">{t.rich('team.be.role', { br: () => <br /> })}</h4>
              <p className="expanel-desc">{t('team.be.desc')}</p>
              <ul className="expanel-tags" role="list">
                {(t.raw('team.be.tags') as string[]).map((tag: string) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </li>
            <li className="expanel-card">
              <span className="expanel-badge" aria-hidden="true">SEC</span>
              <h4 className="expanel-role">{t.rich('team.sec.role', { br: () => <br /> })}</h4>
              <p className="expanel-desc">{t('team.sec.desc')}</p>
              <ul className="expanel-tags" role="list">
                {(t.raw('team.sec.tags') as string[]).map((tag: string) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </li>
            <li className="expanel-card">
              <span className="expanel-badge" aria-hidden="true">AI</span>
              <h4 className="expanel-role">{t('team.ai.role')}</h4>
              <p className="expanel-desc">{t('team.ai.desc')}</p>
              <ul className="expanel-tags" role="list">
                {(t.raw('team.ai.tags') as string[]).map((tag: string) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </li>
          </ul>

          <p className="expanel-conclusion">
            <span className="expanel-conclusion-label" aria-hidden="true">{t('team.conclusionLabel')}</span>
            {t('team.conclusion')}
          </p>
        </div>

        <div className="trust-team-cta">
          <Link href="#trust">
            {t.rich('team.cta', { arrow: (chunks) => <span aria-hidden="true">{chunks}</span> })}
          </Link>
        </div>
      </aside>


      <div className="trust-timeline trust-protect-3 trust-protect-v2">
        <p className="trust-timeline-title">{t('shield.title')}</p>


        <div className="trust-protect-item">
          <div className="trust-protect-head">
            <div className="trust-protect-icon" aria-hidden="true">

              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4.5" y="11" width="15" height="10" rx="1.8"/>
                <path d="M7.5 11 V7 a4.5 4.5 0 0 1 9 0 V11"/>
                <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none"/>
                <line x1="12" y1="16.5" x2="12" y2="18.5"/>
              </svg>
            </div>
            <div className="trust-protect-content">
              <h3 className="trust-protect-label">{t('shield.enc.label')}</h3>
              <p className="trust-protect-desc">{t('shield.enc.desc')}</p>
            </div>
          </div>
          <div className="trust-visual trust-visual-encrypt" aria-hidden="true">

            <div className="encmini">

              <div className="encmini-text">
                <span className="encmini-tag">{t('encmini.tagPlain')}</span>
                <p className="encmini-sentence" data-encmini-sentence></p>
                <span className="encmini-caret" aria-hidden="true"></span>
              </div>


              <div className="encmini-flow encmini-flow-l" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
              </div>


              <div className="encmini-center" aria-hidden="true">
                <span className="encmini-tag encmini-tag-mid">{t('encmini.tagEnc')}</span>
                <div className="encmini-lock" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="10.5" width="14" height="9" rx="1.6"/>
                    <path d="M8 10.5 V7 a4 4 0 0 1 8 0 V10.5"/>
                  </svg>
                  <span className="encmini-lock-glow" aria-hidden="true"></span>
                </div>
              </div>


              <div className="encmini-flow encmini-flow-r" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
              </div>


              <div className="encmini-code">
                <span className="encmini-tag encmini-tag-code">{t('encmini.tagStored')}</span>
                <p className="encmini-cipher" data-encmini-cipher></p>
                <span className="encmini-caret encmini-caret-code" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        </div>


        <div className="trust-protect-item">
          <div className="trust-protect-head">
            <div className="trust-protect-icon" aria-hidden="true">

              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/>
              </svg>
            </div>
            <div className="trust-protect-content">
              <h3 className="trust-protect-label">{t('shield.noai.label')}</h3>
              <p className="trust-protect-desc">{t('shield.noai.desc')}</p>
            </div>
          </div>
          <div className="trust-visual trust-visual-noai" aria-hidden="true">

            <div className="noaimini">

              <div className="noaimini-node noaimini-record">
                <span className="noaimini-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3 h9 l4 4 v13 a1.5 1.5 0 0 1-1.5 1.5 H6 a1.5 1.5 0 0 1-1.5-1.5 V4.5 A1.5 1.5 0 0 1 6 3 z"/>
                    <path d="M15 3 v4 h4"/>
                    <line x1="8.5" y1="12" x2="15" y2="12"/>
                    <line x1="8.5" y1="15.5" x2="14" y2="15.5"/>
                  </svg>
                </span>
                <span className="noaimini-label">{t('noaimini.recordLabel')}</span>
              </div>


              <div className="noaimini-track" aria-hidden="true">
                <span className="noaimini-line noaimini-line-l"></span>
                <span className="noaimini-pulse"></span>
                <span className="noaimini-block">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="6" y1="6" x2="18" y2="18"/>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                  </svg>
                </span>
                <span className="noaimini-line noaimini-line-r"></span>
              </div>


              <div className="noaimini-node noaimini-ai">
                <span className="noaimini-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                    <rect x="9" y="9" width="6" height="6" rx="0.8"/>
                    <line x1="10.5" y1="3.5" x2="10.5" y2="6"/>
                    <line x1="13.5" y1="3.5" x2="13.5" y2="6"/>
                    <line x1="10.5" y1="18" x2="10.5" y2="20.5"/>
                    <line x1="13.5" y1="18" x2="13.5" y2="20.5"/>
                    <line x1="3.5" y1="10.5" x2="6" y2="10.5"/>
                    <line x1="3.5" y1="13.5" x2="6" y2="13.5"/>
                    <line x1="18" y1="10.5" x2="20.5" y2="10.5"/>
                    <line x1="18" y1="13.5" x2="20.5" y2="13.5"/>
                  </svg>
                </span>
                <span className="noaimini-label">{t('noaimini.aiLabel')}</span>
              </div>
            </div>
          </div>
        </div>


        <div className="trust-protect-item">
          <div className="trust-protect-head">
            <div className="trust-protect-icon" aria-hidden="true">

              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.2 12 c2.5-4.6 6-6.7 8.8-6.7 1.4 0 2.8 0.5 4.1 1.3"/>
                <path d="M20.8 12 c-1.1 1.9-2.5 3.5-4.1 4.6"/>
                <circle cx="12" cy="12" r="2.7"/>
                <line x1="3.5" y1="3.5" x2="20.5" y2="20.5"/>
              </svg>
            </div>
            <div className="trust-protect-content">
              <h3 className="trust-protect-label">{t('shield.mask.label')}</h3>
              <p className="trust-protect-desc">{t('shield.mask.desc')}</p>
            </div>
          </div>
          <div className="trust-visual trust-visual-mask">

            <div className="maskmini">
              <div className="maskmini-doc">
                <p className="maskmini-line">
                  {t.rich('maskmini.line1', {
                    pii1: (chunks) => (
                      <span className="maskmini-pii" data-mask={t('maskmini.pii1Label')} tabIndex={0}>{chunks}</span>
                    ),
                    pii2: (chunks) => (
                      <span className="maskmini-pii" data-mask={t('maskmini.pii2Label')} tabIndex={0}>{chunks}</span>
                    ),
                  })}
                </p>
                <p className="maskmini-line">
                  {t.rich('maskmini.line2', {
                    pii3: (chunks) => (
                      <span className="maskmini-pii" data-mask={t('maskmini.pii3Label')} tabIndex={0}>{chunks}</span>
                    ),
                  })}
                </p>
              </div>
              <p className="maskmini-hint">{t('maskmini.hint')}</p>
            </div>
          </div>
        </div>




      </div>
    </div>
  </div>
</section>
  );
}
