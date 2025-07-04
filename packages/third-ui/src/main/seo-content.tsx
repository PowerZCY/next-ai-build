/* eslint-disable react/no-unescaped-entities */
'use client'

import { useTranslations } from 'next-intl'

interface Section {
  title: string;
  content: string;
}

export function SeoContent() {
  const t = useTranslations('seoContent');

  return (
    <section id="seo" className="container mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
        {t('title')} <span className="text-purple-500">{t('eyesOn')}</span>
      </h2>
      <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
        <p>{t('intro')}</p>

        {t.raw('sections').map((section: Section, index: number) => (
          <div key={index}>
            <h3>{t(`sections.${index}.title`)}</h3>
            <p>{t(`sections.${index}.content`)}</p>
          </div>
        ))}

        <p>{t('conclusion')}</p>
      </div>
    </section>
  )
}

