'use client';

import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/constants/site';

interface PricingPlan {
  name: string;
  target: string;
  price: string;
  credits: string;
  clientsValue: string;
  sessionsKey?: string;
  sessionsValue: string;
  features: string[];
  ctaLabel: string;
  ctaIntent: string;
  ctaTier: string;
}

const PLAN_ICONS = [
  /* Starter */
  <svg key="starter" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5 H20 L25 10 V25 A2 2 0 0 1 23 27 H9 A2 2 0 0 1 7 25 V7 A2 2 0 0 1 9 5 Z"/>
    <path d="M20 5 V10 H25"/>
    <line x1="11" y1="15" x2="21" y2="15"/>
    <line x1="11" y1="19" x2="18" y2="19"/>
    <circle className="accent-fill" cx="13" cy="23" r="1.7"/>
  </svg>,
  /* Plus */
  <svg key="plus" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="13" width="6" height="6" rx="1.5"/>
    <rect className="accent-fill" x="13" y="13" width="6" height="6" rx="1.5"/>
    <rect x="23" y="13" width="6" height="6" rx="1.5"/>
    <path d="M9 16 Q 11 13.5, 13 16"/>
    <path d="M19 16 Q 21 18.5, 23 16"/>
  </svg>,
  /* Pro */
  <svg key="pro" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="14" y="4" width="13" height="14" rx="2" fill="#fff"/>
    <rect x="10" y="8" width="13" height="14" rx="2" fill="#fff"/>
    <rect x="6" y="12" width="15" height="15" rx="2" fill="#fff"/>
    <line x1="9" y1="17" x2="18" y2="17"/>
    <path className="accent-stroke" d="M9 22 L11.5 24.5 L16.5 19.5"/>
  </svg>,
  /* Institution */
  <svg key="institution" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="8" r="2.4"/>
    <circle cx="26" cy="8" r="2.4"/>
    <circle cx="16" cy="27.5" r="2.4"/>
    <line x1="8" y1="9.5" x2="11.5" y2="11.5"/>
    <line x1="24" y1="9.5" x2="20.5" y2="11.5"/>
    <line x1="16" y1="25" x2="16" y2="22"/>
    <path d="M16 10 L20 12 V16 C 20 19, 16 21.5, 16 21.5 C 12 19, 12 16, 12 16 V12 Z" fill="#fff"/>
    <path className="accent-stroke" d="M14 16 L15.5 17.4 L18 14.6"/>
  </svg>,
];

export function PricingSection() {
  const t = useTranslations('pricing');
  const plans = t.raw('plans') as PricingPlan[];

  return (
<section id="pricing" className="wf-section" data-funnel-section="pricing">
  <div className="container">
    <div className="pricing-head pricing-head--lean">
      <h2 className="t-h2">
        {t.rich('headTitle', { br: () => <br /> })}
      </h2>
    </div>

    <div className="price-grid">
      {plans.map((plan, i) => {
        const isPlus = plan.ctaTier === 'plus';
        const isInstitution = plan.ctaTier === 'institution';
        const href = isInstitution ? '#trust' : SITE_CONFIG.appUrl;

        return (
          <div key={plan.ctaTier} className={`price-card${isPlus ? ' featured' : ''}`}>
            {isPlus && <span className="price-badge">{t('recommendedBadge')}</span>}
            <div className="price-head">
              <div className="price-icon" aria-hidden="true">
                {PLAN_ICONS[i]}
              </div>
              <span className="price-name">{plan.name}</span>
              <p className="price-target">{plan.target}</p>
            </div>
            <div className="price-money">
              <div className={isInstitution ? 'price-amt-custom' : 'price-amt'}>
                {plan.price}
              </div>
              <div className="price-credits">
                <strong>{plan.credits}</strong>
              </div>
            </div>
            <div className="price-feel">
              <span className="price-feel-label">{t('feelLabel')}</span>
              <div className="price-feel-summary">
                <ul className="price-feel-stats">
                  <li>
                    <span className="price-feel-k">{t('clientsKey')}</span>
                    <span className="price-feel-v">{plan.clientsValue}</span>
                  </li>
                  <li>
                    <span className="price-feel-k">{plan.sessionsKey ?? t('sessionsKey')}</span>
                    <span className="price-feel-v">{plan.sessionsValue}</span>
                  </li>
                </ul>
              </div>
            </div>
            <ul className="price-ul">
              {plan.features.map((feature, fi) => (
                <li key={fi}>{feature}</li>
              ))}
            </ul>
            <a
              className={`btn ${isPlus ? 'primary' : 'ghost'}`}
              href={href}
              data-cta-intent={plan.ctaIntent}
              data-cta-location="pricing"
              data-cta-tier={plan.ctaTier}
              data-cta-label={plan.ctaLabel}
            >
              {plan.ctaLabel}
            </a>
          </div>
        );
      })}
    </div>

    <p className="price-foot">
      {t.rich('footNote', { br: () => <br /> })}
    </p>
  </div>
</section>
  );
}
