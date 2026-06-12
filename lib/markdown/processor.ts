import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Schema } from 'hast-util-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

// Sanitize schema: GFM defaults + allow heading id (TOC anchor) and table-responsive wrapper.
// clobberPrefix '' keeps rehype-slug ids verbatim; the default 'user-content-' prefix
// would make them no longer match the ToC anchors / `extractToc` slugs.
const sanitizeSchema: Schema = {
  ...defaultSchema,
  clobberPrefix: '',
  attributes: {
    ...defaultSchema.attributes,
    h1: [...(defaultSchema.attributes?.h1 ?? []), 'id'],
    h2: [...(defaultSchema.attributes?.h2 ?? []), 'id'],
    h3: [...(defaultSchema.attributes?.h3 ?? []), 'id'],
    h4: [...(defaultSchema.attributes?.h4 ?? []), 'id'],
    h5: [...(defaultSchema.attributes?.h5 ?? []), 'id'],
    h6: [...(defaultSchema.attributes?.h6 ?? []), 'id'],
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      ['className', 'table-responsive'],
    ],
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
  },
};

function rehypeResponsiveTable() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName === 'table' && parent && typeof index === 'number') {
        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-responsive'] },
          children: [node],
        };
        (parent as Element).children[index] = wrapper;
      }
    });
  };
}

function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'a') {
        const href = node.properties?.href as string | undefined;
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          node.properties = node.properties || {};
          node.properties.target = '_blank';
          node.properties.rel = 'noopener noreferrer';
        }
      }
    });
  };
}

export async function processMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm, { singleTilde: false })
    .use(remarkRehype, { allowDangerousHtml: true })
    // Promote raw HTML nodes to hast elements so inline HTML (<strong>/<em> etc.) survives.
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeResponsiveTable)
    .use(rehypeExternalLinks)
    // Sanitize AFTER custom plugins so wrapper div className + external link attrs survive.
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}
