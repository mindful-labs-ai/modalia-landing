import Link from 'next/link';

/**
 * Global 404 — for unmatched paths entered without a locale prefix (e.g. unknown locale).
 * This route falls outside app/[locale]/layout.tsx, so it renders its own <html>/<body>.
 * Displayed in English (the default locale).
 */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#ffffff',
          color: '#1f1f1f',
        }}
      >
        <main style={{ textAlign: 'center', padding: '2rem' }}>
          <p
            style={{
              fontFamily: 'monospace',
              color: '#40a755',
              letterSpacing: '0.08em',
              margin: 0,
            }}
          >
            404
          </p>
          <h1 style={{ fontSize: '1.5rem', margin: '0.5rem 0 1rem' }}>
            Page not found
          </h1>
          <p style={{ color: '#555', marginBottom: '1.5rem' }}>
            The page you are looking for doesn&apos;t exist.
          </p>
          <Link
            href="/en"
            style={{
              display: 'inline-block',
              padding: '0.7rem 1.4rem',
              borderRadius: '999px',
              background: '#44ce4b',
              color: '#1f1f1f',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Go to Modalia AI
          </Link>
        </main>
      </body>
    </html>
  );
}
