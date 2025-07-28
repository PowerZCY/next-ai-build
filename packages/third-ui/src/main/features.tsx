'use client'

import { getGlobalIcon } from '@base-ui/components/global-icon';
import { useTranslations } from 'next-intl'
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { cn } from '@lib/utils';
import { richText } from '@third-ui/main/rich-text-expert';

export function Features({ sectionClassName }: { sectionClassName?: string }) {
  const t = useTranslations('features');
  
  // 直接从翻译文件获取特性列表
  const featureItems = t.raw('items') as Array<{
    title: string;
    description: string;
    iconKey: keyof typeof icons;
  }>;

  return (
    <section id="features" className={cn("px-16 py-10 mx-16 md:mx-32 scroll-mt-18", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        {t('title')} <span className="text-purple-500">{t('eyesOn')}</span>
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-base md:text-lg mx-auto whitespace-nowrap">
        {richText(t, 'description')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 gap-y-12">
        {featureItems.map((feature, index) => {
          const Icon = getGlobalIcon(feature.iconKey);
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800/60 p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition shadow-sm dark:shadow-none"
            >
              <div className="text-4xl mb-4 flex items-center justify-start">
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">{feature.title}</h3>
              <p className="text-gray-700 dark:text-gray-300">{richText(t, `items.${index}.description`)}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

