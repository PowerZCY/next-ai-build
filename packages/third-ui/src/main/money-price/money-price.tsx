import { cn } from '@windrun-huaiin/lib/utils';
import { getTranslations } from 'next-intl/server';
import { MoneyPriceInteractive } from './money-price-interactive';
import type { MoneyPriceProps, MoneyPriceData } from './money-price-types';

export async function MoneyPrice({
  locale,
  config,
  upgradeApiEndpoint,
  signInPath,
  sectionClassName,
  enabledBillingTypes,
  mode
}: MoneyPriceProps) {
  const t = await getTranslations({ locale, namespace: 'moneyPrice' });
  
  // 获取完整的 billingSwitch 配置，然后根据 enabledBillingTypes 过滤
  const getBillingSwitch = () => {
    const allOptions = t.raw('billingSwitch.options') as Array<{
      key: string;
      name: string;
      unit: string;
      discountText: string;
      subTitle?: string;
    }>;

    // 如果指定了 enabledBillingTypes，则过滤选项
    if (enabledBillingTypes?.length) {
      const filteredOptions = allOptions.filter(option =>
        enabledBillingTypes.includes(option.key)
      );

      return {
        options: filteredOptions,
        defaultKey: t('billingSwitch.defaultKey')
      };
    }

    // 否则返回所有选项
    return {
      options: allOptions,
      defaultKey: t('billingSwitch.defaultKey')
    };
  };

  const data: MoneyPriceData = {
    title: t('title'),
    subtitle: t('subtitle'),
    billingSwitch: getBillingSwitch() as {
      options: Array<{
        key: string;
        name: string;
        unit: string;
        discountText: string;
        subTitle?: string;
      }>;
      defaultKey: string;
    },
    subscriptionPlans: t.raw('subscription.plans') as Array<any>,
    creditsPlans: t.raw('credits.plans') as Array<any>,
    buttonTexts: t.raw('buttonTexts') as {
      getStarted: string;
      getPro: string;
      getUltra: string;
      currentPlan: string;
      upgrade: string;
    },
    currency: config.display.currency
  };

  return (
    <section id="money-pricing" className={cn("px-4 py-10 md:px-16 md:py-16 mx-auto max-w-7xl scroll-mt-10", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
        {data.title}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-base md:text-lg mx-auto">
        {data.subtitle}
      </p>
      <MoneyPriceInteractive
        data={data}
        config={config}
        upgradeApiEndpoint={upgradeApiEndpoint}
        signInPath={signInPath}
        enabledBillingTypes={enabledBillingTypes}
        mode={mode}
      />
    </section>
  );
}
