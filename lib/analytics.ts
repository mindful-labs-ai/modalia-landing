/**
 * Safe GA4 dataLayer push helper.
 *
 * The GA script in layout.tsx uses `strategy="afterInteractive"`, so `window.gtag`
 * may not yet be defined at component mount time. Installing a standard gtag shim
 * (`dataLayer.push`) in advance queues events fired before gtag.js loads and processes
 * them immediately after it does. (CTA click events from CtaTracker arrive after user
 * interaction so gtag is already loaded, but auto-events like landing_view/scroll need the queue.)
 */
export function gtagEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtagShim() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  window.gtag('event', name, params ?? {});
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
