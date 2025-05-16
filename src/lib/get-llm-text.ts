import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { fileGenerator, remarkDocGen, remarkInstall } from 'fumadocs-docgen';
import remarkMdx from 'remark-mdx';
import { remarkAutoTypeTable } from 'fumadocs-typescript';
import { remarkInclude } from 'fumadocs-mdx/config';
import { type Page } from '@/lib/source';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';

function remarkRemoveFrontmatter() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    visit(tree, 'yaml', (_node, index, parent) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1);
      }
    });
  };
}

const processor = remark()
  // 解析md文件标识头
  .use(remarkFrontmatter, ['yaml'])
  // 移除md文件标识头
  .use(remarkRemoveFrontmatter)
  .use(remarkMdx)
  .use(remarkInclude)
  .use(remarkGfm)
  .use(remarkAutoTypeTable)
  .use(remarkDocGen, { generators: [fileGenerator()] })
  .use(remarkInstall);

export async function getLLMText(page: Page) {
//   console.log('page data for getLLMText:', page.data);
  const processed = await processor.process({
    path: page.data._file.absolutePath,
    value: page.data.content,
  });

  const contentWithoutFrontmatter = processed.value as string;

  const markdownParts = [
    `# ${page.data.title}`,
    page.data.description,
    contentWithoutFrontmatter.trim()
  ];

  return markdownParts.filter(part => part != null).join('\n\n');
}