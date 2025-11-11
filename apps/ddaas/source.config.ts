import { appConfig } from '@/lib/appConfig';
import { createCommonDocsSchema, createCommonMetaSchema, remarkInstallOptions } from '@third-ui/lib/fuma-schema-check-util';
import { rehypeCodeDefaultOptions, remarkSteps, remarkNpm } from 'fumadocs-core/mdx-plugins';
import { fileGenerator, remarkDocGen } from 'fumadocs-docgen';
import { remarkTypeScriptToJavaScript } from 'fumadocs-docgen/remark-ts2js';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { remarkAutoTypeTable } from 'fumadocs-typescript';
import type { Element } from 'hast';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import type { ShikiTransformerContext as TransformerContext } from 'shiki';

const mdxSourceDir = appConfig.mdxSourceDir

export const docs = defineDocs({
  dir: mdxSourceDir.docs,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: createCommonDocsSchema(),
  },
  meta: {
    schema: createCommonMetaSchema(),
  },
});

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
    // 禁用 remark-image 的默认行为, 图片统一使用远程URL
    remarkImageOptions: false,
    rehypeCodeOptions: {
      lazy: true,
      inline: 'tailing-curly-colon',
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
      transformers: [
        // 1. 自定义 Transformer，用于从 this.options.lang 添加 data-language
        {
          name: 'transformer:parse-code-language', 
          pre(this: TransformerContext | any, preNode: Element) { 
            // 为了调试，暂时取消下面这行的注释，以便查看 this.options 的完整结构:
            // console.log('[Transformer] this.options:', JSON.stringify(this.options, null, 2));
            
            const languageFromOptions = this.options?.lang as string | undefined;

            if (languageFromOptions && typeof languageFromOptions === 'string' && languageFromOptions.trim() !== '') {
              if (!preNode.properties) {
                preNode.properties = {};
              }
              const langLower = languageFromOptions.toLowerCase();
              preNode.properties['data-language'] = langLower;
            }
            return preNode; // 确保返回处理后的节点
          }
        },
        // 2. Fumadocs 的默认 Transformers
        // /core/src/mdx-plugins/rehype-code.ts, 定义了: 行高亮、单词高亮、Diff高亮、代码聚焦、从元数据上解析代码行编号
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        // 3. 您现有的 transformer
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
    // packages/core/src/server/get-toc.ts, remark().use(remarkPlugins).use(remarkHeading)
    // 关于目录Heading的处理, FumaDocs底层已经指定了顺序: 用户指定的remarkPlugins先执行, 然后执行remarkHeading, 最后交由渲染Page调用toc-clerk.tsx逻辑
    remarkPlugins: [
      remarkSteps,
      remarkMath, 
      remarkAutoTypeTable,
      [remarkNpm, remarkInstallOptions],
      [remarkDocGen, { generators: [fileGenerator()] }],
      remarkTypeScriptToJavaScript,
    ],
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});