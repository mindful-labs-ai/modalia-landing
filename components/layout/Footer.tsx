import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SITE_CONFIG } from '@/constants/site';
import { ModaliaLogo } from './ModaliaLogo';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer
      className="border-t border-[var(--line)] bg-[var(--bg)] pt-20 pb-9 text-[var(--ink-2)] md:pt-20"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        {/* footer-top: brand column / 3-column links */}
        <div className="grid grid-cols-1 gap-12 border-b border-[var(--line)] pb-14 md:grid-cols-[minmax(300px,1fr)_2fr] md:gap-20 md:pb-14">
          {/* Brand column */}
          <div className="flex flex-col gap-8">
            <Link href="/" aria-label={t('logoAria')} className="inline-flex min-h-[44px] items-center">
              <ModaliaLogo aria-hidden="true" className="block h-[38px] w-auto" />
            </Link>

            <dl className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <dt className="text-[14px] font-bold tracking-[0.01em] text-[var(--brand-text-on-light)]">
                  {t('sns')}
                </dt>
                <dd className="flex flex-wrap items-center gap-[10px] text-[15.5px] font-medium leading-[1.6] text-[var(--ink)]">
                  <a
                    href={SITE_CONFIG.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center text-[var(--ink)] transition-colors hover:text-[var(--brand-hover)]"
                  >
                    Instagram
                  </a>
                  <span aria-hidden="true" className="text-[13px] text-[var(--ink-4)]">
                    |
                  </span>
                  <a
                    href={SITE_CONFIG.social.threads}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center text-[var(--ink)] transition-colors hover:text-[var(--brand-hover)]"
                  >
                    Threads
                  </a>
                </dd>
              </div>

              <div className="flex flex-col gap-2">
                <dt className="text-[14px] font-bold tracking-[0.01em] text-[var(--brand-text-on-light)]">
                  {t('email')}
                </dt>
                <dd className="text-[15.5px] font-medium leading-[1.6] text-[var(--ink)]">
                  <a
                    href={`mailto:${SITE_CONFIG.email}`}
                    className="inline-flex min-h-[44px] items-center text-[var(--ink)]"
                  >
                    {SITE_CONFIG.email}
                  </a>
                </dd>
              </div>

              <div className="flex flex-col gap-1.5">
                <dd className="text-[15.5px] font-semibold leading-[1.6] text-[var(--ink)]">
                  {t('companyLine')}
                </dd>
                <dd className="text-[13.5px] font-medium leading-[1.6] text-[var(--ink-2)]">
                  {SITE_CONFIG.displayAddress}
                </dd>
              </div>
            </dl>
          </div>

          {/* Link 3-columns */}
          <div className="grid grid-cols-1 content-start gap-8 sm:grid-cols-3 md:gap-12">
            <FooterColumn heading={t('company')}>
              <li>
                <a href={SITE_CONFIG.legalUrl} target="_blank" rel="noopener noreferrer">
                  {t('links.mindfulLabs')}
                </a>
              </li>
            </FooterColumn>

            <FooterColumn heading={t('product')}>
              <li><Link href="/">{t('links.home')}</Link></li>
              <li><a href="#pricing">{t('links.pricing')}</a></li>
              <li><a href="#faq">{t('links.faq')}</a></li>
            </FooterColumn>

            <FooterColumn heading={t('legal')}>
              <li>
                <a
                  href="https://app.mindthos.com/terms?type=service"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('links.terms')}
                </a>
              </li>
              <li>
                <a
                  href="https://app.mindthos.com/terms?type=privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('links.privacy')}
                </a>
              </li>
            </FooterColumn>
          </div>
        </div>

        {/* footer-bottom */}
        <div className="flex flex-col items-center gap-2.5 pt-9 text-center">
          <p className="text-[13.5px] font-medium tracking-[0.005em] text-[var(--ink-2)]">
            Copyright © Mindful Labs Inc. | All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-[18px] text-[17px] font-bold leading-[1.4] tracking-[-0.005em] text-[var(--brand-text-on-light)]">
        {heading}
      </h3>
      <ul className="flex list-none flex-col gap-1 p-0 text-[15.5px] font-medium leading-[1.55] text-[var(--ink)] [&_a]:inline-flex [&_a]:min-h-[44px] [&_a]:min-w-[44px] [&_a]:items-center [&_a]:transition-colors [&_a:hover]:text-[var(--brand-hover)]">
        {children}
      </ul>
    </div>
  );
}
