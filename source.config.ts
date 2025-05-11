import { defineDocs, defineConfig, defineCollections, frontmatterSchema, metaSchema} from 'fumadocs-mdx/config';
import { fileGenerator, remarkDocGen, remarkInstall } from 'fumadocs-docgen';
import { remarkTypeScriptToJavaScript } from 'fumadocs-docgen/remark-ts2js';
import { rehypeCodeDefaultOptions, remarkSteps} from 'fumadocs-core/mdx-plugins';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { remarkAutoTypeTable } from 'fumadocs-typescript';
import { z } from 'zod';
import { appConfig } from '@/lib/appConfig';
import type { Element } from 'hast';
import type { ShikiTransformerContext as TransformerContext } from 'shiki'; 

const mdxSourceDir = appConfig.mdxSourceDir

export const docs = defineDocs({
  dir: mdxSourceDir.docs,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: frontmatterSchema.extend({
      preview: z.string().optional(),
      index: z.boolean().default(false),
      keywords: z.array(z.string()).optional(), // 添加 keywords 字段，类型为可选的字符串数组
      // API routes only
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
  dir: mdxSourceDir.blog,
  type: 'doc',
  async: false,
  // @ts-ignore - Temporarily suppress deep instantiation error
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.string().date().or(z.date()).optional(),
    keywords: z.array(z.string()).optional(), // 添加 keywords 字段，类型为可选的字符串数组
  }),
});

export const legal = defineDocs({
  dir: mdxSourceDir.legal,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: frontmatterSchema.extend({
      preview: z.string().optional(),
      index: z.boolean().default(false),
      keywords: z.array(z.string()).optional(), // 添加 keywords 字段，类型为可选的字符串数组
      // API routes only
      method: z.string().optional(),
    }),
  },
  meta: {
    schema: metaSchema.extend({
      description: z.string().optional(),
    }),
  },
});


const remarkInstallOptions = {
  persist: {
    id: 'package-manager',
  },
};

export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    providerImportSource: '@/components/mdx-components',
    rehypeCodeOptions: {
      lazy: true,
      experimentalJSEngine: true,
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
    remarkPlugins: [
      remarkSteps,
      remarkMath, 
      remarkAutoTypeTable,
      [remarkInstall, remarkInstallOptions],
      [remarkDocGen, { generators: [fileGenerator()] }],
      remarkTypeScriptToJavaScript,
    ],
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});