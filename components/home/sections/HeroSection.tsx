'use client';

import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/constants/site';

/* Extracted so the rich-text accent renderer can reference it without closure issues */
function AccentIcon() {
  return (
    <svg
      className="hero-h1-accent-icon"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9.9987 18.3346C9.9987 18.3346 16.6654 15.0013 16.6654 10.0013V4.16797L9.9987 1.66797L3.33203 4.16797V10.0013C3.33203 15.0013 9.9987 18.3346 9.9987 18.3346Z"
        stroke="currentColor"
        strokeWidth="1.57"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="2" fill="currentColor" />
      <path d="M10 8V13" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function HeroSection() {
  const t = useTranslations('hero');

  return (
<section className="hero" aria-label={t('ariaLabel')} data-funnel-section="hero">


  <div className="hero-bg" aria-hidden="true">
    <video
      className="hero-bg-video"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      // @ts-expect-error — fetchPriority is supported by React 19 but not yet reflected in the video element types
      fetchPriority="low"
      aria-hidden="true"
      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
    >
      <source src="/hero-bg-mobile.mp4" type="video/mp4" media="(max-width: 720px)" />
      <source src="/hero-bg.mp4" type="video/mp4"/>
    </video>
    {/* SVG fallback for hero video. next/image disallows SVG by default for XSS safety,
        and this asset is a hidden aria-hidden fallback whose onError must mutate the
        rendered <img> directly — keep as native <img>. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="hero-bg-fallback" src="/hero-counselor.svg" alt=""
         aria-hidden="true" width={1440} height={900}
         onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}/>
    <div className="hero-bg-placeholder" aria-hidden="true"></div>
  </div>

  <div className="hero-scrim" aria-hidden="true"></div>


  <div className="hero-overlay" aria-hidden="true"></div>

  <div className="hero-bottom-fade" aria-hidden="true"></div>




  <div className="container hero-content-wrap">
    <div className="hero-content">
      <h1 className="hero-h1">
        {t.rich('h1', {
          br: () => <br />,
          accent: (chunks) => (
            <span className="hero-h1-accent">
              <AccentIcon />
              {chunks}
            </span>
          ),
        })}
      </h1>
      <p className="hero-sub">
        {t.rich('sub', { br: () => <br /> })}
      </p>
      <div className="hero-ctas">
        <a
          className="btn primary lg"
          href={SITE_CONFIG.appUrl}
          data-cta-intent="signup"
          data-cta-location="hero"
          data-cta-label={t('ctaPrimary')}
        >{t('ctaPrimary')}</a>
        <a className="btn lg ghost on-dark" href="#trust">{t('ctaSecondary')}</a>
      </div>
    </div>
  </div>


</section>
  );
}
