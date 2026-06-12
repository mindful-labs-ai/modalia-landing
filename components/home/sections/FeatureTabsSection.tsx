'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

/**
 * Localized genogram mock image per locale. Each export was authored separately,
 * so intrinsic dimensions differ — width/height below match each file to avoid
 * layout shift (the canvas uses object-fit: contain, so aspect differences just
 * letterbox, never distort). Falls back to `en` for any unexpected locale.
 */
const GENOGRAM_IMG: Record<string, { src: string; width: number; height: number }> = {
  en: { src: '/genogram-honggildong-en.webp', width: 1745, height: 1206 },
  es: { src: '/genogram-honggildong-es.webp', width: 1761, height: 1266 },
  'zh-Hant': { src: '/genogram-honggildong-zh-Hant.webp', width: 1639, height: 1266 },
  de: { src: '/genogram-honggildong-de.webp', width: 1822, height: 1266 },
};

export function FeatureTabsSection() {
  const t = useTranslations('features');
  const locale = useLocale();
  const geno = GENOGRAM_IMG[locale] ?? GENOGRAM_IMG.en;

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* === §04 feature tabs auto-rotation === */
    {
      const tabs = document.querySelectorAll<HTMLElement>('.feat-tab');
      const panels = document.querySelectorAll<HTMLElement>('.feat-panel');
      if (tabs.length && panels.length) {
        const featRoot = document.querySelector('.feat-tabs');
        const section = featRoot ? featRoot.closest('section') : null;
        const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const ROTATION_ORDER = ['psy', 'trx', 'note', 'cnc', 'geno'];
        const ROTATE_MS = 5000;
        let autoTimer: ReturnType<typeof setInterval> | null = null;
        let hovering = false;
        let inView = false;
        let orderIdx = 0;

        const activate = (key: string): void => {
          tabs.forEach(t => {
            t.setAttribute('aria-selected', t.dataset.tab === key ? 'true' : 'false');
          });
          panels.forEach(p => {
            const on = p.dataset.panel === key;
            p.dataset.active = on ? 'true' : 'false';
            const trig = p.querySelector('.feat-acc-trigger');
            if (trig) trig.setAttribute('aria-expanded', on ? 'true' : 'false');
            const icon = p.querySelector('.feat-acc-icon');
            if (icon) icon.textContent = on ? '−' : '+';
          });
          const foundIdx = ROTATION_ORDER.indexOf(key);
          if (foundIdx >= 0) orderIdx = foundIdx;
        };
        const rotateNext = (): void => {
          orderIdx = (orderIdx + 1) % ROTATION_ORDER.length;
          activate(ROTATION_ORDER[orderIdx]);
        };
        const clearTimer = (): void => {
          if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        };
        const startTimer = (): void => {
          if (prefersReduced) return;
          if (!inView) return;
          if (hovering) return;
          clearTimer();
          autoTimer = setInterval(rotateNext, ROTATE_MS);
        };
        const resetTimer = (): void => { clearTimer(); startTimer(); };

        tabs.forEach(t => {
          const handler = (): void => {
            if (t.dataset.tab) activate(t.dataset.tab);
            resetTimer();
          };
          t.addEventListener('click', handler);
          cleanups.push(() => t.removeEventListener('click', handler));
        });
        panels.forEach(p => {
          const trig = p.querySelector('.feat-acc-trigger');
          if (!trig) return;
          const handler = (): void => {
            if (p.dataset.panel) activate(p.dataset.panel);
            resetTimer();
          };
          trig.addEventListener('click', handler);
          cleanups.push(() => trig.removeEventListener('click', handler));
        });
        if (section) {
          const enter = (): void => { hovering = true; clearTimer(); };
          const leave = (): void => { hovering = false; startTimer(); };
          section.addEventListener('mouseenter', enter);
          section.addEventListener('mouseleave', leave);
          cleanups.push(() => section.removeEventListener('mouseenter', enter));
          cleanups.push(() => section.removeEventListener('mouseleave', leave));
        }
        activate('psy');
        if (section && 'IntersectionObserver' in window) {
          const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                inView = true;
                startTimer();
              } else {
                inView = false;
                clearTimer();
              }
            });
          }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
          io.observe(section);
          cleanups.push(() => io.disconnect());
        } else {
          inView = true;
          startTimer();
        }
        cleanups.push(clearTimer);
      }
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, []);

  return (
<section id="features" className="wf-section alt" data-funnel-section="features">
  <div className="container">
    <div className="wf-marker">
      <span className="num">{t('marker.num')}</span>
      <span className="name">{t('marker.name')}</span>
      <span className="purpose">{t('marker.purpose')}</span>
    </div>

    <div className="feat-head feat-head--lean">
      <h2 className="t-h2">{t.rich('heading', { br: () => <br /> })}</h2>
    </div>

    {/* aria-required-children: role="tablist" only allows role="tab" children — moving role/aria-label
        to inner .feat-tablist (wrapper for tab buttons only) (Lighthouse 2026-05-08). */}
    <div className="feat-tabs">

      <div className="feat-tablist" role="tablist" aria-label={t('tablistLabel')}>
        <button type="button" className="feat-tab" role="tab" aria-selected="true" data-tab="psy">
          <span className="feat-tab-num">{t('tabs.psy.num')}</span>
          <span className="feat-tab-icon" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="4" width="21" height="20" rx="2"/>
              <line x1="3.5" y1="10" x2="24.5" y2="10"/>
              <line x1="8" y1="20" x2="8" y2="16.5"/>
              <line x1="12" y1="20" x2="12" y2="14"/>
              <line x1="16" y1="20" x2="16" y2="15.5"/>
              <line x1="20" y1="20" x2="20" y2="13"/>
            </svg>
          </span>
          <span className="feat-tab-text">
            <span className="feat-tab-label">{t('tabs.psy.label')}<span className="feat-tab-new">{t('tabs.psy.new')}</span></span>
            <span className="feat-tab-sub">{t('tabs.psy.sub')}</span>
          </span>
        </button>
        <button type="button" className="feat-tab" role="tab" aria-selected="false" data-tab="trx">
          <span className="feat-tab-num">{t('tabs.trx.num')}</span>
          <span className="feat-tab-icon" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="13" y="3" width="11" height="14" rx="1.5"/>
              <line x1="16" y1="8" x2="20" y2="8"/>
              <line x1="16" y1="11.5" x2="20" y2="11.5"/>
              <line x1="3.5" y1="20.5" x2="3.5" y2="24.5"/>
              <line x1="6" y1="18" x2="6" y2="25"/>
              <line x1="8.5" y1="15.5" x2="8.5" y2="25"/>
              <line x1="11" y1="19" x2="11" y2="25"/>
            </svg>
          </span>
          <span className="feat-tab-text">
            <span className="feat-tab-label">{t('tabs.trx.label')}</span>
            <span className="feat-tab-sub">{t('tabs.trx.sub')}</span>
          </span>
        </button>
        <button type="button" className="feat-tab" role="tab" aria-selected="false" data-tab="note">
          <span className="feat-tab-num">{t('tabs.note.num')}</span>
          <span className="feat-tab-icon" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3.5" width="20" height="21" rx="2"/>
              <path d="M8 10.5 L 10 12.5 L 13.5 9"/>
              <path d="M8 16.5 L 10 18.5 L 13.5 15"/>
              <line x1="16" y1="11" x2="20" y2="11"/>
              <line x1="16" y1="17" x2="20" y2="17"/>
            </svg>
          </span>
          <span className="feat-tab-text">
            <span className="feat-tab-label">{t('tabs.note.label')}</span>
            <span className="feat-tab-sub">{t('tabs.note.sub')}</span>
          </span>
        </button>
        <button type="button" className="feat-tab" role="tab" aria-selected="false" data-tab="cnc">
          <span className="feat-tab-num">{t('tabs.cnc.num')}</span>
          <span className="feat-tab-icon" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <line x1="9" y1="9" x2="19" y2="9"/>
              <line x1="8" y1="11" x2="13.5" y2="20"/>
              <line x1="20" y1="11" x2="14.5" y2="20"/>
              <circle cx="7" cy="8" r="2.5"/>
              <circle cx="21" cy="8" r="2.5"/>
              <circle cx="14" cy="21" r="2.5"/>
            </svg>
          </span>
          <span className="feat-tab-text">
            <span className="feat-tab-label">{t('tabs.cnc.label')}</span>
            <span className="feat-tab-sub">{t('tabs.cnc.sub')}</span>
          </span>
        </button>
        <button type="button" className="feat-tab" role="tab" aria-selected="false" data-tab="geno">
          <span className="feat-tab-num">{t('tabs.geno.num')}</span>
          <span className="feat-tab-icon" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="11" y="3" width="6" height="6" rx="0.5"/>
              <line x1="14" y1="9" x2="14" y2="15"/>
              <line x1="7" y1="15" x2="21" y2="15"/>
              <line x1="7" y1="15" x2="7" y2="18"/>
              <line x1="21" y1="15" x2="21" y2="18"/>
              <rect x="4" y="18" width="6" height="6" rx="0.5"/>
              <circle cx="21" cy="21" r="3"/>
            </svg>
          </span>
          <span className="feat-tab-text">
            <span className="feat-tab-label">{t('tabs.geno.label')}</span>
            <span className="feat-tab-sub">{t('tabs.geno.sub')}</span>
          </span>
        </button>
      </div>



      <div className="feat-panel" role="tabpanel" data-panel="trx" data-active="false">
        <button type="button" className="feat-acc-trigger" aria-expanded="false">
          <span className="feat-acc-num">{t('panels.trx.accNum')}</span>
          <span className="feat-acc-label">{t('panels.trx.accLabel')}</span>
          <span className="feat-acc-icon">+</span>
        </button>
        <div className="feat-acc-body">
          <div className="feat-copy">
            <span className="feat-cat">{t('panels.trx.cat')}</span>
            <h3 className="feat-msg">{t('panels.trx.msg')}</h3>
            <div className="feat-when">{t('panels.trx.when')}</div>
            <p className="feat-desc">{t('panels.trx.desc')}</p>
            <div className="feat-pain-row">
              <span className="feat-pain-lbl">{t('panels.trx.painLbl')}</span>
              <div className="feat-pain-tags">
                <span className="pain-tag">{t('panels.trx.painTag')}</span>
              </div>
            </div>
          </div>
          <div className="feat-mock" aria-hidden="true">

            <div className="mt2">
              <div className="mt2-head">
                <div className="mt2-title-row">
                  <h4 className="mt2-title">{t('panels.trx.mock.fileTitle')}</h4>
                  <svg className="mt2-edit" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 11.5 V12.5 H3 L11 4.5 L10 3.5 Z"/>
                    <path d="M9 4.5 L10 5.5"/>
                  </svg>
                </div>
                <span className="mt2-meta">{t('panels.trx.mock.fileMeta')}</span>
                <div className="mt2-tabs">
                  <span className="mt2-pill is-active">{t('panels.trx.mock.pill1')}</span>
                  <span className="mt2-pill">{t('panels.trx.mock.pill2')}</span>
                  <span className="mt2-pill-add">+</span>
                </div>
              </div>
              <div className="mt2-card">
                <div className="mt2-card-head">
                  <div>
                    <h5 className="mt2-card-title">{t('panels.trx.mock.cardTitle')}</h5>
                    <span className="mt2-card-sub">{t('panels.trx.mock.cardSub')}</span>
                  </div>
                  <div className="mt2-card-actions">
                    <button className="mt2-action" type="button">
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 9.5 V10.5 H3 L9.5 4 L8.5 3 Z"/></svg>
                      {t('panels.trx.mock.editBtn')}
                    </button>
                    <button className="mt2-action" type="button">
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="8" rx="1"/><path d="M3 3 V2 H8 V3"/></svg>
                      {t('panels.trx.mock.copyBtn')}
                    </button>
                  </div>
                </div>
                <div className="mt2-trx">
                  <div className="mt2-trx-row">
                    <span className="mt2-avatar is-c">{t('panels.trx.mock.counselorLabel').charAt(0)}</span>
                    <div>
                      <div className="mt2-trx-meta">
                        <span className="mt2-trx-who">{t('panels.trx.mock.counselorLabel')}</span>
                        <span className="mt2-trx-idx">1</span>
                      </div>
                      <p className="mt2-trx-text">{t('panels.trx.mock.line1c')}</p>
                    </div>
                  </div>
                  <div className="mt2-trx-row">
                    <span className="mt2-avatar is-a">A</span>
                    <div>
                      <div className="mt2-trx-meta">
                        <span className="mt2-trx-who">{t('panels.trx.mock.clientLabel')}</span>
                        <span className="mt2-trx-idx">1</span>
                      </div>
                      <p className="mt2-trx-text">{t('panels.trx.mock.line1a')}</p>
                    </div>
                  </div>
                  <div className="mt2-trx-row">
                    <span className="mt2-avatar is-c">{t('panels.trx.mock.counselorLabel').charAt(0)}</span>
                    <div>
                      <div className="mt2-trx-meta">
                        <span className="mt2-trx-who">{t('panels.trx.mock.counselorLabel')}</span>
                        <span className="mt2-trx-idx">2</span>
                      </div>
                      <p className="mt2-trx-text">{t('panels.trx.mock.line2c')}</p>
                    </div>
                  </div>
                  <div className="mt2-trx-row">
                    <span className="mt2-avatar is-a">A</span>
                    <div>
                      <div className="mt2-trx-meta">
                        <span className="mt2-trx-who">{t('panels.trx.mock.clientLabel')}</span>
                        <span className="mt2-trx-idx">2</span>
                      </div>
                      <p className="mt2-trx-text">{t('panels.trx.mock.line2a')} <span className="mt2-cue">{t('panels.trx.mock.cue1')}</span> <span className="mt2-cue">{t('panels.trx.mock.cue2')}</span></p>
                    </div>
                  </div>
                  <div className="mt2-trx-row">
                    <span className="mt2-avatar is-c">{t('panels.trx.mock.counselorLabel').charAt(0)}</span>
                    <div>
                      <div className="mt2-trx-meta">
                        <span className="mt2-trx-who">{t('panels.trx.mock.counselorLabel')}</span>
                        <span className="mt2-trx-idx">3</span>
                      </div>
                      <p className="mt2-trx-text">{t('panels.trx.mock.line3c')}</p>
                    </div>
                  </div>
                  <div className="mt2-trx-row">
                    <span className="mt2-avatar is-a">A</span>
                    <div>
                      <div className="mt2-trx-meta">
                        <span className="mt2-trx-who">{t('panels.trx.mock.clientLabel')}</span>
                        <span className="mt2-trx-idx">3</span>
                      </div>
                      <p className="mt2-trx-text">{t('panels.trx.mock.line3a')} <span className="mt2-cue">{t('panels.trx.mock.cue3')}</span> <span className="mt2-cue">{t('panels.trx.mock.cue4')}</span></p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt2-player">
                <span className="mt2-player-time">02:14</span>
                <div className="mt2-player-ctrls">
                  <button className="mt2-player-btn" type="button" aria-label="rewind">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4 L5 8 L11 12 Z"/></svg>
                  </button>
                  <button className="mt2-player-btn play" type="button" aria-label="play">
                    <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2 L10 6 L3 10 Z"/></svg>
                  </button>
                  <button className="mt2-player-btn" type="button" aria-label="forward">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4 L11 8 L5 12 Z"/></svg>
                  </button>
                </div>
                <span className="mt2-player-speed">1×</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="feat-panel" role="tabpanel" data-panel="note" data-active="false">
        <button type="button" className="feat-acc-trigger" aria-expanded="false">
          <span className="feat-acc-num">{t('panels.note.accNum')}</span>
          <span className="feat-acc-label">{t('panels.note.accLabel')}</span>
          <span className="feat-acc-icon">+</span>
        </button>
        <div className="feat-acc-body">
          <div className="feat-copy">
            <span className="feat-cat">{t('panels.note.cat')}</span>
            <h3 className="feat-msg">{t('panels.note.msg')}</h3>
            <div className="feat-when">{t('panels.note.when')}</div>
            <p className="feat-desc">{t('panels.note.desc')}</p>
            <div className="feat-pain-row">
              <span className="feat-pain-lbl">{t('panels.note.painLbl')}</span>
              <div className="feat-pain-tags">
                <span className="pain-tag">{t('panels.note.painTag')}</span>
              </div>
            </div>
          </div>
          <div className="feat-mock" aria-hidden="true">
            <div className="pf-titlebar">
              <span className="pf-dots"><span></span><span></span><span></span></span>
              <span className="pf-app">{t('panels.note.mock.appTitle')}</span>
              <span className="pf-status"><span className="pulse"></span>{t('panels.note.mock.statusLabel')}</span>
            </div>

            <div className="pf-body note-fanout">
              <div className="note-source">
                <div className="note-source-card">
                  <span className="note-source-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="3" width="6" height="12" rx="3"/>
                      <path d="M5 11 V13 A7 7 0 0 0 19 13 V11"/>
                      <line x1="12" y1="20" x2="12" y2="23"/>
                      <line x1="9" y1="23" x2="15" y2="23"/>
                    </svg>
                  </span>
                  <div className="note-source-meta">
                    <span className="note-source-name">{t('panels.note.mock.sourceCardName')}</span>
                    <span className="note-source-sub">{t('panels.note.mock.sourceCardSub')}</span>
                  </div>
                </div>
                <div className="note-source-tags">
                  <span>{t('panels.note.mock.sourceTag1')}</span>
                  <span>{t('panels.note.mock.sourceTag2')}</span>
                </div>
              </div>

              <svg className="note-fanout-svg" viewBox="0 0 100 220" preserveAspectRatio="none" aria-hidden="true">
                <line className="note-fanout-trunk" x1="0" y1="92" x2="30" y2="92"/>
                <path d="M 30 92 C 60 92, 80 80, 100 80"/>
                <path d="M 30 92 C 60 92, 80 137, 100 137"/>
                <path d="M 30 92 C 60 92, 80 196, 100 196"/>
                <path className="is-active" d="M 30 92 C 60 92, 80 24, 100 24"/>
                <circle className="note-fanout-junction" cx="30" cy="92" r="3.5"/>
              </svg>

              <ul className="note-results">
                <li className="note-doc is-active">
                  <span className="note-doc-tag is-selected">{t('panels.note.mock.doc1TagSelected')}</span>
                  <div className="note-doc-text">
                    <span className="note-doc-name">{t('panels.note.mock.doc1Name')}</span>
                    <span className="note-doc-purpose">{t('panels.note.mock.doc1Purpose')}</span>
                  </div>
                </li>
                <li className="note-doc">
                  <span className="note-doc-tag">{t('panels.note.mock.doc2Tag')}</span>
                  <div className="note-doc-text">
                    <span className="note-doc-name">{t('panels.note.mock.doc2Name')}</span>
                    <span className="note-doc-purpose">{t('panels.note.mock.doc2Purpose')}</span>
                  </div>
                </li>
                <li className="note-doc">
                  <span className="note-doc-tag">{t('panels.note.mock.doc3Tag')}</span>
                  <div className="note-doc-text">
                    <span className="note-doc-name">{t('panels.note.mock.doc3Name')}</span>
                    <span className="note-doc-purpose">{t('panels.note.mock.doc3Purpose')}</span>
                  </div>
                </li>
                <li className="note-doc">
                  <span className="note-doc-tag">{t('panels.note.mock.doc4Tag')}</span>
                  <div className="note-doc-text">
                    <span className="note-doc-name">{t('panels.note.mock.doc4Name')}</span>
                    <span className="note-doc-purpose">{t('panels.note.mock.doc4Purpose')}</span>
                  </div>
                </li>
              </ul>
            </div>


            <div className="note-preview">
              <div className="note-preview-tabs">
                <span className="note-preview-tab">{t('panels.note.mock.previewTab1')}</span>
                <span className="note-preview-tab is-active">{t('panels.note.mock.previewTab2')}</span>
                <span className="note-preview-tab">{t('panels.note.mock.previewTab3')}</span>
                <span className="note-preview-tab">{t('panels.note.mock.previewTab4')}</span>
                <span className="note-preview-tab">{t('panels.note.mock.previewTab5')}</span>
                <span className="note-preview-tab is-add">+</span>
              </div>
              <div className="note-preview-doc">
                <div className="note-preview-section">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec1H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec1Body')}</p>
                </div>
                <div className="note-preview-section">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec2H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec2Body')}</p>
                </div>
                <div className="note-preview-section">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec3H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec3Body')}</p>
                </div>
                <div className="note-preview-section is-highlight">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec4H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec4Body').split(t('panels.note.mock.sec4Mark'))[0]}<span className="note-preview-mark">{t('panels.note.mock.sec4Mark')}</span>{t('panels.note.mock.sec4Body').split(t('panels.note.mock.sec4Mark'))[1]}</p>
                </div>
                <div className="note-preview-section">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec5H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec5Body')}</p>
                </div>
                <div className="note-preview-section">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec6H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec6Body')}</p>
                </div>
                <div className="note-preview-section">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec7H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec7Body')}</p>
                </div>
                <div className="note-preview-section">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec8H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec8Body')}</p>
                </div>
                <div className="note-preview-section">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec9H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec9Body')}</p>
                </div>
                <div className="note-preview-section">
                  <span className="note-preview-section-h">{t('panels.note.mock.sec10H')}</span>
                  <p className="note-preview-section-body">{t('panels.note.mock.sec10Body')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="feat-panel" role="tabpanel" data-panel="cnc" data-active="false">
        <button type="button" className="feat-acc-trigger" aria-expanded="false">
          <span className="feat-acc-num">{t('panels.cnc.accNum')}</span>
          <span className="feat-acc-label">{t('panels.cnc.accLabel')}</span>
          <span className="feat-acc-icon">+</span>
        </button>
        <div className="feat-acc-body">
          <div className="feat-copy">
            <span className="feat-cat">{t('panels.cnc.cat')}</span>
            <h3 className="feat-msg">{t('panels.cnc.msg')}</h3>
            <div className="feat-when">{t('panels.cnc.when')}</div>
            <p className="feat-desc">{t('panels.cnc.desc')}</p>
            <div className="feat-pain-row">
              <span className="feat-pain-lbl">{t('panels.cnc.painLbl')}</span>
              <div className="feat-pain-tags">
                <span className="pain-tag">{t('panels.cnc.painTag')}</span>
              </div>
            </div>
          </div>
          <div className="feat-mock" aria-hidden="true">
            <div className="pf-titlebar">
              <span className="pf-dots"><span></span><span></span><span></span></span>
              <span className="pf-app">{t('panels.cnc.mock.appTitle')}</span>
              <span className="pf-status"><span className="pulse"></span>{t('panels.cnc.mock.statusLabel')}</span>
            </div>

            <div className="pf-body cnc-result-only">
              <div className="pf-cell result mock-psy-result cnc-result-card">
                <ul className="cnc-theory-tabs">
                  <li className="cnc-theory-tab is-active">{t('panels.cnc.mock.tab1')}</li>
                  <li className="cnc-theory-tab">{t('panels.cnc.mock.tab2')}</li>
                  <li className="cnc-theory-tab">{t('panels.cnc.mock.tab3')}</li>
                  <li className="cnc-theory-tab">{t('panels.cnc.mock.tab4')}</li>
                  <li className="cnc-theory-tab">{t('panels.cnc.mock.tab5')}</li>
                </ul>

                <div className="cnc-doc-fade">
                  <div className="cnc-doc-section">
                    <span className="cnc-doc-section-h">{t('panels.cnc.mock.overviewH')}</span>
                    <p className="cnc-doc-section-body">{t('panels.cnc.mock.overviewBody')}</p>
                  </div>
                  <div className="cnc-doc-section">
                    <span className="cnc-doc-section-h">{t('panels.cnc.mock.bgH')}</span>
                    <p className="cnc-doc-section-body">{t('panels.cnc.mock.bgBody')}</p>
                  </div>
                  <div className="cnc-doc-section">
                    <span className="cnc-doc-section-h">{t('panels.cnc.mock.cncH')}</span>
                    <p className="cnc-doc-section-body">{t('panels.cnc.mock.cncBody')}</p>
                  </div>
                  <div className="cnc-doc-section">
                    <span className="cnc-doc-section-h">{t('panels.cnc.mock.maintainH')}</span>
                    <p className="cnc-doc-section-body">{t('panels.cnc.mock.maintainBody')}</p>
                  </div>

                  <div className="cnc-doc-cite">
                    <span className="cnc-doc-cite-h">{t('panels.cnc.mock.citeH')}</span>
                    <p className="cnc-doc-cite-body">{t('panels.cnc.mock.citeBody')}</p>
                    <ul className="cnc-doc-cite-points">
                      <li>{t('panels.cnc.mock.citePoint1')}</li>
                      <li>{t('panels.cnc.mock.citePoint2')}</li>
                    </ul>
                  </div>

                  <div className="cnc-doc-section">
                    <span className="cnc-doc-section-h">{t('panels.cnc.mock.evidenceH')}</span>
                    <p className="cnc-doc-section-body">{t('panels.cnc.mock.evidenceBody')}</p>
                  </div>
                  <div className="cnc-doc-section">
                    <span className="cnc-doc-section-h">{t('panels.cnc.mock.emotionH')}</span>
                    <p className="cnc-doc-section-body">{t('panels.cnc.mock.emotionBody')}</p>
                  </div>
                  <div className="cnc-doc-section">
                    <span className="cnc-doc-section-h">{t('panels.cnc.mock.focusH')}</span>
                    <p className="cnc-doc-section-body">{t('panels.cnc.mock.focusBody')}</p>
                  </div>
                  <div className="cnc-doc-section">
                    <span className="cnc-doc-section-h">{t('panels.cnc.mock.nextQH')}</span>
                    <p className="cnc-doc-section-body">{t('panels.cnc.mock.nextQBody')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="feat-panel" role="tabpanel" data-panel="geno" data-active="false">
        <button type="button" className="feat-acc-trigger" aria-expanded="false">
          <span className="feat-acc-num">{t('panels.geno.accNum')}</span>
          <span className="feat-acc-label">{t('panels.geno.accLabel')}</span>
          <span className="feat-acc-icon">+</span>
        </button>
        <div className="feat-acc-body">
          <div className="feat-copy">
            <span className="feat-cat">{t('panels.geno.cat')}</span>
            <h3 className="feat-msg">{t('panels.geno.msg')}</h3>
            <div className="feat-when">{t('panels.geno.when')}</div>
            <p className="feat-desc">{t('panels.geno.desc')}</p>
            <div className="feat-pain-row">
              <span className="feat-pain-lbl">{t('panels.geno.painLbl')}</span>
              <div className="feat-pain-tags">
                <span className="pain-tag">{t('panels.geno.painTag')}</span>
              </div>
            </div>
          </div>
          <div className="feat-mock pf-geno2" aria-hidden="true">

            <div className="pf-geno2-topbar">
              <ul className="pf-geno2-tabs" role="list">
                <li className="pf-geno2-tab"><span className="pf-geno2-tab-icon">{t('panels.geno.mock.tab1Name').charAt(0)}</span>{t('panels.geno.mock.tab1Name')}<span className="pf-geno2-tab-ver">{t('panels.geno.mock.tab1Sessions')}</span></li>
                <li className="pf-geno2-tab">{t('panels.geno.mock.tab2')}</li>
                <li className="pf-geno2-tab is-active">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 2 H10 L13 5 V14 H3.5 z"/>
                    <path d="M10 2 V5 H13"/>
                    <line x1="6" y1="9" x2="11" y2="9"/>
                    <line x1="6" y1="11.5" x2="10" y2="11.5"/>
                  </svg>
                  {t('panels.geno.mock.tab3')}
                </li>
              </ul>
              <div className="pf-geno2-status">
                <span className="pf-geno2-saved">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5 L6 10.5 L11 4.5"/></svg>
                  {t('panels.geno.mock.savedLabel')}
                </span>
                <span className="pf-geno2-icons">
                  <span className="pf-geno2-icon-btn" aria-label="undo"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8 H10 a3 3 0 0 1 0 6 H6"/><path d="M5 5 L2 8 L5 11"/></svg></span>
                  <span className="pf-geno2-icon-btn" aria-label="redo"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 8 H6 a3 3 0 0 0 0 6 H10"/><path d="M11 5 L14 8 L11 11"/></svg></span>
                  <span className="pf-geno2-icon-btn" aria-label="download"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2 V11"/><path d="M5 8 L8 11 L11 8"/><line x1="3" y1="13.5" x2="13" y2="13.5"/></svg></span>
                  <span className="pf-geno2-icon-btn" aria-label="save"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3 H11 L13 5 V13 H3 z"/><rect x="5" y="3" width="6" height="3.5"/><rect x="5.5" y="9" width="5" height="3"/></svg></span>
                  <span className="pf-geno2-icon-btn" aria-label="more">⋮</span>
                </span>
              </div>
            </div>

            <div className="pf-geno2-canvas">
              <Image className="pf-geno2-image" src={geno.src} alt={t('panels.geno.mock.genoAlt')} width={geno.width} height={geno.height} sizes="(max-width: 768px) 100vw, 50vw" />


              <div className="pf-geno2-toolbar">
                <span className="pf-geno2-tool is-active" title="select"><svg viewBox="0 0 14 14" fill="currentColor"><path d="M3 1 L11 7.5 L6.5 8.5 L4.5 12 z"/></svg></span>
                <span className="pf-geno2-tool" title="move"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/><polyline points="5 4 7 2 9 4"/><polyline points="5 10 7 12 9 10"/><polyline points="4 5 2 7 4 9"/><polyline points="10 5 12 7 10 9"/></svg></span>
                <span className="pf-geno2-tool" title="text"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3 H11"/><path d="M7 3 V12"/></svg></span>
                <span className="pf-geno2-tool" title="tag"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2 H7 L12 7 L7 12 L2 7 z"/><circle cx="4.5" cy="4.5" r="1"/></svg></span>
              </div>


              <div className="pf-geno2-zoom">
                <span className="pf-geno2-zoom-btn"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="2.5" x2="6" y2="9.5"/><line x1="2.5" y1="6" x2="9.5" y2="6"/></svg></span>
                <span className="pf-geno2-zoom-btn"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2.5" y1="6" x2="9.5" y2="6"/></svg></span>
              </div>


              <span className="pf-geno2-insight">
                <span className="pf-geno2-insight-dot" aria-hidden="true"></span>
                {t('panels.geno.mock.insightLabel')}
              </span>
            </div>
          </div>
        </div>
      </div>


      <div className="feat-panel" role="tabpanel" data-panel="psy" data-active="true">
        <button type="button" className="feat-acc-trigger" aria-expanded="true">
          <span className="feat-acc-num">{t('panels.psy.accNum')}</span>
          <span className="feat-acc-label">{t('panels.psy.accLabel')}</span>
          <span className="feat-acc-icon">−</span>
        </button>
        <div className="feat-acc-body">
          <div className="feat-copy">
            <span className="feat-cat"><span className="feat-cat-new">{t('panels.psy.catNew')}</span>{t('panels.psy.cat')}</span>
            <h3 className="feat-msg">{t('panels.psy.msg')}</h3>
            <div className="feat-when">{t('panels.psy.when')}</div>
            <p className="feat-desc">{t('panels.psy.desc')}</p>
            <div className="feat-pain-row">
              <span className="feat-pain-lbl">{t('panels.psy.painLbl')}</span>
              <div className="feat-pain-tags">
                <span className="pain-tag">{t('panels.psy.painTag')}</span>
              </div>
            </div>
          </div>
          <div className="feat-mock" aria-hidden="true">
            <div className="pf-titlebar">
              <span className="pf-dots"><span></span><span></span><span></span></span>
              <span className="pf-app">{t('panels.psy.mock.appTitle')}</span>
              <span className="pf-status"><span className="pulse"></span>{t('panels.psy.mock.statusLabel')}</span>
            </div>

            <div className="pf-body psy-chat-shell">
              {/* client header */}
              <div className="psy-client">
                <div className="psy-client-id">
                  <span className="psy-client-avatar">{t('panels.psy.mock.clientName').charAt(0)}</span>
                  <div className="psy-client-meta">
                    <span className="psy-client-name">{t('panels.psy.mock.clientName')}</span>
                    <span className="psy-client-sub">{t('panels.psy.mock.clientSub')}</span>
                  </div>
                </div>
                <span className="psy-client-badge">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 1.5 H3.5 A1 1 0 0 0 2.5 2.5 V11.5 A1 1 0 0 0 3.5 12.5 H10.5 A1 1 0 0 0 11.5 11.5 V5 Z"/>
                    <path d="M8 1.5 V5 H11.5"/>
                  </svg>
                  {t('panels.psy.mock.badgeLabel')}
                </span>
              </div>

              {/* session keywords */}
              <div className="psy-keywords">
                <span className="psy-keywords-lbl">{t('panels.psy.mock.keywordsLbl')}</span>
                <span className="psy-kw">{t('panels.psy.mock.kw1')}</span>
                <span className="psy-kw">{t('panels.psy.mock.kw2')}</span>
                <span className="psy-kw">{t('panels.psy.mock.kw3')}</span>
              </div>

              {/* conversation thread */}
              <div className="psy-thread">
                <div className="psy-msg-user">
                  <p className="psy-bubble">{t('panels.psy.mock.userMsg')}</p>
                </div>

                <div className="psy-msg-ai">
                  <p className="psy-ai-text">{t('panels.psy.mock.aiText1')}</p>
                  <ul className="psy-scale-list">
                    <li><strong>{t('panels.psy.mock.scaleHarm')}</strong> — {t('panels.psy.mock.scaleHarmDetail')}</li>
                    <li><strong>{t('panels.psy.mock.scaleSelf')}</strong> — {t('panels.psy.mock.scaleSelfDetail')}</li>
                    <li><strong>{t('panels.psy.mock.scaleSocial')}</strong> — {t('panels.psy.mock.scaleSocialDetail')}</li>
                  </ul>
                  <p className="psy-ai-text">{t('panels.psy.mock.aiText2')}</p>
                  <div className="psy-flag">
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1.8 L12.8 12 H1.2 Z"/><line x1="7" y1="5.6" x2="7" y2="8.6"/><line x1="7" y1="10.4" x2="7" y2="10.5"/></svg>
                    <p><strong>{t('panels.psy.mock.flagTitle')}</strong> — {t('panels.psy.mock.flagBody')}</p>
                  </div>

                  <div className="psy-ai-actions">
                    <span className="psy-ai-act">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4.2" y="4.2" width="7" height="8" rx="1.3"/><path d="M2.5 9 V2.8 A1.3 1.3 0 0 1 3.8 1.5 H8.5"/></svg>
                    </span>
                    <span className="psy-ai-act is-active">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.2 6.6 V12 H2.6 A0.6 0.6 0 0 1 2 11.4 V7.2 A0.6 0.6 0 0 1 2.6 6.6 Z"/><path d="M4.2 6.6 L6.7 1.7 A0.3 0.3 0 0 1 7.2 1.9 V5 H10.6 A1 1 0 0 1 11.55 6.3 L10.6 11 A1 1 0 0 1 9.6 12 H4.2"/></svg>
                    </span>
                    <span className="psy-ai-act">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.8 7.4 V2 H11.4 A0.6 0.6 0 0 1 12 2.6 V6.8 A0.6 0.6 0 0 1 11.4 7.4 Z"/><path d="M9.8 7.4 L7.3 12.3 A0.3 0.3 0 0 1 6.8 12.1 V9 H3.4 A1 1 0 0 1 2.45 7.7 L3.4 3 A1 1 0 0 1 4.4 2 H9.8"/></svg>
                    </span>
                    <span className="psy-ai-act">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.6 4.4 A5 5 0 1 0 12.1 7.2"/><path d="M11.9 1.6 V4.4 H9.1"/></svg>
                    </span>
                  </div>

                  <span className="psy-ai-logo">
                    <svg viewBox="0 0 125 125" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2688 105.46C17.2079 105.46 17.1558 105.46 17.095 105.46C11.8723 105.364 7.71853 101.046 7.81412 95.8128L8.76132 44.1022C8.79608 29.1698 18.3203 19.5312 33.0323 19.5312C42.4609 19.5312 48.2137 23.5451 51.3768 26.906C56.5213 32.3653 58.1289 39.4701 57.929 44.4244V81.159C57.8595 82.3257 58.2332 84.4415 59.2412 85.5124C59.4758 85.7562 60.1884 86.5137 62.6564 86.5137C64.0467 86.5137 68.5655 86.0697 68.9566 80.3928V63.8583C68.9218 61.2027 69.3476 52.6176 75.8738 45.9481C78.9066 42.8397 84.3551 39.1393 93.0712 39.1393C101.787 39.1393 107.236 42.8397 110.269 45.9481C116.795 52.6176 117.221 61.194 117.186 63.8583V80.6714C117.186 85.9043 112.954 90.1445 107.731 90.1445C102.508 90.1445 98.2764 85.9043 98.2764 80.6714V63.5797C98.3025 62.4303 97.8506 60.3146 96.7644 59.2088C96.495 58.9302 95.6782 58.0943 93.0799 58.0943C90.4816 58.0943 89.6647 58.9302 89.3953 59.2088C88.3091 60.3146 87.8572 62.4303 87.8833 63.5797V63.7799L87.8746 81.159C87.2489 93.2355 78.3939 105.46 62.6737 105.46C53.923 105.46 48.5352 101.707 45.5459 98.5641C39.2196 91.8859 38.9241 83.3531 39.0284 80.4711L39.0458 43.6495C39.0718 43.1009 38.7764 41.1158 37.6293 39.9055C37.2991 39.5572 36.2824 38.4863 33.041 38.4863C30.2863 38.4863 27.6793 38.4863 27.6793 44.2067V44.3809L26.7321 96.1697C26.6365 101.342 22.4219 105.469 17.2775 105.469L17.2688 105.46Z" fill="var(--brand)"/></svg>
                  </span>
                </div>
              </div>

              {/* input area */}
              <div className="psy-input">
                <span className="psy-input-shield">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1.6 L11.4 3.1 V7 C11.4 9.6 9.4 11.5 7 12.4 C4.6 11.5 2.6 9.6 2.6 7 V3.1 Z"/></svg>
                </span>
                <span className="psy-input-ph">{t('panels.psy.mock.inputPh')}</span>
                <span className="psy-input-send">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7 L12 2.2 L8.4 12 L7 8 Z"/></svg>
                </span>
              </div>

              <p className="psy-disclaimer">{t('panels.psy.mock.disclaimer')}</p>
            </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</section>
  );
}

