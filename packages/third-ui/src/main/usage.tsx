'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@lib/utils';
import { globalLucideIcons as icons, getGlobalIcon } from '@base-ui/components/global-icon'
import { richText } from '@third-ui/main/rich-text-expert';

export function Usage({ sectionClassName }: { sectionClassName?: string }) {
  const t = useTranslations('usage');
  const steps = t.raw('steps') as Array<{
    title: string;
    description: string;
    iconKey: keyof typeof icons;
  }>;

  return (
    <section id="usage" className={cn("px-16 py-10 mx-16 md:mx-32 scroll-mt-20", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        {t('title')} <span className="text-purple-500">{t('eyesOn')}</span>
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-base md:text-lg mx-auto whitespace-nowrap">
        {richText(t, 'description')}
      </p>
      <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 md:p-12 shadow-sm dark:shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 gap-y-12">
          {steps.map((step, idx) => {
            const Icon = getGlobalIcon(step.iconKey);
            return (
              <div key={idx} className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <Icon className="w-8 h-8 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                    {`${idx + 1}. ${step.title}`}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{richText(t, `steps.${idx}.description`)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

