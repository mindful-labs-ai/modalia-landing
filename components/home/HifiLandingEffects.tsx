'use client';

import { useEffect } from 'react';

/**
 * Micro client component responsible only for async interaction effects in HifiLanding.
 * - sessionStorage dismiss handling for the bottom mobile sticky CTA (.promo-bottom)
 * - Fade-up IntersectionObserver for §02 TrustEncryptSection / §03 PainSection
 *
 * Keeping this separate allows HifiLanding itself to remain a Server Component,
 * improving SSR markup exposure and static prerender efficiency.
 */
export function HifiLandingEffects() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* Bottom mobile sticky CTA dismiss — sessionStorage one-time close */
    {
      const KEY = 'mt-promo-1month-dismissed';
      const html = document.documentElement;
      const bottom = document.querySelector<HTMLElement>('[data-promo-bottom]');
      const isDismissed = (): boolean => {
        try {
          return sessionStorage.getItem(KEY) === '1';
        } catch {
          return false;
        }
      };
      const applyBottomState = (dismissed: boolean): void => {
        if (dismissed) {
          if (bottom) bottom.style.display = 'none';
          html.classList.remove('has-promo-bottom');
        } else {
          html.classList.add('has-promo-bottom');
        }
      };
      applyBottomState(isDismissed());
      if (bottom) {
        bottom
          .querySelectorAll<HTMLElement>('[data-promo-close]')
          .forEach((btn) => {
            const handler = () => {
              try {
                sessionStorage.setItem(KEY, '1');
              } catch {}
              applyBottomState(true);
            };
            btn.addEventListener('click', handler);
            cleanups.push(() => btn.removeEventListener('click', handler));
          });
      }
    }

    /* §02 / §03 fade-up — targets span two sibling sections, so handled here in the parent. */
    const fadeUpGroups: Array<{
      sel: string;
      cls: string;
      threshold: number;
      rootMargin: string;
    }> = [
      {
        sel: '.trust-team, .trust-protect-3 .trust-protect-item',
        cls: 'trust-rise',
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px',
      },
      {
        sel: '.pain-scenes .pain-scene',
        cls: 'pain-rise',
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px',
      },
    ];
    for (const g of fadeUpGroups) {
      const targets = document.querySelectorAll<HTMLElement>(g.sel);
      if (!targets.length) continue;
      targets.forEach((el) => el.classList.add(g.cls));
      const prefersReduced = matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (prefersReduced || !('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-in-view'));
        continue;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add('is-in-view');
              io.unobserve(e.target);
            }
          });
        },
        { threshold: g.threshold, rootMargin: g.rootMargin },
      );
      targets.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
