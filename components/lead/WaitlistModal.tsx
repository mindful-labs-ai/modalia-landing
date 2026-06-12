'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/constants/site';
import { gtagEvent } from '@/lib/analytics';

/**
 * Pre-launch waitlist modal.
 *
 * Opens in response to the `waitlist:open` CustomEvent dispatched by CtaTracker
 * (fired when any app-bound CTA is clicked while SITE_CONFIG.prelaunch is true).
 * Shows a "coming soon" notice, the embedded demo video, the "1 month free at
 * launch" hook, and an email capture form that POSTs to /api/lead.
 *
 * Decoupled by design: sections keep their normal app.mindthos.com hrefs (good
 * for SEO / a clean launch flip), and this single mounted instance handles every
 * CTA on the page.
 */

const UTM_STORAGE_KEY = 'mt-utm-params'; // shared with UtmForwarder

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface OpenDetail {
  location?: string;
  label?: string;
}

function readUtms(): Record<string, string> | undefined {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string>;
    }
  } catch {
    // ignore — private mode / corrupted cache
  }
  return undefined;
}

export function WaitlistModal() {
  const t = useTranslations('waitlist');
  const locale = useLocale();
  const titleId = useId();
  const descId = useId();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [email, setEmail] = useState('');
  const source = useRef<string>('unknown');
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    /* Restore focus to the CTA that opened the modal — accessibility. */
    lastFocused.current?.focus?.();
  }, []);

  /* Listen for the open event broadcast by CtaTracker. */
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<OpenDetail>).detail ?? {};
      source.current = detail.location ?? 'unknown';
      lastFocused.current = document.activeElement as HTMLElement | null;
      setStatus('idle');
      setEmail('');
      setOpen(true);
    }
    window.addEventListener('waitlist:open', onOpen);
    return () => window.removeEventListener('waitlist:open', onOpen);
  }, []);

  /* Body scroll lock + ESC to close + initial focus while open. */
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') trapFocus(e, dialogRef.current);
    };
    window.addEventListener('keydown', onKey);
    /* Defer focus so the dialog is painted first. */
    const id = window.setTimeout(() => emailRef.current?.focus(), 30);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(id);
    };
  }, [open, close]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: value,
          locale,
          source: source.current,
          page_path:
            typeof window !== 'undefined' ? window.location.pathname : undefined,
          utm: readUtms(),
          referrer:
            typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('success');
      gtagEvent('waitlist_submit', { cta_location: source.current, locale });
    } catch {
      setStatus('error');
    }
  }

  if (!open) return null;

  return (
    <div
      className="wl-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={(e) => {
        /* Backdrop click closes; clicks inside the dialog do not. */
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="wl-dialog" ref={dialogRef}>
        <button
          type="button"
          className="wl-close"
          onClick={close}
          aria-label={t('close')}
        >
          <X size={20} aria-hidden />
        </button>

        {status === 'success' ? (
          <div className="wl-success">
            <div className="wl-check" aria-hidden>
              ✓
            </div>
            <h2 className="wl-title" id={titleId}>
              {t('successTitle')}
            </h2>
            <p className="wl-body" id={descId}>
              {t('successBody')}
            </p>
            <button type="button" className="btn primary lg wl-done" onClick={close}>
              {t('done')}
            </button>
          </div>
        ) : (
          <>
            <span className="wl-badge">{t('badge')}</span>
            <h2 className="wl-title" id={titleId}>
              {t('title')}
            </h2>
            <p className="wl-body" id={descId}>
              {t('subtitle')}
            </p>

            <div className="wl-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${SITE_CONFIG.demoVideoId}?rel=0`}
                title={t('videoTitle')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                loading="lazy"
              />
            </div>

            <div className="wl-perk">
              <span className="wl-perk-icon" aria-hidden>
                🎁
              </span>
              <div>
                <p className="wl-perk-title">{t('perkTitle')}</p>
                <p className="wl-perk-body">{t('perkBody')}</p>
              </div>
            </div>

            <form className="wl-form" onSubmit={onSubmit} noValidate>
              <label className="wl-label" htmlFor={`${titleId}-email`}>
                {t('emailLabel')}
              </label>
              <div className="wl-row">
                <input
                  ref={emailRef}
                  id={`${titleId}-email`}
                  className="wl-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  aria-invalid={status === 'error'}
                  required
                />
                <button
                  type="submit"
                  className="btn primary"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? t('submitting') : t('submit')}
                </button>
              </div>
              {status === 'error' && (
                <p className="wl-error" role="alert">
                  {t('error')}
                </p>
              )}
              <p className="wl-privacy">{t('privacy')}</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/** Keep Tab focus inside the dialog. */
function trapFocus(e: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}
