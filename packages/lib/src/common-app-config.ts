// 所有支持的语言及其标签
const ALL_LOCALE_LABELS = {
  en: "English",
  zh: "简体中文",
  ja: "日本語", 
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  tr: "Türkçe",
  pl: "Polski",
  ru: "Русский",
  ar: "العربية",
  hi: "हिन्दी",
  th: "ไทย",
  vi: "Tiếng Việt",
} as const;

export type SupportedLocale = keyof typeof ALL_LOCALE_LABELS;

// 从环境变量获取语言配置的辅助函数
function getLocaleLabels(locales: string[]) {
  return Object.fromEntries(
    locales.map(locale => [
      locale, 
      ALL_LOCALE_LABELS[locale as SupportedLocale] || locale
    ])
  );
}

// 通用应用配置创建函数
export function createCommonAppConfig(options?: {
  // 可选：手动指定支持的语言，如果不指定则从环境变量读取
  locales?: string[];
  defaultLocale?: string;
}) {
  // 优先级：手动配置 > 环境变量 > 默认值
  const locales = options?.locales ?? 
                  process.env.NEXT_PUBLIC_I18N_LOCALES?.split(',').map(s => s.trim()) ?? 
                  ['en', 'zh'];
  
  const defaultLocale = options?.defaultLocale ?? 
                        process.env.NEXT_PUBLIC_I18N_DEFAULT_LOCALE ?? 
                        'en';
  
  const storagePrefix = process.env.NEXT_PUBLIC_I18N_STORAGE_PREFIX || 'WINDRUN-HUAIIN';

  const config = {
    // 基础配置
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
    githubBaseUrl: process.env.NEXT_PUBLIC_GITHUB_BASE_URL || '',
    github: process.env.NEXT_PUBLIC_GITHUB || '',

    // 国际化配置
    i18n: {
      locales: locales as readonly string[],
      defaultLocale,
      localeLabels: getLocaleLabels(locales),
      detector: {
        storageKey: process.env.NEXT_PUBLIC_I18N_STORAGE_KEY || 'language-preference-status',
        autoCloseTimeout: parseInt(process.env.NEXT_PUBLIC_I18N_AUTO_CLOSE_TIMEOUT || '10000'),
        expirationDays: parseInt(process.env.NEXT_PUBLIC_I18N_EXPIRATION_DAYS || '30'),
        storagePrefix
      },
      messageRoot: process.env.NEXT_PUBLIC_I18N_MESSAGE_ROOT || 'messages',
    },

    // 样式配置
    style: {
      icon: {
        uniformColor: process.env.NEXT_PUBLIC_STYLE_ICON_COLOR || "text-purple-500"
      },
      showBanner: process.env.NEXT_PUBLIC_STYLE_SHOW_BANNER === 'true',
      clerkAuthInModal: process.env.NEXT_PUBLIC_STYLE_CLERK_AUTH_IN_MODAL === 'true',
      clerkPageBanner: process.env.NEXT_PUBLIC_STYLE_CLERK_PAGE_BANNER === 'true',
      watermark: {
        enabled: process.env.NEXT_PUBLIC_STYLE_WATERMARK_ENABLED === 'true',
        text: process.env.NEXT_PUBLIC_STYLE_WATERMARK_TEXT || "巽川·怀因"
      },
      cdnBaseUrl: process.env.NEXT_PUBLIC_STYLE_CDN_BASE_URL || "https://raw.githubusercontent.com/caofanCPU/wind-run-1/main/public",
      placeHolder: {
        image: process.env.NEXT_PUBLIC_STYLE_PLACEHOLDER_IMAGE || "/default.webp"
      }
    },

    // Clerk 配置
    clerk: {
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
      fallbackSignInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/",
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up", 
      fallbackSignUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || "/",
      waitlistUrl: process.env.NEXT_PUBLIC_CLERK_WAITLIST_URL || "/waitlist",
      debug: process.env.CLERK_DEBUG === 'true',
    },

    // MDX 源文件目录配置
    mdxSourceDir: {
      docs: process.env.NEXT_PUBLIC_MDX_DOCS_DIR || "src/mdx/docs",
      blog: process.env.NEXT_PUBLIC_MDX_BLOG_DIR || "src/mdx/blog", 
      legal: process.env.NEXT_PUBLIC_MDX_LEGAL_DIR || "src/mdx/legal"
    }
  };

  // 便捷常量 - 避免深层嵌套访问
  const shortcuts = {
    iconColor: config.style.icon.uniformColor,
    watermark: config.style.watermark,
    showBanner: config.style.showBanner,
    clerkPageBanner: config.style.clerkPageBanner,
    clerkAuthInModal: config.style.clerkAuthInModal,
    placeHolderImage: config.style.placeHolder.image,
    clerk: config.clerk,
  };

  return {
    ...config,
    shortcuts
  };
}

// 创建国际化辅助函数
export function createI18nHelpers(i18nConfig: ReturnType<typeof createCommonAppConfig>['i18n']) {
  function isSupportedLocale(locale: string): locale is typeof i18nConfig.locales[number] {
    return (i18nConfig.locales as readonly string[]).includes(locale);
  }

  function getValidLocale(locale: string): typeof i18nConfig.locales[number] {
    return isSupportedLocale(locale) ? locale : i18nConfig.defaultLocale;
  }

  const generatedLocales = i18nConfig.locales.map((loc) => ({
    name: i18nConfig.localeLabels[loc as keyof typeof i18nConfig.localeLabels] || loc,
    locale: loc,
  }));

  return {
    isSupportedLocale,
    getValidLocale,
    generatedLocales
  };
}

// 便捷的配置预设
export const LOCALE_PRESETS = {
  // 只支持英文
  EN_ONLY: { locales: ['en'] as string[], defaultLocale: 'en' as string },
  
  // 中英双语
  EN_ZH: { locales: ['en', 'zh'] as string[], defaultLocale: 'en' as string },
  
  // 亚洲主要语言
  ASIA: { locales: ['en', 'zh', 'ja', 'ko'] as string[], defaultLocale: 'en' as string },
  
  // 欧洲主要语言
  EUROPE: { locales: ['en', 'fr', 'de', 'es', 'it'] as string[], defaultLocale: 'en' as string },
  
  // 全球化
  GLOBAL: { locales: ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'it', 'pt', 'ru'] as string[], defaultLocale: 'en' as string },
  
  // 无国际化（只有默认语言）
  NONE: { locales: [] as string[], defaultLocale: 'en' as string }
}; 