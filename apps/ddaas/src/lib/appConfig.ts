import { createCommonAppConfig, createI18nHelpers, LOCALE_PRESETS } from "@lib/common-app-config";
import { PricePlanAppConfig } from "@third-ui/main/price-plan";

// 创建应用配置
export const appConfig = {
  ...createCommonAppConfig(LOCALE_PRESETS.EN_ZH),
};

// 导出国际化辅助函数
export const { isSupportedLocale, getValidLocale, generatedLocales } = createI18nHelpers(appConfig.i18n);

// 便捷常量直接从 shortcuts 导出
export const { iconColor, watermark, showBanner, clerkPageBanner, clerkAuthInModal, placeHolderImage } = appConfig.shortcuts;

export const pricePlanConfig: PricePlanAppConfig = {
  billingOptions: [
    { key: 'monthly', discount: 0 },
    { key: 'yearly', discount: 0.20 }
  ],
  prices: {
    free: 'Free',
    premium: 10,
    ultimate: 20,
  },
  minPlanFeaturesCount: 4
}