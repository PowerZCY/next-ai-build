import { createCommonAppConfig, createI18nHelpers, LOCALE_PRESETS } from "@windrun-huaiin/lib/common-app-config";
import { createMDXComponents } from "@windrun-huaiin/third-ui/fuma";

// 创建应用配置
export const appConfig = {
  ...createCommonAppConfig(LOCALE_PRESETS.EN_ZH),
};

// 导出国际化辅助函数
export const { isSupportedLocale, getValidLocale, generatedLocales } = createI18nHelpers(appConfig.i18n);

// 便捷常量直接从 shortcuts 导出
export const { iconColor, watermark, showBanner, clerkPageBanner, clerkAuthInModal, placeHolderImage } = appConfig.shortcuts;

// 创建预配置的 MDX 组件
export const getMDXComponents = createMDXComponents({
  watermark: {
    enabled: watermark.enabled,
    text: watermark.text
  },
  githubBaseUrl: appConfig.githubBaseUrl,
  cdnBaseUrl: appConfig.style.cdnBaseUrl,
  placeHolderImage: placeHolderImage
});

// Fumadocs 期望的函数名
export const useMDXComponents = getMDXComponents;