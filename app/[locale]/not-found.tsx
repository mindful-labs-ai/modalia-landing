import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Locale-scoped 404 — rendered inside app/[locale]/layout.tsx (with header/footer).
 */
export default function LocaleNotFound() {
  const t = useTranslations('common');
  return (
    <section className="wf-section" style={{ minHeight: '60vh' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <p
          className="wf-marker"
          style={{ justifyContent: 'center', color: 'var(--brand-primary-dark)' }}
        >
          404
        </p>
        <h1 className="t-h2">{t('notFoundTitle')}</h1>
        <p style={{ margin: '1rem 0 2rem', color: 'var(--ink-2)' }}>
          {t('notFoundBody')}
        </p>
        <Link className="btn primary lg" href="/">
          {t('backHome')}
        </Link>
      </div>
    </section>
  );
}
