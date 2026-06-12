'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * UTM Forwarder
 *
 * Passes ad campaign traffic through to the Modalia AI app signup flow without interruption.
 * Behaviour:
 *   1. Collects `utm_*` parameters from the page URL and persists them in sessionStorage
 *      so the first-landing UTMs are preserved across all subsequent pages in the same session.
 *   2. Injects the collected UTMs into the href of every `<a>` pointing at `app.mindthos.com`
 *      (existing query string is preserved; UTM keys are overwritten).
 *   3. Re-runs after each App Router client-side navigation (`pathname` dependency).
 *   4. Uses a MutationObserver to apply UTMs to links added dynamically after mount.
 */
const STORAGE_KEY = 'mt-utm-params';
const APP_HOST = 'app.mindthos.com';

const FORWARD_KEYS = new Set([
  /* Meta click ID — key signal for Meta attribution / Conversions API matching */
  'fbclid',
  /* Google click ID — Google Ads conversion matching signal (supplements the GA4 linker) */
  'gclid',
]);

function readUtmsFromUrl(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
      if (key.startsWith('utm_') || FORWARD_KEYS.has(key)) out[key] = value;
    });
  } catch {
    // ignore — return empty object on URL parse failure
  }
  return out;
}

function loadStoredUtms(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string>;
    }
  } catch {
    // ignore — discard corrupted cache
  }
  return {};
}

function persistUtms(utms: Record<string, string>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
  } catch {
    // ignore — quota exceeded or privacy mode
  }
}

function applyUtmsToLinks(utms: Record<string, string>): void {
  if (Object.keys(utms).length === 0) return;
  const links = document.querySelectorAll<HTMLAnchorElement>('a');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !href.includes(APP_HOST)) return;
    try {
      const targetUrl = new URL(
        href.startsWith('http') ? href : window.location.origin + href,
      );
      let mutated = false;
      Object.entries(utms).forEach(([key, value]) => {
        if (targetUrl.searchParams.get(key) !== value) {
          targetUrl.searchParams.set(key, value);
          mutated = true;
        }
      });
      if (mutated) link.setAttribute('href', targetUrl.toString());
    } catch {
      // malformed href — skip
    }
  });
}

export function UtmForwarder() {
  const pathname = usePathname();

  useEffect(() => {
    /* 1. Merge current URL UTMs with cached ones — URL takes precedence (refreshes on new campaign) */
    const merged: Record<string, string> = {
      ...loadStoredUtms(),
      ...readUtmsFromUrl(),
    };
    if (Object.keys(merged).length === 0) return;
    persistUtms(merged);

    /* 2. Apply immediately once */
    applyUtmsToLinks(merged);

    /* 3. Handle subsequent SPA renders / dynamic components — coalesce mutation bursts via rAF */
    let raf: number | null = null;
    const observer = new MutationObserver(() => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        applyUtmsToLinks(merged);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
