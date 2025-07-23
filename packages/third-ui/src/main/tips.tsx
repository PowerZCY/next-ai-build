'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@lib/utils';

interface Tip {
  title: string;
  description: string;
}

export function Tips({ sectionClassName }: { sectionClassName?: string }) {
  const t = useTranslations('tips');
  const sections = t.raw('sections') as Tip[];
  
  const midPoint = Math.ceil(sections.length / 2);
  const leftColumn = sections.slice(0, midPoint);
  const rightColumn = sections.slice(midPoint);

  return (
    <section id="tips" className={cn("px-16 py-10 mx-16 md:mx-32 scroll-mt-20", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
        {t('title')} <span className="text-purple-500">{t('eyesOn')}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 md:p-12 shadow-sm dark:shadow-none">
        {[leftColumn, rightColumn].map((column: Tip[], colIndex) => (
          <div key={colIndex} className="space-y-8">
            {column.map((tip: Tip, tipIndex) => (
              <div key={tipIndex} className="space-y-4">
                <h3 className="text-2xl font-semibold">{tip.title}</h3>
                <p className="">{tip.description}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

