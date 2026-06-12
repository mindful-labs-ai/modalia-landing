'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';

/**
 * Scene 02 ("stack") mock has its four card titles baked into the image, so it
 * needs a localized render per locale (titles use each region's clinical wording:
 * Supervision / Psychological Assessment / Treatment Plan / Psychological Report).
 * All variants are 1536×1024; falls back to `en`.
 */
const SCENE2_IMG: Record<string, string> = {
  en: '/scene-02-stack-en.webp',
  es: '/scene-02-stack-es.webp',
  'zh-Hant': '/scene-02-stack-zh-Hant.webp',
  de: '/scene-02-stack-de.webp',
};

/* NOTE: Fade-up animation for `.pain-scenes .pain-scene` is owned by HifiLanding.tsx
   because the fade-up effect spans both §02 (.trust-team / .trust-protect-item) and §03
   (this section) targets in a single shared IntersectionObserver group. */
export function PainSection() {
  const t = useTranslations('pain');
  const locale = useLocale();
  const scene2 = SCENE2_IMG[locale] ?? SCENE2_IMG.en;

  return (
<section className="wf-section tone-light" data-funnel-section="pain">
  <div className="container">
    <div className="pain-head pain-head--lean">
      <h2 className="t-h2">{t.rich('h2', { br: () => <br /> })}</h2>
    </div>

    <div className="pain-scenes">


      <article className="pain-scene">
        <div className="pain-scene-stage pain-stage-converge paingfx-canvas paingfx-01" role="img" aria-label={t('scene1.stageAriaLabel')}>
          <Image className="paingfx-01-img" src="/scene-01-converge.webp" alt="" aria-hidden="true" width={1448} height={1086} sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="pain-scene-text" data-skip-legacy>
          <h3 className="pain-scene-title">{t('scene1.title')}</h3>
          <blockquote className="pain-quote">
            <p>{t.rich('scene1.quote', { br: () => <br /> })}</p>
            <cite>{t('scene1.cite')}</cite>
          </blockquote>
        </div>
      </article>


      <article className="pain-scene reverse">
        <div className="pain-scene-stage pain-stage-fanout paingfx-canvas paingfx-02" role="img" aria-label={t('scene2.stageAriaLabel')}>
          <Image className="paingfx-02-img" src={scene2} alt="" aria-hidden="true" width={1536} height={1024} sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="pain-scene-text">
          <h3 className="pain-scene-title">{t.rich('scene2.title', { br: () => <br /> })}</h3>
          <blockquote className="pain-quote">
            <p>{t.rich('scene2.quote', { br: () => <br /> })}</p>
            <cite>{t('scene2.cite')}</cite>
          </blockquote>
        </div>
      </article>


      <article className="pain-scene">
        <div className="pain-scene-stage pain-stage-bridge paingfx-canvas paingfx-03" role="img" aria-label={t('scene3.stageAriaLabel')}>
          <Image className="paingfx-03-img" src="/scene-03-tangle.webp" alt="" aria-hidden="true" width={1448} height={1086} sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="pain-scene-text">
          <h3 className="pain-scene-title">{t('scene3.title')}</h3>
          <blockquote className="pain-quote">
            <p>{t.rich('scene3.quote', { br: () => <br /> })}</p>
            <cite>{t('scene3.cite')}</cite>
          </blockquote>
        </div>
      </article>

      </div>

    <p className="pain-motion">{t('motionCaption')}</p>
  </div>


</section>
  );
}
