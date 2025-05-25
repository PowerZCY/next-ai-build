import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
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

// remark(), 将MDX文件解析为MDAST
// 解析层remarkPlugins(), 将MDAST解析为HAST
// 渲染层rehypePlugins(), 将HAST渲染为React组件, 即HTML代码
const processor = remark()
  // 解析md文件标识头
  .use(remarkFrontmatter, ['yaml'])
  // 移除md文件标识头
  .use(remarkRemoveFrontmatter)
  .use(remarkMdx)
  .use(remarkGfm);

export async function getLLMText(mdxContent: string, title?: string, description?: string) {
  if (typeof mdxContent !== 'string') {
    console.error('getLLMText: mdxContent received was not a string. Type:', typeof mdxContent);
    return `# Error\n\nInvalid content received by text processor.`;
  }

  try {
    const processed = await processor.process(mdxContent);
    const contentWithoutFrontmatter = processed.value as string;

    const markdownParts = [
      title ? `# ${title}` : null,
      description,
      contentWithoutFrontmatter.trim()
    ];

    return markdownParts.filter(part => part != null).join('\n\n');
  } catch (processingError) {
    console.error('Error during remark processing in getLLMText:', processingError);
    return `# Error\n\nError processing MDX content.`;
  }
}