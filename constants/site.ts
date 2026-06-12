/**
 * Shared config for modalia.ai (Modalia AI global site) — locale-independent values only.
 * Per-locale copy (name, tagline, description) lives in messages/<locale>/metadata.json.
 */
export const SITE_CONFIG = {
  /** Global brand name — Latin script shared across all locales */
  name: 'Modalia AI',
  legalName: 'Mindful Labs Inc.',
  legalUrl: 'https://www.mindfullabs.ai/',
  /** Global site origin. Base for hreflang/canonical. */
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://modalia.ai',
  /** Korean site origin — target for cross-domain hreflang(ko) + x-default */
  koUrl: process.env.NEXT_PUBLIC_KO_SITE_URL || 'https://mindthos.com',
  /** Product app — entry point for all "Start for free / Login" CTAs */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.mindthos.com',
  /**
   * Pre-launch mode. While true, every CTA pointing at the app (except /terms)
   * opens the waitlist modal instead of navigating to app.mindthos.com.
   * Flip to `false` (NEXT_PUBLIC_PRELAUNCH=false) at global launch to restore
   * direct app navigation — no other code change required.
   */
  prelaunch: process.env.NEXT_PUBLIC_PRELAUNCH !== 'false',
  /** YouTube id for the demo video embedded in the waitlist modal. */
  demoVideoId: process.env.NEXT_PUBLIC_DEMO_VIDEO_ID || 'xAOSEFBhxYk',
  email: process.env.NEXT_PUBLIC_SITE_EMAIL || 'business@mindfullabs.ai',
  social: {
    instagram:
      process.env.NEXT_PUBLIC_INSTAGRAM || 'https://www.instagram.com/mind.thos',
    threads:
      process.env.NEXT_PUBLIC_THREADS || 'https://www.threads.net/@mind.thos',
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN || '',
    twitter: process.env.NEXT_PUBLIC_TWITTER || '',
  },
  /** Organization JSON-LD address — headquarters (Korea), locale-independent */
  address: {
    streetAddress: '38 Ttukseom-ro 13-gil, 4F, Seongdong-gu',
    addressLocality: 'Seoul',
    addressRegion: 'Seoul',
    postalCode: '04782',
    addressCountry: 'KR',
  },
  /** Brand colours */
  brand: {
    primary: '#44ce4b',
    primaryDark: '#40a755',
    primarySoft: '#65c377',
    text: '#1f1f1f',
    textHeading: '#0e0e0e',
    bgBase: '#ffffff',
    bgWarm: '#f7f5f1',
    bgDeep: '#181819',
  },
} as const;

export const REVALIDATION = {
  home: 3600,
  static: 86400,
} as const;
