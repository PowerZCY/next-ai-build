// src/lib/appConfig.ts
var appConfig = {
  // 基础配置
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://ddaas.de8ger.com",
  githubBaseUrl: process.env.NEXT_PUBLIC_GITHUB_BASE_URL || "https://github.com/PowerZCY/next-ai-build/blob/main/",
  github: process.env.NEXT_PUBLIC_GITHUB || "https://github.com/PowerZCY/next-ai-build/",
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
      uniformColor: process.env.NEXT_PUBLIC_STYLE_ICON_COLOR || "text-purple-500"
    },
    showBanner: process.env.NEXT_PUBLIC_STYLE_SHOW_BANNER === "true",
    clerkAuthInModal: process.env.NEXT_PUBLIC_STYLE_CLERK_AUTH_IN_MODAL === "true",
    clerkPageBanner: process.env.NEXT_PUBLIC_STYLE_CLERK_PAGE_BANNER === "true",
    watermark: {
      // 只有NEXT_PUBLIC_的变量才能被client组件访问!
      enabled: process.env.NEXT_PUBLIC_STYLE_WATERMARK_ENABLED === "true",
      text: process.env.NEXT_PUBLIC_STYLE_WATERMARK_TEXT || "\u5DFD\u5DDD\xB7\u6000\u56E0"
    },
    placeHolder: {
      image: "/default.webp"
    }
  },
  mdxSourceDir: {
    docs: "src/mdx/docs",
    blog: "src/mdx/blog",
    legal: "src/mdx/legal"
  },
  clerk: {
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
    fallbackSignInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/",
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up",
    fallbackSignUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || "/",
    waitlistUrl: process.env.NEXT_PUBLIC_CLERK_WAITLIST_URL || "/waitlist",
    debug: process.env.CLERK_DEBUG === "true"
  }
};
var iconColor = appConfig.style.icon.uniformColor;
var watermark = appConfig.style.watermark;
var showBanner = appConfig.style.showBanner;
var clerkPageBanner = appConfig.style.clerkPageBanner;
var clerkAuthInModal = appConfig.style.clerkAuthInModal;
var placeHolderImage = appConfig.style.placeHolder.image;
var generatedLocales = appConfig.i18n.locales.map((loc) => ({
  name: appConfig.i18n.localeLabels[loc],
  locale: loc
}));

// source.config.ts
import { rehypeCodeDefaultOptions, remarkSteps } from "fumadocs-core/mdx-plugins";
import { fileGenerator, remarkDocGen, remarkInstall } from "fumadocs-docgen";
import { remarkTypeScriptToJavaScript } from "fumadocs-docgen/remark-ts2js";
import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from "fumadocs-mdx/config";
import { remarkAutoTypeTable } from "fumadocs-typescript";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { z } from "zod";
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
var createDateSchema = () => z.preprocess(
  (arg) => {
    if (arg instanceof Date) {
      const year = arg.getFullYear();
      const month = (arg.getMonth() + 1).toString().padStart(2, "0");
      const day = arg.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    if (typeof arg === "string") {
      return arg.trim();
    }
    return arg;
  },
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format or a valid Date object").refine((val) => !isNaN(new Date(val).getTime()), "Invalid date!")
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
var blog = defineDocs({
  dir: mdxSourceDir.blog,
  docs: {
    async: false,
    // @ts-ignore - Temporarily suppress deep instantiation error
    schema: frontmatterSchema.extend({
      title: createTitleSchema(),
      description: createDescriptionSchema(),
      author: z.string().optional(),
      date: createDateSchema(),
      keywords: z.array(z.string()).optional()
    })
  },
  meta: {
    schema: metaSchema.extend({
      description: z.string().optional()
    })
  }
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
    // 禁用 remark-image 的默认行为, 图片统一使用远程URL
    remarkImageOptions: false,
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
        // /core/src/mdx-plugins/rehype-code.ts, 定义了: 行高亮、单词高亮、Diff高亮、代码聚焦、从元数据上解析代码行编号
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
    // packages/core/src/server/get-toc.ts, remark().use(remarkPlugins).use(remarkHeading)
    // 关于目录Heading的处理, FumaDocs底层已经指定了顺序: 用户指定的remarkPlugins先执行, 然后执行remarkHeading, 最后交由渲染Page调用toc-clerk.tsx逻辑
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
