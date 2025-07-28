/* eslint-disable react/no-unescaped-entities */
'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@lib/utils';
import { richText } from '@third-ui/main/rich-text-expert';

interface Section {
  title: string;
  content: string;
}

export function SeoContent({ sectionClassName }: { sectionClassName?: string }) {
  const t = useTranslations('seoContent');

  return (
    <section id="seo" className={cn("px-16 py-10 mx-16 md:mx-32 scroll-mt-20", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
        {t('title')} <span className="text-purple-500">{t('eyesOn')}</span>
      </h2>
      <h3 className="text-center text-gray-600 dark:text-gray-400 mb-12 text-lg">
        {t('description')}
      </h3>
      <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 md:p-12 shadow-sm dark:shadow-none">
        <div className="space-y-10">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {richText(t, 'intro')}
          </p>
          {t.raw('sections').map((section: Section, index: number) => (
            <div key={index}>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                {section.title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">{richText(t, `sections.${index}.content`)}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-gray-600 dark:text-gray-400 text-lg">
          {richText(t, 'conclusion')}
        </p>
      </div>
    </section>
  )
}

