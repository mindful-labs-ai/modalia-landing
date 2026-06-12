'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface MetricCard {
  value: number;
  comma: boolean;
  unit: string;
  label: string;
}

interface Review {
  tag: string;
  title: string;
  text: string;
  authorName: string;
  authorRole: string;
  avatar: string;
}

export function MetricsSection() {
  const t = useTranslations('metrics');
  const cards = t.raw('cards') as MetricCard[];
  const reviews = t.raw('reviews') as Review[];

  useEffect(() => {
    const cleanups: Array<() => void> = [];
    let rafIds: number[] = [];

    /* === §08 metrics in-view + count-up (replays on every re-entry) === */
    {
      const strip = document.querySelector<HTMLElement>('.metrics-strip');
      if (strip) {
        const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

        type Target = { textNode: Text; value: number; hasComma: boolean; original: string };
        const valEls = Array.from(strip.querySelectorAll<HTMLElement>('.metric-val'));
        const targets: Target[] = [];
        valEls.forEach((el) => {
          const value = Number(el.dataset.count);
          if (!Number.isFinite(value)) return;
          const hasComma = el.dataset.comma === 'true';
          const original = hasComma ? value.toLocaleString('en-US') : String(value);
          let textNode = Array.from(el.childNodes).find(
            (n) => n.nodeType === Node.TEXT_NODE,
          ) as Text | undefined;
          if (!textNode) {
            textNode = document.createTextNode(original);
            el.insertBefore(textNode, el.firstChild);
          }
          targets.push({ textNode, value, hasComma, original });
        });

        const cancelRafs = () => {
          rafIds.forEach((id) => cancelAnimationFrame(id));
          rafIds = [];
        };

        const writeAll = (text: (t: Target) => string) => {
          targets.forEach((t) => { t.textNode.textContent = text(t); });
        };

        const resetToZero = () => {
          cancelRafs();
          writeAll((t) => (t.hasComma ? (0).toLocaleString('en-US') : '0'));
        };

        const restoreOriginals = () => {
          cancelRafs();
          writeAll((t) => t.original);
        };

        const startCountUp = () => {
          if (prefersReduced) {
            restoreOriginals();
            return;
          }
          cancelRafs();
          const duration = 1600;
          const stagger = 100;
          const ease = (p: number) => 1 - Math.pow(1 - p, 3);
          targets.forEach((t, i) => {
            const startAt = performance.now() + i * stagger;
            const tick = (now: number) => {
              if (now < startAt) {
                rafIds.push(requestAnimationFrame(tick));
                return;
              }
              const p = Math.min((now - startAt) / duration, 1);
              const current = Math.floor(t.value * ease(p));
              t.textNode.textContent = t.hasComma
                ? current.toLocaleString('en-US')
                : String(current);
              if (p < 1) {
                rafIds.push(requestAnimationFrame(tick));
              } else {
                t.textNode.textContent = t.original;
              }
            };
            rafIds.push(requestAnimationFrame(tick));
          });
        };

        let inView = false;
        const enter = () => {
          if (inView) return;
          inView = true;
          strip.classList.add('stats-in-view');
          startCountUp();
        };
        const leave = () => {
          if (!inView) return;
          inView = false;
          strip.classList.remove('stats-in-view');
          if (!prefersReduced) resetToZero();
        };

        const isStripVisible = () => {
          const r = strip.getBoundingClientRect();
          const vh = window.innerHeight || document.documentElement.clientHeight;
          const vw = window.innerWidth || document.documentElement.clientWidth;
          if (r.bottom <= 0 || r.top >= vh) return false;
          if (r.right <= 0 || r.left >= vw) return false;
          const visibleH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
          return visibleH / Math.max(r.height, 1) >= 0.2 || visibleH >= vh * 0.2;
        };

        if (prefersReduced || !('IntersectionObserver' in window)) {
          enter();
        } else {
          if (!prefersReduced) resetToZero();

          const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting && e.intersectionRatio >= 0.2) {
                enter();
              } else if (!e.isIntersecting) {
                leave();
              }
            });
          }, { threshold: [0, 0.2, 0.5] });
          io.observe(strip);
          cleanups.push(() => io.disconnect());

          /* Fallback — check visibility directly on next frame if IO callback is delayed */
          const fallbackId = window.setTimeout(() => {
            if (!inView && isStripVisible()) enter();
          }, 60);
          cleanups.push(() => window.clearTimeout(fallbackId));
        }
      }
    }

    return () => {
      cleanups.forEach((fn) => fn());
      rafIds.forEach((id) => cancelAnimationFrame(id));
    };
  }, []);

  return (
<section className="wf-section tone-dark" data-funnel-section="metrics">
  <div className="container">

    <div className="metrics-screen">
    <div className="metrics-strip" aria-label={t('ariaLabel')}>
      <div className="metrics-grid">
        {cards.map((card, i) => (
          <div key={i} className="metric-card">
            <div
              className="metric-val"
              data-count={card.value}
              data-comma={card.comma ? 'true' : 'false'}
            >
              {card.comma ? card.value.toLocaleString('en-US') : card.value}
              <span className="unit">{card.unit}</span>
            </div>
            <div className="metric-label">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
    </div>

    <div className="reviews-screen">

    <p className="tm-bridge">
      {t.rich('reviewsBridge', {
        br: () => <br />,
        mark: (chunks) => <span className="tm-bridge-mark">{chunks}</span>,
      })}
    </p>

    <div className="tm-section-label">{t('reviewsLabel')}</div>

    <div className="tm-stream" aria-label={t('reviewsLabel')}>
      <div className="tm-track">
        {reviews.map((review, i) => (
          <article key={i} className="tm-card">
            <span className="tm-reason">{review.tag}</span>
            <h3 className="tm-card-title">{review.title}</h3>
            <blockquote className="tm-text">{review.text}</blockquote>
            <div className="tm-author">
              <span className="tm-avatar">
                <Image src={review.avatar} alt="" width={400} height={400} loading="lazy" />
              </span>
              <div className="tm-who">
                <b>{review.authorName}</b>
                <span>{review.authorRole}</span>
              </div>
            </div>
          </article>
        ))}

        {/* Duplicate set for infinite-scroll illusion (aria-hidden) */}
        {reviews.map((review, i) => (
          <article key={`dup-${i}`} className="tm-card" aria-hidden="true">
            <span className="tm-reason">{review.tag}</span>
            <h3 className="tm-card-title">{review.title}</h3>
            <blockquote className="tm-text">{review.text}</blockquote>
            <div className="tm-author">
              <span className="tm-avatar">
                <Image src={review.avatar} alt="" width={400} height={400} loading="lazy" />
              </span>
              <div className="tm-who">
                <b>{review.authorName}</b>
                <span>{review.authorRole}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>

    </div>

  </div>
</section>
  );
}
