import { defineDocs, defineConfig, defineCollections, frontmatterSchema, metaSchema} from 'fumadocs-mdx/config';
import { fileGenerator, remarkDocGen, remarkInstall } from 'fumadocs-docgen';
import { remarkTypeScriptToJavaScript } from 'fumadocs-docgen/remark-ts2js';
import { rehypeCodeDefaultOptions, remarkSteps} from 'fumadocs-core/mdx-plugins';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { remarkAutoTypeTable } from 'fumadocs-typescript';
import { z } from 'zod';

export const docs = defineDocs({
  dir: 'src/mdx/docs',
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: frontmatterSchema.extend({
      preview: z.string().optional(),
      index: z.boolean().default(false),
      /**
       * API routes only
       */
      method: z.string().optional(),
    }),
  },
  meta: {
    schema: metaSchema.extend({
      description: z.string().optional(),
    }),
  },
});

export const blog = defineCollections({
  dir: 'src/mdx/blog',
  type: 'doc',
  async: false,
  // @ts-ignore - Temporarily suppress deep instantiation error
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.string().date().or(z.date()).optional(),
  }),
});


const remarkInstallOptions = {
  persist: {
    id: 'package-manager',
  },
};

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      lazy: true,
      experimentalJSEngine: true,
      langs: ['ts', 'js', 'html', 'tsx', 'mdx'],
      inline: 'tailing-curly-colon',
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        {
          name: 'transformers:remove-notation-escape',
          code(hast) {
            for (const line of hast.children) {
              if (line.type !== 'element') continue;

              const lastSpan = line.children.findLast(
                (v) => v.type === 'element',
              );

              const head = lastSpan?.children[0];
              if (head?.type !== 'text') continue;

              head.value = head.value.replace(/\[\\!code/g, '[!code');
            }
          },
        },
      ],
    },
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