// source.config.ts
import { defineDocs, defineConfig, defineCollections, frontmatterSchema, metaSchema } from "fumadocs-mdx/config";
import { fileGenerator, remarkDocGen, remarkInstall } from "fumadocs-docgen";
import { remarkTypeScriptToJavaScript } from "fumadocs-docgen/remark-ts2js";
import { rehypeCodeDefaultOptions, remarkSteps } from "fumadocs-core/mdx-plugins";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { remarkAutoTypeTable } from "fumadocs-typescript";
import { z } from "zod";

// src/lib/appConfig.ts
var appConfig = {
  // 基础配置
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://re8ger.com",
  githubBaseUrl: "https://github.com/PowerZCY/next-ai-build/blob/main/",
  // 国际化配置
  // - 英语 (en)
  // - 简体中文 (zh)
  // - 日语 (ja)
  // - 韩语 (ko)
  // - 法语 (fr)
  // - 德语 (de)
  // - 西班牙语 (es)
  // - 意大利语 (it)
  // - 土耳其语 (tr)
  // - 波兰语 (pl)
  i18n: {
    // locales: ["en", "zh", "ja", "ko", "fr", "de", "es", "it", "pt", "tr", "pl"] as const,
    locales: ["en", "zh"],
    defaultLocale: "en",
    localeLabels: {
      en: "English",
      zh: "\u7B80\u4F53\u4E2D\u6587"
      // ja: "日本語",
      // ko: "한국어",
      // fr: "Français",
      // de: "Deutsch",
      // es: "Español",
      // it: "Italiano",
      // pt: "Português",
      // tr: "Türkçe",
      // pl: "Polski",
    },
    detector: {
      storageKey: "language-preference-status",
      autoCloseTimeout: 1e4,
      expirationDays: 30,
      storagePrefix: "REVE-IMAGE"
    },
    messageRoot: "messages"
  },
  style: {
    icon: {
      // 所有图标默认颜色, 注意在SVG中fill参数填充色映射为#AC62FD
      uniformColor: "text-purple-500"
    },
    showBanner: false,
    watermark: {
      enabled: true,
      text: "\u5DFD\u5DDD\xB7\u6000\u56E0"
    }
  },
  mdxSourceDir: {
    docs: "src/mdx/docs",
    blog: "src/mdx/blog",
    legal: "src/mdx/legal"
  },
  clerk: {
    // signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
    // fallbackSignInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/",
    // signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up",
    // fallbackSignUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || "/",
    waitlistUrl: process.env.NEXT_PUBLIC_CLERK_WAITLIST_URL || "/waitlist",
    debug: process.env.CLERK_DEBUG === "true"
  }
};
var iconColor = appConfig.style.icon.uniformColor;
var watermark = appConfig.style.watermark;
var showBanner = appConfig.style.showBanner;
var generatedLocales = appConfig.i18n.locales.map((loc) => ({
  name: appConfig.i18n.localeLabels[loc],
  locale: loc
}));

// source.config.ts
var mdxSourceDir = appConfig.mdxSourceDir;
var createTitleSchema = () => z.string({
  required_error: "Title is required",
  invalid_type_error: "Title must be a string and cannot be null"
}).trim().min(1, { message: "Title cannot be empty or consist only of whitespace" });
var createDescriptionSchema = () => z.preprocess(
  (val) => {
    if (typeof val === "string") {
      return val.trim() === "" || val === null ? void 0 : val.trim();
    }
    return val === null ? void 0 : val;
  },
  z.string().optional()
);
var createIconSchema = () => z.preprocess(
  (val) => val === "" || val === null ? void 0 : val,
  z.string().optional()
);
var docs = defineDocs({
  dir: mdxSourceDir.docs,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: frontmatterSchema.extend({
      title: createTitleSchema(),
      description: createDescriptionSchema(),
      icon: createIconSchema(),
      preview: z.string().optional(),
      index: z.boolean().default(false),
      keywords: z.array(z.string()).optional(),
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
  dir: mdxSourceDir.blog,
  type: "doc",
  async: false,
  // @ts-ignore - Temporarily suppress deep instantiation error
  schema: frontmatterSchema.extend({
    title: createTitleSchema(),
    description: createDescriptionSchema(),
    author: z.string(),
    date: z.string().date().or(z.date()).optional(),
    keywords: z.array(z.string()).optional()
  })
});
var legal = defineDocs({
  dir: mdxSourceDir.legal,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: frontmatterSchema.extend({
      title: createTitleSchema(),
      description: createDescriptionSchema(),
      icon: createIconSchema(),
      preview: z.string().optional(),
      index: z.boolean().default(false),
      keywords: z.array(z.string()).optional(),
      method: z.string().optional()
    })
  },
  meta: {
    schema: metaSchema.extend({
      description: z.string().optional()
    })
  }
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
      inline: "tailing-curly-colon",
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha"
      },
      transformers: [
        // 1. 自定义 Transformer，用于从 this.options.lang 添加 data-language
        {
          name: "transformer:parse-code-language",
          pre(preNode) {
            const languageFromOptions = this.options?.lang;
            if (languageFromOptions && typeof languageFromOptions === "string" && languageFromOptions.trim() !== "") {
              if (!preNode.properties) {
                preNode.properties = {};
              }
              const langLower = languageFromOptions.toLowerCase();
              preNode.properties["data-language"] = langLower;
            }
            return preNode;
          }
        },
        // 2. Fumadocs 的默认 Transformers
        ...rehypeCodeDefaultOptions.transformers ?? [],
        // 3. 您现有的 transformer
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
    rehypePlugins: (v) => [rehypeKatex, ...v]
  }
});
export {
  blog,
  source_config_default as default,
  docs,
  legal
};
