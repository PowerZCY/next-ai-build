// source.config.ts
import { defineDocs, defineConfig, defineCollections, frontmatterSchema, metaSchema } from "fumadocs-mdx/config";
import { fileGenerator, remarkDocGen, remarkInstall } from "fumadocs-docgen";
import { remarkTypeScriptToJavaScript } from "fumadocs-docgen/remark-ts2js";
import { rehypeCodeDefaultOptions, remarkSteps } from "fumadocs-core/mdx-plugins";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { remarkAutoTypeTable } from "fumadocs-typescript";
import { z } from "zod";
var docs = defineDocs({
  dir: "src/mdx/docs",
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: frontmatterSchema.extend({
      preview: z.string().optional(),
      index: z.boolean().default(false),
      keywords: z.array(z.string()).optional(),
      // 添加 keywords 字段，类型为可选的字符串数组
      // API routes only
      method: z.string().optional()
    })
  },
  meta: {
    schema: metaSchema.extend({
      description: z.string().optional()
    })
  }
});
var blog = defineCollections({
  dir: "src/mdx/blog",
  type: "doc",
  async: false,
  // @ts-ignore - Temporarily suppress deep instantiation error
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.string().date().or(z.date()).optional(),
    keywords: z.array(z.string()).optional()
    // 添加 keywords 字段，类型为可选的字符串数组
  })
});
var remarkInstallOptions = {
  persist: {
    id: "package-manager"
  }
};
var source_config_default = defineConfig({
  lastModifiedTime: "git",
  mdxOptions: {
    providerImportSource: "@/components/mdx-components",
    rehypeCodeOptions: {
      lazy: true,
      experimentalJSEngine: true,
      langs: [
        "ts",
        "tsx",
        "js",
        "css",
        "html",
        "xml",
        "csv",
        "mdx",
        "md",
        "json",
        "jsonc",
        "yaml",
        "zsh",
        "sh",
        "bash",
        "sql",
        "java",
        "python",
        "go",
        "rust"
      ],
      inline: "tailing-curly-colon",
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha"
      },
      transformers: [
        ...rehypeCodeDefaultOptions.transformers ?? [],
        {
          name: "transformers:remove-notation-escape",
          code(hast) {
            for (const line of hast.children) {
              if (line.type !== "element") continue;
              const lastSpan = line.children.findLast(
                (v) => v.type === "element"
              );
              const head = lastSpan?.children[0];
              if (head?.type !== "text") continue;
              head.value = head.value.replace(/\[\\!code/g, "[!code");
            }
          }
        }
      ]
    },
    remarkPlugins: [
      remarkSteps,
      remarkMath,
      remarkAutoTypeTable,
      [remarkInstall, remarkInstallOptions],
      [remarkDocGen, { generators: [fileGenerator()] }],
      remarkTypeScriptToJavaScript
    ],
    // Place it at first, it should be executed before the syntax highlighter
    rehypePlugins: (v) => [rehypeKatex, ...v]
  }
});
export {
  blog,
  source_config_default as default,
  docs
};
