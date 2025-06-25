'use client'

import { useTranslations } from 'next-intl'

interface Tip {
  title: string;
  description: string;
}

export function Tips() {
  const t = useTranslations('tips');
  const sections = t.raw('sections') as Tip[];
  
  const midPoint = Math.ceil(sections.length / 2);
  const leftColumn = sections.slice(0, midPoint);
  const rightColumn = sections.slice(midPoint);

  return (
    <section id="tips" className="container mx-auto px-4 py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl my-20 border border-gray-200 dark:border-transparent">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
        {t('title')} <span className="text-purple-500">{t('eyesOn')}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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

