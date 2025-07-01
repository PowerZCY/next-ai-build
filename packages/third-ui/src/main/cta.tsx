'use client'

import { GradientButton } from "@third-ui/fuma/mdx/gradient-button";
import { useTranslations } from 'next-intl';

export function CTA() {
  const t = useTranslations('cta');
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="bg-gradient-to-r from-purple-200 to-pink-300 rounded-3xl p-12 text-center text-white bg-[length:200%_auto] animate-cta-gradient-wave">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          {t('title')} <span className="text-purple-400">{t('eyesOn')}</span>?
        </h2>
        <p className="text-2xl mx-auto mb-8 text-white/80">
          {t('description1')}
          <br />
          <span className="text-purple-400">{t('description2')}</span>
        </p>
        <GradientButton
          title={t('button')}
          href={t('url')}
          align="center"
        />
      </div>
    </section>
  )
}

