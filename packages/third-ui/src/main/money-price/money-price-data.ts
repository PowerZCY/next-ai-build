import { getTranslations } from 'next-intl/server';
import type { MoneyPriceData } from './money-price-types';

interface BuildMoneyPriceDataOptions {
  locale: string;
  currency: string;
  enabledBillingTypes?: string[];
}

interface BillingOption {
  key: string;
  name: string;
  unit: string;
  discountText: string;
  subTitle?: string;
}

export async function buildMoneyPriceData({
  locale,
  currency,
  enabledBillingTypes,
}: BuildMoneyPriceDataOptions): Promise<MoneyPriceData> {
  const t = await getTranslations({ locale, namespace: 'moneyPrice' });

  const allOptions = t.raw('billingSwitch.options') as BillingOption[];
  const options = enabledBillingTypes?.length
    ? allOptions.filter((option) => enabledBillingTypes.includes(option.key))
    : allOptions;

  return {
    title: t('title'),
    subtitle: t('subtitle'),
    billingSwitch: {
      options,
      defaultKey: t('billingSwitch.defaultKey'),
    },
    subscriptionPlans: t.raw('subscription.plans') as Array<any>,
    creditsPlans: t.raw('credits.plans') as Array<any>,
    buttonTexts: t.raw('buttonTexts') as {
      getStarted: string;
      getPro: string;
      getUltra: string;
      currentPlan: string;
      upgrade: string;
      buyCredits: string;
    },
    currency,
  };
}
