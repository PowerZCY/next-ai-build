import { appConfig } from '@/lib/appConfig';
import { createCommonDocsSchema, createCommonMetaSchema } from '@third-ui/lib/fuma-schema-check-util';
import { rehypeCodeDefaultOptions, remarkSteps } from 'fumadocs-core/mdx-plugins';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import type { Element } from 'hast';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import type { ShikiTransformerContext as TransformerContext } from 'shiki';

const mdxSourceDir = appConfig.mdxSourceDir

export const blog = defineDocs({
  dir: mdxSourceDir.blog,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: createCommonDocsSchema(),
  },
  meta: {
    schema: createCommonMetaSchema(),
  },
});

export const legal = defineDocs({
  dir: mdxSourceDir.legal,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: createCommonDocsSchema(),
  },
  meta: {
    schema: createCommonMetaSchema(),
  },
});

export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    providerImportSource: '@/components/mdx-components',
    // disable remark-image default behavior, use remote URL for all images
    remarkImageOptions: false,
    rehypeCodeOptions: {
      lazy: true,
      experimentalJSEngine: true,
      inline: 'tailing-curly-colon',
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
      transformers: [
        // 1. custom transformer, add data-language from this.options.lang
        {
          name: 'transformer:parse-code-language', 
          pre(this: TransformerContext | any, preNode: Element) { 
            const languageFromOptions = this.options?.lang as string | undefined;

            if (languageFromOptions && typeof languageFromOptions === 'string' && languageFromOptions.trim() !== '') {
              if (!preNode.properties) {
                preNode.properties = {};
              }
              const langLower = languageFromOptions.toLowerCase();
              preNode.properties['data-language'] = langLower;
            }
            return preNode;
          }
        },
        // 2. Fumadocs default transformers
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        // 3. your existing transformer
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
    ],
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});