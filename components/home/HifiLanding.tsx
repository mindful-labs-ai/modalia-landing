import { getTranslations } from 'next-intl/server';
import { SITE_CONFIG } from '@/constants/site';
import { HeroSection } from './sections/HeroSection';
import { TrustEncryptSection } from './sections/TrustEncryptSection';
import { PainSection } from './sections/PainSection';
import { FeatureTabsSection } from './sections/FeatureTabsSection';
import { SampleExperienceSection } from './sections/SampleExperienceSection';
import { PersonasSection } from './sections/PersonasSection';
import { VsCompareSection } from './sections/VsCompareSection';
import { MetricsSection } from './sections/MetricsSection';
import { PricingSection } from './sections/PricingSection';
import { FaqSection } from './sections/FaqSection';
import { FinalCtaSection } from './sections/FinalCtaSection';
import { HifiLandingEffects } from './HifiLandingEffects';
import { LandingFunnelTracker } from './LandingFunnelTracker';

/**
 * Home landing container — Server Component.
 * Interaction effects (IntersectionObserver, sessionStorage promo dismiss)
 * are isolated in the micro client component HifiLandingEffects.
 * Child sections use 'use client' but SSR HTML is still produced normally,
 * so crawlers and search engines index the full content.
 */
export async function HifiLanding() {
  const t = await getTranslations('common');

  return (
    <>
      <HeroSection />
      <TrustEncryptSection />
      <PainSection />
      <FeatureTabsSection />
      <SampleExperienceSection />
      <PersonasSection />
      <VsCompareSection />
      <MetricsSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
      <div
        className="promo-bottom"
        data-promo-bottom
        role="region"
        aria-label={t('promo.regionLabel')}
      >
        <div className="promo-bottom-msg">
          <span className="promo-tag">{t('promo.newTag')}</span>
          <span className="promo-bottom-text">{t('promo.bottomText')}</span>
        </div>
        <a
          className="btn primary"
          href={`${SITE_CONFIG.appUrl}/?utm_source=landing&utm_medium=display&utm_campaign=banner`}
          data-promo-cta
          data-cta-intent="signup"
          data-cta-location="promo_banner_bottom"
          data-cta-label="Start for free"
        >
          {t('promo.cta')}
        </a>
      </div>

      <HifiLandingEffects />
      <LandingFunnelTracker />
    </>
  );
}
