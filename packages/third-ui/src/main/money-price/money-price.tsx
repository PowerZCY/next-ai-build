import { cn } from '@windrun-huaiin/lib/utils';
import { getTranslations } from 'next-intl/server';
import { MoneyPriceInteractive } from './money-price-interactive';
import type { MoneyPriceProps, MoneyPriceData } from './money-price-types';

export async function MoneyPrice({ 
  locale, 
  config,
  upgradeApiEndpoint,
  signInPath,
  sectionClassName
}: MoneyPriceProps) {
  const t = await getTranslations({ locale, namespace: 'moneyPrice' });
  
  const data: MoneyPriceData = {
    title: t('title'),
    subtitle: t('subtitle'),
    billingSwitch: t.raw('billingSwitch') as {
      options: Array<{
        key: string;
        name: string;
        unit: string;
        discountText: string;
        subTitle?: string;
      }>;
      defaultKey: string;
    },
    plans: t.raw('plans') as Array<any>,
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
      />
    </section>
  );
}
