import GithubSlugger from 'github-slugger';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract H2 headings only. IDs are produced with the same github-slugger
 * that rehype-slug stamps into the body, so ToC anchors always match body ids.
 */
export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const headingRegex = /^(#{2})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    items.push({ id: slugger.slug(text), text, level });
  }

  return items;
}
