import { createCommonAppConfig, createI18nHelpers, LOCALE_PRESETS } from "@lib/common-app-config";

// create app config
export const appConfig = {
  ...createCommonAppConfig(LOCALE_PRESETS.EN_ZH),
  creditsConfig: {
    freeAmount: 1,
    freeRegisterAmount: 2,
    freeExpiredDays: 7,
    oneTimeExpiredDays: 30
  }
};

// export i18n helpers
export const { isSupportedLocale, getValidLocale, generatedLocales } = createI18nHelpers(appConfig.i18n);

// export shortcuts
export const { iconColor, watermark, showBanner, clerkPageBanner, clerkAuthInModal, placeHolderImage } = appConfig.shortcuts;

export const { freeAmount, freeRegisterAmount, freeExpiredDays, oneTimeExpiredDays } = appConfig.creditsConfig;
