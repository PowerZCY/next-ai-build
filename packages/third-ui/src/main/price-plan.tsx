/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@lib/utils';
import { globalLucideIcons as icons } from '@base-ui/components/global-icon'
import { useRouter } from 'next/navigation';

export interface PricePlanProps {
  // default is $
  currency?: string
  pricePlanConfig: PricePlanAppConfig
  sectionClassName?: string
}

// billing definition
export interface BillingOption {
  key: string
  discount: number
}

export interface Prices {
  [key: string]: number | string
}

export interface PricePlanAppConfig {
  billingOptions: BillingOption[]
  prices: Prices
  minPlanFeaturesCount: number
}

export function PricePlan({ currency = '$', pricePlanConfig, sectionClassName }: PricePlanProps) {
  const t = useTranslations('pricePlan')
  const billingSwitch = t.raw('billingSwitch') as {
    options: Array<{
      key: string
      name: string
      unit: string
      discountText: string
      subTitle?: string
    }>
    defaultKey: string
  }
  const plans = t.raw('plans') as Array<any>
  const router = useRouter();

  // price plan config
  const billingOptions = pricePlanConfig.billingOptions
  const prices = pricePlanConfig.prices
  const minPlanFeaturesCount = pricePlanConfig.minPlanFeaturesCount

  // current billing key
  const [billingKey, setBillingKey] = useState(billingSwitch.defaultKey)

  // tooltip state
  const [tooltip, setTooltip] = useState<{
    show: boolean
    content: string
    x: number
    y: number
  }>({ show: false, content: '', x: 0, y: 0 })

  // get current billing config and display config
  const currentBilling = billingOptions.find((opt: any) => opt.key === billingKey) || billingOptions[0]
  const currentBillingDisplay = billingSwitch.options.find((opt: any) => opt.key === billingKey) || billingSwitch.options[0]

  // calculate features count
  const maxFeaturesCount = Math.max(
    ...plans.map((plan: any) => plan.features?.length || 0),
    minPlanFeaturesCount || 0
  )

  // handle card height alignment
  const getFeatureRows = (plan: any) => {
    const features = plan.features || []
    const filled = [...features]
    while (filled.length < maxFeaturesCount) filled.push(null)
    return filled
  }

  // price render logic
  function renderPrice(plan: any) {
    const priceValue = prices[plan.key];
    // current billing subTitle
    const billingSubTitle = billingSwitch.options.find((opt: any) => opt.key === billingKey)?.subTitle || '';
    // non-numeric (like 'Custom') directly display
    if (typeof priceValue !== 'number' || isNaN(priceValue)) {
      return (
        <div className="flex flex-col items-start w-full">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{priceValue}</span>
          </div>
          <div className="flex items-center gap-2 min-h-[24px] mt-1">
            <span className={cn('text-xs text-gray-700 dark:text-gray-300 font-medium', plan.showBillingSubTitle === false && 'opacity-0 select-none')}>
              {plan.showBillingSubTitle === false ? '' : billingSubTitle}
            </span>
          </div>
        </div>
      );
    }
    // numeric price logic
    const originValue = Number(priceValue)
    const discount = currentBilling.discount
    const hasDiscount = discount !== 0
    const saleValue = originValue * (1 - discount)
    // format price, keep 2 decimal places but remove trailing 0
    const formatPrice = (v: number) => Number(v.toFixed(2)).toString()
    const unit = currentBillingDisplay.unit || ''
    let discountText = ''
    if (hasDiscount && currentBillingDisplay.discountText) {
      discountText = currentBillingDisplay.discountText.replace('{percent}', String(Math.round(Math.abs(discount) * 100)))
    }
    // show NaN when price is negative
    const showNaN = saleValue < 0
    return (
      <div className="flex flex-col items-start w-full">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
            {currency}{showNaN ? 'NaN' : (hasDiscount ? formatPrice(saleValue) : formatPrice(originValue))}
          </span>
          <span className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-1">{unit}</span>
        </div>
        {/* sub title row, always take place */}
        <div className="flex items-center gap-2 min-h-[24px] mt-1">
          {hasDiscount && (
            <>
              <span className="text-base text-gray-400 line-through">{currency}{showNaN ? 'NaN' : formatPrice(originValue)}</span>
              {discountText && (
                <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-semibold align-middle">{discountText}</span>
              )}
            </>
          )}
          <span className={cn('text-xs text-gray-700 dark:text-gray-300 font-medium', plan.showBillingSubTitle === false && 'opacity-0 select-none')}>
            {plan.showBillingSubTitle === false ? '' : billingSubTitle}
          </span>
        </div>
      </div>
    )
  }

  // tooltip component
  const Tooltip = ({ show, content, x, y }: typeof tooltip) => {
    if (!show) return null
    // simple boundary handling, prevent overflow
    const style: React.CSSProperties = {
      position: 'fixed',
      left: Math.max(8, x),
      top: Math.max(8, y),
      zIndex: 9999,
      maxWidth: 200,
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      whiteSpace: 'pre-line',
    }
    return (
      <div 
        style={style}
        className="bg-gray-700 dark:bg-gray-200 text-gray-100 dark:text-gray-800 text-xs leading-relaxed px-3 py-2 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 backdrop-blur-sm"
      >
        {content}
      </div>
    )
  }

  return (
    <section id="pricing" className={cn("px-4 py-10 md:px-16 md:py-16 mx-auto max-w-7xl scroll-mt-10", sectionClassName)}>
      {/* title and subtitle */}
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
        {t('title')}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-base md:text-lg mx-auto">
        {t('subtitle')}
      </p>

      {/* billing switch button */}
      <div className="flex justify-center items-center gap-8 mb-12">
        {/* Monthly area */}
        <div className="flex flex-row-reverse items-center gap-2 w-[180px] justify-end">
          <button
            className={cn(
              'min-w-[120px] px-6 py-2 rounded-full font-medium border transition text-lg',
              billingKey === 'monthly'
                ? 'text-white bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-purple-400',
              'mr-4'
            )}
            onClick={() => setBillingKey('monthly')}
            type="button"
          >
            {(billingSwitch.options.find((opt: any) => opt.key === 'monthly')?.name) || 'Monthly'}
          </button>
          {/* tag (from right to left), invisible when not selected */}
          {(() => {
            const opt = billingSwitch.options.find((opt: any) => opt.key === 'monthly');
            const bOpt = billingOptions.find((opt: any) => opt.key === 'monthly');
            if (!(opt && bOpt && opt.discountText && bOpt.discount !== 0)) return <span className="min-w-[80px] px-2 py-1 text-xs rounded invisible"></span>;
            return (
              <span className={cn(
                "min-w-[80px] px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-semibold align-middle text-center inline-flex items-center justify-center whitespace-nowrap",
                billingKey !== 'monthly' && 'invisible'
              )}>
                {opt.discountText.replace(
                  '{percent}',
                  String(Math.round(Math.abs(bOpt.discount) * 100))
                )}
              </span>
            );
          })()}
        </div>
        {/* Yearly area */}
        <div className="flex items-center gap-2 w-[180px] justify-start">
          <button
            className={cn(
              'min-w-[120px] px-6 py-2 rounded-full font-medium border transition text-lg',
              billingKey === 'yearly'
                ? 'text-white bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-purple-400',
              'ml-4'
            )}
            onClick={() => setBillingKey('yearly')}
            type="button"
          >
            {(billingSwitch.options.find((opt: any) => opt.key === 'yearly')?.name) || 'Yearly'}
          </button>
          {/* tag (from left to right), invisible when not selected */}
          {(() => {
            const opt = billingSwitch.options.find((opt: any) => opt.key === 'yearly');
            const bOpt = billingOptions.find((opt: any) => opt.key === 'yearly');
            if (!(opt && bOpt && opt.discountText && bOpt.discount !== 0)) return <span className="min-w-[80px] px-2 py-1 text-xs rounded invisible"></span>;
            return (
              <span className={cn(
                "min-w-[80px] px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-semibold align-middle text-center inline-flex items-center justify-center whitespace-nowrap",
                billingKey !== 'yearly' && 'invisible'
              )}>
                {opt.discountText.replace(
                  '{percent}',
                  String(Math.round(Math.abs(bOpt.discount) * 100))
                )}
              </span>
            );
          })()}
        </div>
      </div>

      {/* price card area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan: any, _idx: number) => (
          <div
            key={plan.key}
            className={cn(
              'flex flex-col bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-300 dark:border-[#7c3aed40] transition p-8 h-full shadow-sm dark:shadow-none',
              'hover:border-2 hover:border-purple-500',
              'focus-within:border-2 focus-within:border-purple-500'
            )}
            style={{ minHeight: maxFeaturesCount*100 }}
          >
            {/* main title and tag */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{plan.title}</span>
              {plan.titleTags && plan.titleTags.map((tag: string, i: number) => (
                <span key={i} className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-semibold align-middle">{tag}</span>
              ))}
            </div>
            {/* price and unit/discount */}
            {renderPrice(plan)}
            {/* feature list */}
            <ul className="flex-1 mb-6 mt-4">
              {getFeatureRows(plan).map((feature: any, i: number) => (
                <li key={i} className="flex items-center gap-2 mb-2 min-h-[28px]">
                  {/* icon */}
                  {feature ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 mr-1">
                      {feature.icon ? <span>{feature.icon}</span> : <span className="font-bold">✓</span>}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-1">&nbsp;</span>
                  )}
                  {/* tag */}
                  {feature && feature.tag && (
                    <span className="px-1 py-0.5 text-[6px] rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-semibold align-middle">{feature.tag}</span>
                  )}
                  {/* description + tooltip */}
                  {feature ? (
                    <span className="relative group cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                      {feature.description}
                      {feature.tooltip && (
                        <span
                          className="ml-1 align-middle inline-flex"
                          onMouseEnter={e => {
                            setTooltip({
                              show: true,
                              content: feature.tooltip,
                              x: e.clientX,
                              y: e.clientY
                            })
                          }}
                          onMouseMove={e => {
                            setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))
                          }}
                          onMouseLeave={() => setTooltip(t => ({ ...t, show: false }))}
                        >
                          <icons.FAQ className="w-4 h-4" />
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </li>
              ))}
            </ul>
            {/* placeholder, ensure card height consistency */}
            <div className="flex-1" />
            {/* button */}
            <button
              className={cn(
                'w-full py-2 mt-auto text-white text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-full',
                plan.button?.disabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 dark:hover:to-pink-700'
              )}
              disabled={plan.button?.disabled}
              type="button"
              onClick={() => {
                if (!plan.button?.disabled) {
                  router.push('/');
                }
              }}
            >
              {plan.button?.text || '--'}
            </button>
          </div>
        ))}
      </div>
      {/* tooltip hover msg */}
      <Tooltip {...tooltip} />
    </section>
  )
} 