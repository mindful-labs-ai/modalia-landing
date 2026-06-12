/**
 * Global blog configuration — single source of truth.
 * BLOG_PAGE_SIZE is shared by the path-based pagination route (/blog/page/N),
 * sitemap generation, and the query default. If these diverge, the sitemap can
 * point at page URLs the route 404s on.
 */
export const BLOG_PAGE_SIZE = 12;

/**
 * Brand author used when a global post has no author_id.
 * The only row in the shared `authors` table is Korean-named, so the global blog
 * defaults to the neutral Latin-script brand name. The role label is localized in
 * messages (blog.author.role) where it is displayed.
 */
export const DEFAULT_AUTHOR = {
  name: 'Modalia AI',
  slug: 'modalia',
} as const;

/** Blog index path for a locale (no trailing slash). */
export function blogBasePath(locale: string): string {
  return `/${locale}/blog`;
}
