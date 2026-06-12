'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { PRIMARY_NAV } from '@/constants/nav';
import { SITE_CONFIG } from '@/constants/site';
import { ModaliaLogo } from './ModaliaLogo';
import { LanguageSwitcher } from './LanguageSwitcher';

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const t = useTranslations('header');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparent = pathname === '/' && !scrolled;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    firstLinkRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <header
      className="gnb"
      data-scrolled={scrolled ? 'true' : 'false'}
      data-transparent={transparent ? 'true' : 'false'}
    >
      <div className="container gnb-inner">
        <Link className="gnb-logo" href="/" aria-label={t('logoAria')}>
          <ModaliaLogo aria-hidden="true" />
        </Link>

        <nav className="gnb-nav" aria-label={t('nav.features')}>
          {PRIMARY_NAV.map((item) => {
            const active = !item.external && isActive(pathname, item.href);
            const ariaCurrent = active ? ('page' as const) : undefined;
            return item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(`nav.${item.key}`)}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ariaCurrent}
                className={active ? 'active' : undefined}
              >
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        <div className="gnb-right">
          <a
            className="btn sm ghost"
            href={SITE_CONFIG.appUrl}
            data-cta-intent="login"
            data-cta-location="header"
            data-cta-label="login"
          >
            {t('login')}
          </a>
          <a
            className="btn sm primary"
            href={SITE_CONFIG.appUrl}
            data-cta-intent="signup"
            data-cta-location="header"
            data-cta-label="signup"
          >
            {t('signup')}
          </a>
          <LanguageSwitcher />
          <button
            ref={toggleRef}
            type="button"
            className="gnb-mobile-toggle"
            onClick={() => setMobileOpen((s) => !s)}
            aria-label={mobileOpen ? t('menuClose') : t('menuOpen')}
            aria-expanded={mobileOpen}
            aria-controls="gnb-mobile-panel"
          >
            {mobileOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="gnb-mobile-panel" className="gnb-mobile-panel">
          <nav aria-label={t('menuOpen')}>
            {PRIMARY_NAV.map((item, idx) => {
              const active = !item.external && isActive(pathname, item.href);
              const refProp = idx === 0 ? { ref: firstLinkRef } : {};
              return item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  {...refProp}
                >
                  {t(`nav.${item.key}`)}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? ('page' as const) : undefined}
                  onClick={() => setMobileOpen(false)}
                  {...refProp}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>
          <div className="gnb-mobile-cta">
            <a
              className="btn ghost"
              href={SITE_CONFIG.appUrl}
              data-cta-intent="login"
              data-cta-location="header_mobile"
              data-cta-label="login"
              onClick={() => setMobileOpen(false)}
            >
              {t('login')}
            </a>
            <a
              className="btn primary"
              href={SITE_CONFIG.appUrl}
              data-cta-intent="signup"
              data-cta-location="header_mobile"
              data-cta-label="signup"
              onClick={() => setMobileOpen(false)}
            >
              {t('signup')}
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
