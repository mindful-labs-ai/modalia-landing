import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import '../globals.css';
import '../hifi.css';
import '../waitlist.css';
import { routing, HTML_LANG, type Locale } from '@/i18n/routing';
import { SITE_CONFIG } from '@/constants/site';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/lib/seo/schema';
import { UtmForwarder } from '@/components/layout/UtmForwarder';
import { CtaTracker } from '@/components/layout/CtaTracker';
import { WaitlistModal } from '@/components/lead/WaitlistModal';
import { PromoBanner } from '@/components/layout/PromoBanner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const pretendard = localFont({
  src: [
    {
      path: '../../public/fonts/PretendardVariable.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Hiragino Sans',
    'Noto Sans JP',
    'Noto Sans',
    'sans-serif',
  ],
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    metadataBase: new URL(SITE_CONFIG.url),
    applicationName: SITE_CONFIG.name,
    ...buildPageMetadata({
      locale: locale as Locale,
      title: t('home.title'),
      description: t('home.description'),
      path: '',
      absoluteTitle: true,
    }),
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: SITE_CONFIG.brand.primary,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const tc = await getTranslations({ locale, namespace: 'common' });

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html
      lang={HTML_LANG[locale as Locale]}
      className={`${pretendard.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        {gaId ? (
          <>
            <Script id="consent-mode-init" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', {
                  ad_storage: 'granted',
                  ad_user_data: 'granted',
                  ad_personalization: 'granted',
                  analytics_storage: 'granted',
                });
                gtag('js', new Date());
              `}
            </Script>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('config', '${gaId}', { send_page_view: true });
              `}
            </Script>
          </>
        ) : null}
        {pixelId ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        ) : null}

        <NextIntlClientProvider messages={messages} locale={locale}>
          <SchemaMarkup
            schema={[
              generateOrganizationSchema(
                locale as Locale,
                t('schema.orgDescription'),
              ),
              generateWebSiteSchema(
                locale as Locale,
                t('schema.softwareDescription'),
              ),
            ]}
          />
          <UtmForwarder />
          <CtaTracker />
          <WaitlistModal />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-[var(--brand-primary-dark)]"
          >
            {tc('skipToContent')}
          </a>
          <PromoBanner />
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
