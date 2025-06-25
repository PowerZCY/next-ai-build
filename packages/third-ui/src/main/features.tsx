'use client'

import { useTranslations } from 'next-intl'

export function Features() {
  const t = useTranslations('features');
  
  // 直接从翻译文件获取特性列表
  const featureItems = t.raw('items') as Array<{
    title: string;
    description: string;
    icon: string;
  }>;

  return (
    <section id="features" className="container mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
        {t('title')} <span className="text-purple-500">{t('eyesOn')}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featureItems.map((feature, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
            <p className="">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

