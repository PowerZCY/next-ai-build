/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from '@windrun-huaiin/lib/utils';
import { getTranslations } from 'next-intl/server';
import { getActiveProviderConfig } from './money-price-config-util';
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

  const providerConfig = getActiveProviderConfig(config);
  const minPlanFeaturesCount = config.display.minFeaturesCount;

  const defaultBilling = data.billingSwitch.defaultKey;
  const defaultBillingDisplay = data.billingSwitch.options.find(
    (opt: any) => opt.key === defaultBilling
  ) || data.billingSwitch.options[0];

  const maxFeaturesCount = Math.max(
    ...data.plans.map((plan: any) => plan.features?.length || 0),
    minPlanFeaturesCount || 0
  );

  const getFeatureRows = (plan: any) => {
    const features = plan.features || [];
    const filled = [...features];
    while (filled.length < maxFeaturesCount) filled.push(null);
    return filled;
  };

  function renderPrice(plan: any, billingKey = data.billingSwitch.defaultKey) {
    const productConfig = providerConfig.products[plan.key as 'free' | 'pro' | 'ultra'];
    const pricing = productConfig.plans[billingKey as 'monthly' | 'yearly'];
    const currentBillingDisplay = data.billingSwitch.options.find(
      (opt: any) => opt.key === billingKey
    ) || defaultBillingDisplay;
    const billingSubTitle = currentBillingDisplay?.subTitle || '';
    
    if (pricing.amount === 0) {
      return (
        <div className="flex flex-col items-start w-full" data-price-container={plan.key}>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100" data-price-value={plan.key}>
              Free
            </span>
          </div>
          <div className="flex items-center gap-2 min-h-[24px] mt-1">
            <span className={cn('text-xs text-gray-700 dark:text-gray-300 font-medium', 
              plan.showBillingSubTitle === false && 'opacity-0 select-none')} 
              data-price-subtitle={plan.key}>
              {plan.showBillingSubTitle === false ? '' : billingSubTitle}
            </span>
          </div>
        </div>
      );
    }
    
    const hasDiscount = pricing.discountPercent && pricing.discountPercent > 0;
    const unit = currentBillingDisplay.unit || '';
    let discountText = '';
    
    if (hasDiscount && currentBillingDisplay.discountText) {
      discountText = currentBillingDisplay.discountText.replace(
        '{percent}', 
        String(pricing.discountPercent)
      );
    }
    
    return (
      <div className="flex flex-col items-start w-full" data-price-container={plan.key}>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100" data-price-value={plan.key}>
            {data.currency}{pricing.amount}
          </span>
          <span className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-1" data-price-unit={plan.key}>
            {unit}
          </span>
        </div>
        <div className="flex items-center gap-2 min-h-[24px] mt-1">
          {hasDiscount && pricing.originalAmount && (
            <>
              <span className="text-base text-gray-400 line-through" data-price-original={plan.key}>
                {data.currency}{pricing.originalAmount}
              </span>
              {discountText && (
                <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-semibold align-middle" 
                  data-price-discount={plan.key}>
                  {discountText}
                </span>
              )}
            </>
          )}
          <span className={cn('text-xs text-gray-700 dark:text-gray-300 font-medium', 
            plan.showBillingSubTitle === false && 'opacity-0 select-none')} 
            data-price-subtitle={plan.key}>
            {plan.showBillingSubTitle === false ? '' : billingSubTitle}
          </span>
        </div>
      </div>
    );
  }

  return (
    <section id="money-pricing" className={cn("px-4 py-10 md:px-16 md:py-16 mx-auto max-w-7xl scroll-mt-10", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
        {data.title}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-base md:text-lg mx-auto">
        {data.subtitle}
      </p>

      <div className="flex flex-col items-center">
        <div className="flex items-center relative mb-3">
          <div className="flex bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-full p-1" data-billing-switch>
            <button
              className={cn(
                'min-w-[120px] px-6 py-2 font-medium transition text-lg relative',
                data.billingSwitch.defaultKey === 'monthly'
                  ? 'text-white bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 rounded-full shadow-sm'
                  : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 rounded-full'
              )}
              data-billing-button="monthly"
              type="button"
            >
              {(data.billingSwitch.options.find((opt: any) => opt.key === 'monthly')?.name) || 'Monthly'}
            </button>
            <button
              className={cn(
                'min-w-[120px] px-6 py-2 font-medium transition text-lg relative',
                data.billingSwitch.defaultKey === 'yearly'
                  ? 'text-white bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 rounded-full shadow-sm'
                  : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 rounded-full'
              )}
              data-billing-button="yearly"
              type="button"
            >
              {(data.billingSwitch.options.find((opt: any) => opt.key === 'yearly')?.name) || 'Yearly'}
            </button>
          </div>
        </div>
        
        <div className="h-8 flex items-center justify-center mb-3" data-discount-info>
          {(() => {
            const opt = data.billingSwitch.options.find((opt: any) => opt.key === data.billingSwitch.defaultKey);
            
            let hasDiscount = false;
            let discountPercent = 0;
            
            ['pro', 'ultra'].forEach(planKey => {
              const product = providerConfig.products[planKey as 'pro' | 'ultra'];
              const pricing = product.plans[data.billingSwitch.defaultKey as 'monthly' | 'yearly'];
              if (pricing.discountPercent) {
                hasDiscount = true;
                discountPercent = pricing.discountPercent;
              }
            });
            
            if (!(opt && hasDiscount && opt.discountText)) return null;
            
            return (
              <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-semibold align-middle text-center inline-flex items-center justify-center whitespace-nowrap">
                {opt.discountText.replace(
                  '{percent}',
                  String(discountPercent)
                )}
              </span>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {data.plans.map((plan: any, _idx: number) => (
          <div
            key={plan.key}
            data-price-plan={plan.key}
            className={cn(
              'flex flex-col bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-300 dark:border-[#7c3aed40] transition p-8 h-full shadow-sm dark:shadow-none',
              'hover:border-2 hover:border-purple-500',
              'focus-within:border-2 focus-within:border-purple-500'
            )}
            style={{ minHeight: maxFeaturesCount*100 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{plan.title}</span>
              {plan.titleTags && plan.titleTags.map((tag: string, i: number) => (
                <span key={i} className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-semibold align-middle">
                  {tag}
                </span>
              ))}
            </div>
            
            {renderPrice(plan)}
            
            <ul className="flex-1 mb-6 mt-4">
              {getFeatureRows(plan).map((feature: any, i: number) => (
                <li key={i} className="flex items-center gap-2 mb-2 min-h-[28px]" data-feature-item={`${plan.key}-${i}`}>
                  {feature ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 mr-1">
                      {feature.icon ? <span>{feature.icon}</span> : <span className="font-bold">✓</span>}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-1">&nbsp;</span>
                  )}
                  {feature && feature.tag && (
                    <span className="px-1 py-0.5 text-[6px] rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-semibold align-middle">
                      {feature.tag}
                    </span>
                  )}
                  {feature ? (
                    <span className="relative group cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                      {feature.description}
                      {feature.tooltip && (
                        <span
                          className="ml-1 align-middle inline-flex"
                          data-tooltip-trigger={`${plan.key}-${i}`}
                          data-tooltip-content={feature.tooltip}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </li>
              ))}
            </ul>
            
            <div className="flex-1" />
            
            <div data-button-placeholder={plan.key} className="w-full">
              {/* MoneyPriceInteractive will render the button here */}
            </div>
          </div>
        ))}
      </div>
      
      <MoneyPriceInteractive 
        data={data}
        config={config}
        upgradeApiEndpoint={upgradeApiEndpoint}
        signInPath={signInPath}
      />
    </section>
  );
}