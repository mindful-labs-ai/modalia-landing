'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/constants/site';

type Row = { label: string; type: string; value?: string };
type CaseEntry = { name: string; rows: Row[] };

export function SampleExperienceSection() {
  const t = useTranslations('sample');

  // Translated case data, memoized so the effect can depend on it directly
  // (re-runs only when the locale — and thus the text — changes).
  const caseData = useMemo<Record<string, CaseEntry>>(() => {
    const caseIds = ['01', '02', '03', '04', '05'] as const;
    return Object.fromEntries(
      caseIds.map((id) => {
        const rawRows = t.raw(`caseData.${id}.rows`) as Row[];
        return [id, { name: t(`caseData.${id}.name`), rows: rawRows }];
      }),
    );
  }, [t]);

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* === §05 sample-section scroll-in fades === */
    {
      const section = document.querySelector<HTMLElement>('.sample-section');
      const expCard = document.getElementById('sample-step-card');
      const isMobile = window.matchMedia('(max-width: 860px)').matches;
      if (section && isMobile) {
        /* on mobile disable scroll fade-in — set visible immediately */
        section.classList.add('is-in-view', 'exp-in-view');
      } else if (section && 'IntersectionObserver' in window) {
        const ioIntro = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              section.classList.add('is-in-view');
              ioIntro.unobserve(section);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -10% 0px' });
        ioIntro.observe(section);
        cleanups.push(() => ioIntro.disconnect());

        if (expCard) {
          const ioExp = new IntersectionObserver((entries) => {
            entries.forEach(e => {
              if (e.isIntersecting) {
                section.classList.add('exp-in-view');
                ioExp.unobserve(expCard);
              }
            });
          }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
          ioExp.observe(expCard);
          cleanups.push(() => ioExp.disconnect());
        }
      } else if (section) {
        section.classList.add('is-in-view', 'exp-in-view');
      }
    }

    /* === §05 sample step card === */
    {
      const card = document.getElementById('sample-step-card');
      if (card) {
        const slides = card.querySelectorAll<HTMLElement>('[data-step]');
        const dots = card.querySelectorAll<HTMLElement>('[data-dot]');
        const counter = card.querySelector<HTMLElement>('[data-step-counter]');
        const nextBtn = card.querySelector<HTMLElement>('[data-step-next]');
        const foot = card.querySelector<HTMLElement>('[data-step-foot]');
        if (foot) foot.style.display = 'none';
        let current = 1;
        const total = slides.length;
        let currentCase = '01';
        let genTimer: ReturnType<typeof setTimeout> | null = null;

        const escapeHtml = (s: string): string => String(s).replace(/[&<>"']/g, (ch) => {
          const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
          return map[ch];
        });

        const renderRowContent = (row: Row): string => {
          if (row.type === 'strong') return '<p class="sm-result-value sm-result-strong">' + escapeHtml(row.value || '') + '</p>';
          if (row.type === 'text') return '<p class="sm-result-value">' + escapeHtml(row.value || '') + '</p>';
          return '';
        };

        const renderResult = (): void => {
          const CASE_DATA = caseData;
          const d = CASE_DATA[currentCase] || CASE_DATA['01'];
          card.querySelectorAll<HTMLElement>('[data-sm-case-name]').forEach(el => { el.textContent = d.name; });
          const rowsContainer = card.querySelector('[data-sm-result-rows]');
          if (!rowsContainer || !d.rows) return;
          const html = d.rows.map(row =>
            '<div class="sm-result-row">' +
              '<span class="sm-result-label">' + escapeHtml(row.label) + '</span>' +
              renderRowContent(row) +
            '</div>'
          ).join('');
          rowsContainer.innerHTML = html;
        };

        const go = (n: number): void => {
          if (n < 1 || n > total) return;
          const prev = current;
          slides.forEach(sl => {
            const i = parseInt(sl.getAttribute('data-step') || '0', 10);
            sl.hidden = (i !== n);
            if (i === n) {
              sl.style.transform = (n > prev ? 'translateX(20px)' : 'translateX(-20px)');
              sl.style.opacity = '0';
              requestAnimationFrame(() => {
                sl.style.transform = 'translateX(0)';
                sl.style.opacity = '1';
              });
            }
          });
          dots.forEach(d => {
            const i = parseInt(d.getAttribute('data-dot') || '0', 10);
            d.classList.remove('active', 'done');
            if (i < n) d.classList.add('done');
            else if (i === n) d.classList.add('active');
          });
          if (counter) counter.textContent = 'Step ' + n + ' / ' + total;
          if (foot) foot.style.display = 'none';
          if (n === 3) renderResult();
          current = n;
          if (n === 2) {
            const stages = card.querySelectorAll<HTMLElement>('[data-stage]');
            const pills = card.querySelectorAll<HTMLElement>('[data-pill]');
            stages.forEach(s => s.removeAttribute('data-state'));
            pills.forEach(p => p.removeAttribute('data-state'));
            const stageDelay = 750;
            stages.forEach((s, idx) => {
              setTimeout(() => { if (current === 2) s.setAttribute('data-state', 'active'); }, stageDelay * idx + 250);
              setTimeout(() => { if (current === 2) s.setAttribute('data-state', 'done'); }, stageDelay * (idx + 1) + 250);
            });
            const pillDelay = 580;
            pills.forEach((p, idx) => {
              setTimeout(() => { if (current === 2) p.setAttribute('data-state', 'done'); }, pillDelay * idx + 600);
            });
            if (genTimer) clearTimeout(genTimer);
            genTimer = setTimeout(() => { if (current === 2) go(3); }, stageDelay * 4 + 1200);
          }
        };

        if (nextBtn) {
          const handler = (): void => go(current + 1);
          nextBtn.addEventListener('click', handler);
          cleanups.push(() => nextBtn.removeEventListener('click', handler));
        }
        const caseCards = card.querySelectorAll<HTMLElement>('[data-case-pick]');
        caseCards.forEach(c => {
          const handler = (): void => {
            const pick = c.getAttribute('data-case-pick');
            if (pick) currentCase = pick;
            caseCards.forEach(cc => cc.classList.toggle('is-selected', cc === c));
            go(2);
          };
          c.addEventListener('click', handler);
          cleanups.push(() => c.removeEventListener('click', handler));
        });
        card.querySelectorAll<HTMLElement>('[data-step-restart]').forEach(restart => {
          const handler = (): void => {
            caseCards.forEach(cc => cc.classList.remove('is-selected'));
            go(1);
          };
          restart.addEventListener('click', handler);
          cleanups.push(() => restart.removeEventListener('click', handler));
        });
        cleanups.push(() => { if (genTimer) clearTimeout(genTimer); });
      }
    }

    /* §05 slide-type pin transition — scroll-progress CSS variable driven.
       - --title-progress: 0 → 1 as slot1.bottom passes 1.2vh → 0.7vh
       - --card-enter: 0 → 1 as slot2.top passes 0.7vh → 0
       - --card-exit: 0 → 1 as slot2.top passes -0.4vh → -0.95vh
       Works identically on forward and backward scroll. */
    {
      const section = document.querySelector<HTMLElement>('.sample-section');
      const slot1 = document.querySelector<HTMLElement>('.sample-pin-slot--title');
      const slot2 = document.querySelector<HTMLElement>('.sample-pin-slot--card');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.matchMedia('(max-width: 860px)').matches;
      /* on mobile disable scroll-progress animation — lock CSS vars to static values */
      if (section && isMobile) {
        section.style.setProperty('--title-progress', '0');
        section.style.setProperty('--card-enter', '1');
        section.style.setProperty('--card-exit', '0');
      }
      if (section && slot1 && slot2 && !reduce && !isMobile) {
        let raf: number | null = null;
        const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
        const update = (): void => {
          const r1 = slot1.getBoundingClientRect();
          const r2 = slot2.getBoundingClientRect();
          const vh = window.innerHeight;
          const tStart = vh * 1.2;
          const tEnd = vh * 0.7;
          const titleProgress = clamp01((tStart - r1.bottom) / (tStart - tEnd));
          const enterStart = vh * 0.7;
          const enterEnd = 0;
          const cardEnter = clamp01((enterStart - r2.top) / (enterStart - enterEnd));
          const exitStart = -vh * 0.3;
          const exitEnd = -vh * 1.0;
          const cardExit = clamp01((exitStart - r2.top) / (exitStart - exitEnd));
          section.style.setProperty('--title-progress', titleProgress.toFixed(3));
          section.style.setProperty('--card-enter', cardEnter.toFixed(3));
          section.style.setProperty('--card-exit', cardExit.toFixed(3));
        };
        const handler = (): void => {
          if (raf !== null) return;
          raf = requestAnimationFrame(() => {
            raf = null;
            update();
          });
        };
        window.addEventListener('scroll', handler, { passive: true });
        window.addEventListener('resize', handler);
        update();
        cleanups.push(() => {
          window.removeEventListener('scroll', handler);
          window.removeEventListener('resize', handler);
          if (raf !== null) cancelAnimationFrame(raf);
        });
      }
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, [caseData]);

  return (
<section className="wf-section sample-section" data-funnel-section="sample">
  {/* Slide-type sequential pin pattern
     Two independent slots that pin to the viewport in sequence.
     - .sample-pin-slot: outer (200vh) — pin duration scroll distance
     - .sample-pin-frame: position: sticky; top: 0; height: 100vh — frame fixed to viewport
     Scroll → slot 1 frame sticky for 100vh → slot 1 ends, slot 2 enters → slot 2 frame sticky.
     Pure CSS sticky (overflow:hidden breaks sticky so removed from .sample-section).
  */}

  {/* SLOT 1 — title page */}
  <div className="sample-pin-slot sample-pin-slot--title">
    <div className="sample-pin-frame">
      <div className="container">
        <div className="sample-head">
          <h2 className="t-h2">{t.rich('slot1.heading', { br: () => <br /> })}</h2>
          <p className="sample-head-sub">{t('slot1.sub')}</p>
          <span className="sample-head-scroll" aria-hidden="true">
            <span className="sample-head-scroll-line"></span>
          </span>
        </div>
      </div>
    </div>
  </div>

  {/* SLOT 2 — demo UI page */}
  <div className="sample-pin-slot sample-pin-slot--card">
    <div className="sample-pin-frame">
      <div className="container">
        <div className="step-card" id="sample-step-card" data-collapsed="false">

      <div className="step-progress">
        <div className="step-dots" data-step-dots>
          <span className="step-dot active" data-dot="1"></span>
          <span className="step-dot-line"></span>
          <span className="step-dot" data-dot="2"></span>
          <span className="step-dot-line"></span>
          <span className="step-dot" data-dot="3"></span>
        </div>
        <span className="step-counter" data-step-counter>Step 1 / 3</span>
      </div>


      <div className="step-viewport">

        <div className="step-slide" data-step="1">
          <span className="step-label">{t('step1.label')}</span>
          <p className="step-lead">{t('step1.lead')}</p>

          <div className="sm-mock">
            <div className="sm-mock-head">
              <span className="pf-dots"><span></span><span></span><span></span></span>
              <span className="pf-app">{t('step1.mockAppTitle')}</span>
            </div>
            <div className="sm-mock-body">
              <div className="case-grid case-grid-5">
                <button type="button" className="case-card" data-case-pick="01">
                  <span className="cc-eyebrow">{t('step1.cases.01.eyebrow')}</span>
                  <span className="cc-cat">{t('step1.cases.01.cat')}</span>
                  <span className="cc-title">{t.rich('step1.cases.01.title', { br: () => <br /> })}</span>
                  <span className="cc-situ">{t('step1.cases.01.situ')}</span>
                  <div className="cc-tags">
                    <span className="cc-tag">{t('step1.cases.01.tag1')}</span>
                    <span className="cc-tag">{t('step1.cases.01.tag2')}</span>
                  </div>
                  <span className="cc-pick-link">{t('step1.cases.01.pickLink')}</span>
                </button>
                <button type="button" className="case-card" data-case-pick="02">
                  <span className="cc-eyebrow">{t('step1.cases.02.eyebrow')}</span>
                  <span className="cc-cat">{t('step1.cases.02.cat')}</span>
                  <span className="cc-title">{t.rich('step1.cases.02.title', { br: () => <br /> })}</span>
                  <span className="cc-situ">{t('step1.cases.02.situ')}</span>
                  <div className="cc-tags">
                    <span className="cc-tag">{t('step1.cases.02.tag1')}</span>
                    <span className="cc-tag">{t('step1.cases.02.tag2')}</span>
                  </div>
                  <span className="cc-pick-link">{t('step1.cases.02.pickLink')}</span>
                </button>
                <button type="button" className="case-card" data-case-pick="03">
                  <span className="cc-eyebrow">{t('step1.cases.03.eyebrow')}</span>
                  <span className="cc-cat">{t('step1.cases.03.cat')}</span>
                  <span className="cc-title">{t.rich('step1.cases.03.title', { br: () => <br /> })}</span>
                  <span className="cc-situ">{t('step1.cases.03.situ')}</span>
                  <div className="cc-tags">
                    <span className="cc-tag">{t('step1.cases.03.tag1')}</span>
                    <span className="cc-tag">{t('step1.cases.03.tag2')}</span>
                  </div>
                  <span className="cc-pick-link">{t('step1.cases.03.pickLink')}</span>
                </button>
                <button type="button" className="case-card" data-case-pick="04">
                  <span className="cc-eyebrow">{t('step1.cases.04.eyebrow')}</span>
                  <span className="cc-cat">{t('step1.cases.04.cat')}</span>
                  <span className="cc-title">{t.rich('step1.cases.04.title', { br: () => <br /> })}</span>
                  <span className="cc-situ">{t('step1.cases.04.situ')}</span>
                  <div className="cc-tags">
                    <span className="cc-tag">{t('step1.cases.04.tag1')}</span>
                    <span className="cc-tag">{t('step1.cases.04.tag2')}</span>
                  </div>
                  <span className="cc-pick-link">{t('step1.cases.04.pickLink')}</span>
                </button>
                <button type="button" className="case-card" data-case-pick="05">
                  <span className="cc-eyebrow">{t('step1.cases.05.eyebrow')}</span>
                  <span className="cc-cat">{t('step1.cases.05.cat')}</span>
                  <span className="cc-title">{t.rich('step1.cases.05.title', { br: () => <br /> })}</span>
                  <span className="cc-situ">{t('step1.cases.05.situ')}</span>
                  <div className="cc-tags">
                    <span className="cc-tag">{t('step1.cases.05.tag1')}</span>
                    <span className="cc-tag">{t('step1.cases.05.tag2')}</span>
                  </div>
                  <span className="cc-pick-link">{t('step1.cases.05.pickLink')}</span>
                </button>
              </div>
            </div>
          </div>
          <p className="step-sub step-foot">{t('step1.sub')}</p>
        </div>


        <div className="step-slide" data-step="2" hidden>
          <span className="step-label">{t('step2.label')}</span>
          <p className="step-lead-big">{t.rich('step2.lead', { br: () => <br /> })}</p>
          <p className="step-sub">{t('step2.sub')}</p>


          <div className="sm-mock sm-step2-mock sm-step2-mock--secure">
            <div className="sm-mock-head">
              <span className="pf-dots"><span></span><span></span><span></span></span>
              <span className="pf-app">{t('step2.mockAppTitle')}</span>
              <span className="pf-status"><span className="pulse"></span>{t('step2.mockStatusLabel')}</span>
            </div>
            <div className="sm-mock-body sm-step2-secure-body">
              <ol className="sm-step2-flow" data-flow-stages>
                <li className="sm-step2-stage" data-stage="1">
                  <span className="sm-step2-stage-num">{t('step2.stages.1.num')}</span>
                  <span className="sm-step2-stage-name">{t('step2.stages.1.name')}</span>
                  <span className="sm-step2-stage-desc">{t('step2.stages.1.desc')}</span>
                  <span className="sm-step2-stage-state" aria-hidden="true">
                    <span className="sm-step2-stage-spinner"></span>
                    <svg className="sm-step2-stage-check" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5 L 6 10.5 L 11 4.5"/></svg>
                  </span>
                </li>
                <span className="sm-step2-stage-arrow" aria-hidden="true"></span>
                <li className="sm-step2-stage" data-stage="2">
                  <span className="sm-step2-stage-num">{t('step2.stages.2.num')}</span>
                  <span className="sm-step2-stage-name">{t('step2.stages.2.name')}</span>
                  <span className="sm-step2-stage-desc">{t('step2.stages.2.desc')}</span>
                  <span className="sm-step2-stage-state" aria-hidden="true">
                    <span className="sm-step2-stage-spinner"></span>
                    <svg className="sm-step2-stage-check" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5 L 6 10.5 L 11 4.5"/></svg>
                  </span>
                </li>
                <span className="sm-step2-stage-arrow" aria-hidden="true"></span>
                <li className="sm-step2-stage" data-stage="3">
                  <span className="sm-step2-stage-num">{t('step2.stages.3.num')}</span>
                  <span className="sm-step2-stage-name">{t('step2.stages.3.name')}</span>
                  <span className="sm-step2-stage-desc">{t('step2.stages.3.desc')}</span>
                  <span className="sm-step2-stage-state" aria-hidden="true">
                    <span className="sm-step2-stage-spinner"></span>
                    <svg className="sm-step2-stage-check" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5 L 6 10.5 L 11 4.5"/></svg>
                  </span>
                </li>
                <span className="sm-step2-stage-arrow" aria-hidden="true"></span>
                <li className="sm-step2-stage" data-stage="4">
                  <span className="sm-step2-stage-num">{t('step2.stages.4.num')}</span>
                  <span className="sm-step2-stage-name">{t('step2.stages.4.name')}</span>
                  <span className="sm-step2-stage-desc">{t('step2.stages.4.desc')}</span>
                  <span className="sm-step2-stage-state" aria-hidden="true">
                    <span className="sm-step2-stage-spinner"></span>
                    <svg className="sm-step2-stage-check" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5 L 6 10.5 L 11 4.5"/></svg>
                  </span>
                </li>
              </ol>

              <ul className="sm-step2-pills" data-flow-pills>
                <li className="sm-step2-pill" data-pill="1">{t('step2.pills.1')}</li>
                <li className="sm-step2-pill" data-pill="2">{t('step2.pills.2')}</li>
                <li className="sm-step2-pill" data-pill="3">{t('step2.pills.3')}</li>
                <li className="sm-step2-pill" data-pill="4">{t('step2.pills.4')}</li>
                <li className="sm-step2-pill" data-pill="5">{t('step2.pills.5')}</li>
              </ul>
            </div>
          </div>
        </div>


        <div className="step-slide" data-step="3" hidden>
          <span className="step-label">{t('step3.label')}</span>
          <p className="step-lead-big">{t('step3.lead')}</p>

          <div className="sm-mock sm-mock-result">
            <div className="sm-mock-head">
              <span className="pf-dots"><span></span><span></span><span></span></span>
              <span className="pf-app">{t('step3.mockAppTitle')}</span>
              <span className="pf-status pf-status-done"><span className="check"></span>{t('step3.mockStatusDone')}</span>
            </div>

            <div className="sm-mock-body sm-result-body sm-result-body-fade">
              <p className="sm-result-context">{t('step3.selectedCasePrefix')}<strong data-sm-case-name>—</strong></p>
              <div data-sm-result-rows></div>
            </div>
          </div>

          <div className="sm-finish-cta-row">
            <a
              className="step-cta-primary step-cta-primary-anchor"
              href={SITE_CONFIG.appUrl}
              data-cta="signup"
              data-cta-intent="signup"
              data-cta-location="sample_experience"
              data-cta-label={t('step3.ctaLabel')}
            >
              <span className="step-cta-primary-label">{t('step3.ctaLabel')}</span>
              <span className="step-cta-primary-arrow" aria-hidden="true">{t('step3.ctaArrow')}</span>
            </a>
            <button type="button" className="step-secondary-link" data-step-restart>{t('step3.restartLabel')}</button>
          </div>
        </div>
      </div>


      <div className="step-foot" data-step-foot>
        <button type="button" className="step-next" data-step-next>{t('step3.ctaArrow')}</button>
      </div>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}
