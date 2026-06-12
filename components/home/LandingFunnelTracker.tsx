'use client';

import { useEffect, useRef } from 'react';
import { gtagEvent } from '@/lib/analytics';

/**
 * Landing funnel instrumentation — micro client component for HifiLanding only.
 *
 *  - S0   `landing_view`         : fired once on mount (landing arrival)
 *  - S0.1 `landing_section_view` : fired once per `[data-funnel-section]` on first exposure
 *  - S0.2 `landing_scroll_depth` : fired once each at 50% and 90% scroll depth
 *
 * GA4 enhanced measurement's default `scroll` event fires only at 90%, missing 50%,
 * so both thresholds are fired explicitly here. S0.3 (cta_click) is already
 * handled by CtaTracker and is not duplicated here.
 */
export function LandingFunnelTracker() {
  // Prevent duplicate firing on React strict-mode double-invoke / remount.
  const firedView = useRef(false);

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* ── S0. landing_view ─────────────────────────────────────────── */
    if (!firedView.current) {
      firedView.current = true;
      gtagEvent('landing_view', {
        page_path:
          typeof window !== 'undefined' ? window.location.pathname : '/',
      });
    }

    /* ── S0.1 landing_section_view ────────────────────────────────── */
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-funnel-section]'),
    );
    if (sections.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target as HTMLElement;
            const id = el.dataset.funnelSection ?? 'unknown';
            const index = sections.indexOf(el);
            gtagEvent('landing_section_view', {
              section_id: id,
              section_index: index >= 0 ? index : undefined,
            });
            io.unobserve(el); // once per section
          }
        },
        // Fire when the section is meaningfully in view (30%) — ignores fleeting exposures.
        { threshold: 0.3 },
      );
      sections.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    /* ── S0.2 landing_scroll_depth (50% / 90%) ────────────────────── */
    const thresholds = [50, 90] as const;
    const sent = new Set<number>();
    let ticking = false;
    const measure = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = (window.scrollY / scrollable) * 100;
      for (const t of thresholds) {
        if (pct >= t && !sent.has(t)) {
          sent.add(t);
          gtagEvent('landing_scroll_depth', { percent_scrolled: t });
        }
      }
      if (sent.size === thresholds.length) detach();
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    const detach = () => window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(detach);
    // Measure immediately once in case the initial viewport already exceeds 50% (short screens).
    requestAnimationFrame(measure);

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
