import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { remarkInstall } from 'fumadocs-docgen';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

const remarkInstallOptions = {
  persist: {
    id: 'd8ger',
  },
};
 
export const docs = defineDocs({
  dir: 'src/mdx',
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMath, [remarkInstall, remarkInstallOptions]],
    // Place it at first, it should be executed before the syntax highlighter
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});