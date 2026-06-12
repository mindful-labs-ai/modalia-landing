/**
 * GNB / Footer navigation for the global site.
 * Phase 1 (landing only) has no separate routes (blog, education, security, etc.),
 * so the menu uses in-page anchors. Add routes here when Phase 2 features are ready.
 *
 * Labels are resolved from the `header`/`footer` namespace keys in messages — no hardcoded strings.
 */
export interface NavItem {
  /** In-page anchor (`#pricing`) or route (`/`). External links use external: true. */
  href: string;
  /** Label key in messages (header.nav.<key> / footer.<key>) */
  key: string;
  external?: boolean;
}

/** GNB primary menu — landing section anchors plus the blog route. */
export const PRIMARY_NAV: NavItem[] = [
  { href: '#features', key: 'features' },
  { href: '#pricing', key: 'pricing' },
  { href: '#faq', key: 'faq' },
  { href: '/blog', key: 'blog' },
];
