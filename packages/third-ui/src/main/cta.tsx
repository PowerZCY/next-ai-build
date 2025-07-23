'use client'

import { GradientButton } from "@third-ui/fuma/mdx/gradient-button";
import { useTranslations } from 'next-intl';
import { cn } from '@lib/utils';

export function CTA({ sectionClassName }: { sectionClassName?: string }) {
  const t = useTranslations('cta');
  return (
    <section id="cta" className={cn("px-16 py-20 mx-16 md:mx-32 scroll-mt-20", sectionClassName)}>
      <div className="
        bg-gradient-to-r from-[#f7f8fa] via-[#e0c3fc] to-[#b2fefa]
        dark:bg-gradient-to-r dark:from-[#2d0b4e] dark:via-[#6a3fa0] dark:to-[#3a185a]
        rounded-2xl p-12 text-center
        bg-[length:200%_auto] animate-cta-gradient-wave
        ">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          {t('title')} <span className="text-purple-400">{t('eyesOn')}</span>?
        </h2>
        <p className="text-2xl mx-auto mb-8">
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

