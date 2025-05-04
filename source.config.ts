import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { fileGenerator, remarkDocGen, remarkInstall } from 'fumadocs-docgen';
import { remarkTypeScriptToJavaScript } from 'fumadocs-docgen/remark-ts2js';
import { remarkSteps, } from 'fumadocs-core/mdx-plugins';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { remarkAutoTypeTable } from 'fumadocs-typescript';


const remarkInstallOptions = {
  persist: {
    id: 'package-manager',
  },
};
 
export const docs = defineDocs({
  dir: 'src/mdx',
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      remarkSteps,
      remarkMath, 
      remarkAutoTypeTable,
      [remarkInstall, remarkInstallOptions],
      [remarkDocGen, { generators: [fileGenerator()] }],
      remarkTypeScriptToJavaScript,
    ],
    // Place it at first, it should be executed before the syntax highlighter
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});