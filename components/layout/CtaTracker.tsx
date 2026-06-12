'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG } from '@/constants/site';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const APP_HOST = 'app.mindthos.com';

/**
 * Google Ads signup-click conversion action. Set via env per Google Ads account;
 * if unset, the conversion event is skipped (no hardcoded account leaks into the build).
 */
const GOOGLE_ADS_SIGNUP_CONVERSION =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_CONVERSION || '';

interface CtaPayload {
  cta_intent: string;
  cta_location: string;
  cta_label: string;
  cta_destination: string;
  cta_tier?: string;
  page_path: string;
}

/**
 * Fires GA4 + Google Ads + Meta Pixel events for a CTA click.
 *
 * @param onSignupConversionDone used only for signup intent. Passed as the Google Ads
 *   conversion `event_callback`, called once the beacon is sent — lets the caller defer
 *   navigation to an external domain (app.mindthos.com) and avoid a race condition.
 */
function emit(payload: CtaPayload, onSignupConversionDone?: () => void): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'cta_click', payload);
    if (payload.cta_intent === 'signup') {
      /* Separate key event so GA4 conversions / Google Ads import can pick it up. */
      window.gtag('event', 'signup_click', payload);
      /* Google Ads conversion — event_callback prevents a race on external navigation. */
      if (GOOGLE_ADS_SIGNUP_CONVERSION) {
        window.gtag('event', 'conversion', {
          send_to: GOOGLE_ADS_SIGNUP_CONVERSION,
          ...(onSignupConversionDone
            ? { event_callback: onSignupConversionDone }
            : {}),
        });
      } else {
        onSignupConversionDone?.();
      }
    }
  } else {
    onSignupConversionDone?.();
  }
  if (typeof window.fbq === 'function' && payload.cta_intent === 'signup') {
    /* Meta Pixel standard event — used for Lead conversion optimization in Ads Manager. */
    window.fbq('track', 'Lead', {
      content_name: payload.cta_label,
      content_category: payload.cta_location,
    });
  }
}

/* Intercept plain left-clicks only — modifier / middle / right-click / new tab pass through. */
function isPlainLeftClick(e: MouseEvent, anchor: HTMLAnchorElement): boolean {
  if (e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (e.defaultPrevented) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  return true;
}

/**
 * CTA Tracker — a single delegated site-wide click listener.
 *
 * Intent resolution:
 *   1) the anchor's explicit `data-cta-intent` attribute
 *   2) fallback: href points at `app.mindthos.com` and is not /terms → 'signup'
 *
 * Navigation interception:
 *   For external signup links on a plain left-click, preventDefault and navigate after
 *   the Google Ads `event_callback` arrives (or a 500ms timeout). New tab / cmd-click /
 *   middle-click keep their native behavior — no race.
 */
export function CtaTracker() {
  const pathname = usePathname();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;

      const explicitIntent = anchor.dataset.ctaIntent;
      const href = anchor.getAttribute('href') ?? '';
      const autoSignup =
        !explicitIntent && href.includes(APP_HOST) && !href.includes('/terms');
      const intent = explicitIntent ?? (autoSignup ? 'signup' : null);
      if (!intent) return;

      const label =
        anchor.dataset.ctaLabel ??
        (anchor.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);

      const resolvedPath =
        pathname ??
        (typeof window !== 'undefined' ? window.location.pathname : '');

      const payload: CtaPayload = {
        cta_intent: intent,
        cta_location: anchor.dataset.ctaLocation ?? 'unknown',
        cta_label: label,
        cta_destination: anchor.href || href,
        page_path: resolvedPath,
      };
      if (anchor.dataset.ctaTier) payload.cta_tier = anchor.dataset.ctaTier;

      /*
       * Pre-launch: the global product isn't live, so every app-bound CTA opens
       * the waitlist modal instead of navigating to a dead destination. We still
       * fire the analytics beacon (cta_click / signup_click / Lead) for funnel
       * measurement, then preventDefault and broadcast `waitlist:open`.
       * /terms (legal pages) are excluded — they remain real links.
       * preventDefault on click also cancels modifier/new-tab navigation.
       */
      const destination = anchor.href || href;
      const isAppLink = destination.includes(APP_HOST);
      const isTerms = destination.includes('/terms');
      if (SITE_CONFIG.prelaunch && isAppLink && !isTerms) {
        e.preventDefault();
        emit(payload);
        window.dispatchEvent(
          new CustomEvent('waitlist:open', {
            detail: { location: payload.cta_location, label: payload.cta_label },
          }),
        );
        return;
      }

      const isExternalSignup =
        intent === 'signup' && anchor.href.includes(APP_HOST);
      const shouldDeferNav =
        isExternalSignup &&
        isPlainLeftClick(e, anchor) &&
        typeof window.gtag === 'function';

      if (shouldDeferNav) {
        e.preventDefault();
        const url = anchor.href;
        let navigated = false;
        const navigate = () => {
          if (navigated) return;
          navigated = true;
          window.location.href = url;
        };
        /* Failsafe — force navigation after 500ms if the callback never fires. */
        window.setTimeout(navigate, 500);
        emit(payload, navigate);
      } else {
        emit(payload);
      }
    }

    /*
     * Middle-click / mouse-back fire `auxclick`, not `click`, and would open the
     * dead app link in a new tab. In pre-launch, swallow them on app links so no
     * path reaches app.mindthos.com.
     */
    function onAuxClick(e: MouseEvent) {
      if (!SITE_CONFIG.prelaunch) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      const destination = anchor.href || anchor.getAttribute('href') || '';
      if (destination.includes(APP_HOST) && !destination.includes('/terms')) {
        e.preventDefault();
      }
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onAuxClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('auxclick', onAuxClick, true);
    };
  }, [pathname]);

  return null;
}
