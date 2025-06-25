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

// remark(), parse the MDX file into MDAST
// remarkPlugins(), parse the MDAST into HAST
// rehypePlugins(), render the HAST into React components, i.e. HTML code
const processor = remark()
  // parse the md file header
  .use(remarkFrontmatter, ['yaml'])
  // remove the md file header
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