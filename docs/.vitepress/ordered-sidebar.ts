import { readdirSync, readFileSync } from 'node:fs';
import type { DefaultTheme } from 'vitepress';

interface OrderedPageMeta {
  slug: string;
  title: string;
  order: number;
}

function readFrontmatter(filePath: string): { title?: string; order?: number } {
  const content = readFileSync(filePath, 'utf8').replaceAll('\r\n', '\n');
  const frontmatterMatch = /^---\n([\s\S]*?)\n---/.exec(content);
  if (!frontmatterMatch) return {};
  const frontmatter = frontmatterMatch[1] ?? '';

  const titleMatch = /^title:\s*(.+?)\s*$/m.exec(frontmatter);
  const orderMatch = /^order:\s*(\d+)\s*$/m.exec(frontmatter);
  return {
    title: titleMatch?.[1]?.trim(),
    order: orderMatch?.[1] ? Number(orderMatch[1]) : undefined,
  };
}

export function buildOrderedSidebar(
  directoryPath: string,
  linkPrefix: string,
  sectionText: string,
): DefaultTheme.SidebarItem[] {
  const pages: OrderedPageMeta[] = readdirSync(directoryPath)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      const { title, order } = readFrontmatter(`${directoryPath}/${file}`);
      if (!title) {
        throw new Error(`${linkPrefix}${file} is missing a \`title:\` frontmatter field`);
      }
      return { slug, title, order: order ?? Infinity };
    })
    .toSorted((a, b) => a.order - b.order);

  return [
    {
      text: sectionText,
      items: pages.map((page) => ({
        text: page.title,
        link: `${linkPrefix}${page.slug}`,
      })),
    },
  ];
}
