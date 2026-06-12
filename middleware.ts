import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  /**
   * - `/` 및 `/(en|ja|es)/...` 만 매칭.
   * - `api`, `_next`, `_vercel`, 정적 자산(점이 포함된 파일명) 은 제외.
   *   (`api` 미제외 시 점 없는 `/api/*` 가 locale prefix 로 리다이렉트되어 라우트 핸들러가 깨진다.)
   * localePrefix:'always' 이므로 `/` 진입 시 defaultLocale 로 prefix redirect 된다.
   */
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
