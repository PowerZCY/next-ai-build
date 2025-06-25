'use client'

import { useTranslations } from 'next-intl';
import { GradientButton } from "@/fuma/mdx/gradient-button";

export function CTA() {
  const t = useTranslations('cta');
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="bg-gradient-to-r from-purple-200 to-pink-300 rounded-3xl p-12 text-center text-white bg-[length:200%_auto] animate-cta-gradient-wave">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          {t('title')} <span className="text-purple-400">{t('eyesOn')}</span>?
        </h2>
        <p className="text-xl max-w-2xl mx-auto mb-8 text-white/80">
          {t('description1')}
          <br />
          {t('description2')}
        </p>
        <GradientButton
          title={t('button')}
          href="https://preview.reve.art/"
          align="center"
        />
      </div>
    </section>
  )
}

