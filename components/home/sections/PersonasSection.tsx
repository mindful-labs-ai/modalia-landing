'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

const PERSONA_SRCS = [
  '/personas/persona-1-late-night-notes.webp',
  '/personas/persona-2-test-and-interview.webp',
  '/personas/persona-3-supervision-prep.webp',
  '/personas/persona-4-multi-format.webp',
  '/personas/persona-5-genogram.webp',
];

const INITIAL_SLOTS = [-2, -1, 0, 1, 2];

export function PersonasSection() {
  const t = useTranslations('personas');

  type PersonaItem = {
    cat: string;
    sceneLine1: string;
    sceneLine2: string;
    quote: string;
    desc: string;
    tag1: string;
    tag2: string;
  };

  const items = t.raw('items') as PersonaItem[];

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* === §06 persona rail === */
    {
      const root = document.querySelector<HTMLElement>('[data-persona-rail]');
      if (root) {
        const cards = Array.from(root.querySelectorAll<HTMLElement>('.persona-card'));
        const wrap = root.parentElement;
        const prevBtn = wrap ? wrap.querySelector<HTMLElement>('[data-persona-prev]') : null;
        const nextBtn = wrap ? wrap.querySelector<HTMLElement>('[data-persona-next]') : null;
        const dotsEl = wrap ? wrap.querySelector('[data-persona-dots]') : null;
        const counterEl = wrap ? wrap.querySelector<HTMLElement>('[data-persona-counter]') : null;
        const dots = dotsEl ? Array.from(dotsEl.querySelectorAll<HTMLElement>('.persona-rail-dot')) : [];
        const total = cards.length;
        if (total > 0) {
          let center = 0;
          for (let i = 0; i < total; i++) {
            if (cards[i].getAttribute('data-slot') === '0') { center = i; break; }
          }
          const half = Math.floor(total / 2);
          const render = (): void => {
            cards.forEach((card, i) => {
              let offset = i - center;
              while (offset > half) offset -= total;
              while (offset < -half) offset += total;
              card.setAttribute('data-slot', String(offset));
              card.setAttribute('aria-hidden', Math.abs(offset) > 1 ? 'true' : 'false');
            });
            for (let j = 0; j < dots.length; j++) {
              if (j === center) dots[j].setAttribute('aria-current', 'true');
              else dots[j].removeAttribute('aria-current');
            }
            if (counterEl) counterEl.innerHTML = '<strong>' + (center + 1) + '</strong>/' + total;
          };
          const go = (delta: number): void => {
            center = (center + delta + total) % total;
            render();
          };
          if (prevBtn) {
            const h = (): void => go(-1);
            prevBtn.addEventListener('click', h);
            cleanups.push(() => prevBtn.removeEventListener('click', h));
          }
          if (nextBtn) {
            const h = (): void => go(1);
            nextBtn.addEventListener('click', h);
            cleanups.push(() => nextBtn.removeEventListener('click', h));
          }
          root.setAttribute('tabindex', '0');
          const keyHandler = (e: KeyboardEvent): void => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
          };
          root.addEventListener('keydown', keyHandler);
          cleanups.push(() => root.removeEventListener('keydown', keyHandler));
          render();
        }
      }
    }

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, []);

  return (
    <section className="wf-section alt" data-funnel-section="personas">
      <div className="container">
        <div className="wf-marker">
          <span className="num">06</span>
          <span className="name">{t('markerName')}</span>
          <span className="purpose">{t('markerPurpose')}</span>
        </div>

        <div className="persona-head persona-head--lean">
          <h2 className="t-h2">
            {t('head.h2Line1')}
            <br />
            {t('head.h2Line2')}
          </h2>
        </div>

        <div className="persona-rail-wrap">
          <button
            type="button"
            className="persona-nav persona-nav-prev persona-nav-side"
            data-persona-prev
            aria-label={t('navPrev')}
          >
            ←
          </button>
          <button
            type="button"
            className="persona-nav persona-nav-next persona-nav-side"
            data-persona-next
            aria-label={t('navNext')}
          >
            →
          </button>

          <div className="persona-rail" data-persona-rail aria-label={t('railAriaLabel')}>
            {items.map((item, idx) => (
              <article key={PERSONA_SRCS[idx]} className="persona-card" data-slot={INITIAL_SLOTS[idx]}>
                <div className="persona-card-art" aria-hidden="true">
                  <Image
                    className="persona-card-art-img"
                    src={PERSONA_SRCS[idx]}
                    alt=""
                    aria-hidden="true"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 880px) 90vw, 360px"
                  />
                </div>
                <p className="persona-card-cat">{item.cat}</p>
                <h3 className="persona-card-scene">
                  {item.sceneLine1}
                  <br />
                  {item.sceneLine2}
                </h3>
                <blockquote className="persona-card-quote">{item.quote}</blockquote>
                <p className="persona-card-desc">{item.desc}</p>
                <ul className="persona-card-tags">
                  <li>{item.tag1}</li>
                  <li>{item.tag2}</li>
                </ul>
              </article>
            ))}
          </div>

          <div className="persona-rail-foot">
            <div className="persona-rail-counter" role="group" aria-label={t('counterAriaLabel')}>
              <ul className="persona-rail-dots" data-persona-dots>
                {items.map((_, idx) => (
                  <li key={PERSONA_SRCS[idx]} className="persona-rail-dot" />
                ))}
              </ul>
              <span className="persona-rail-counter-text" data-persona-counter aria-live="polite">
                <strong>1</strong>/{items.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
