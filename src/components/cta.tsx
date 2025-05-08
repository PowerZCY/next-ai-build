'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { globalLucideIcons as icons } from "@/components/global-icon"
import { useTranslations } from 'next-intl'

export function CTA() {
  const t = useTranslations('cta');
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="bg-gradient-to-r from-purple-200 to-pink-300 rounded-3xl p-12 text-center text-white bg-[length:200%_auto] animate-gradient-wave">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          {t('title')} <span className="text-purple-400">{t('eyesOn')}</span>?
        </h2>
        <p className="text-xl max-w-2xl mx-auto mb-8 text-white/80">
          {t('description1')}
          <br />
          {t('description2')}
        </p>
        <Button asChild size="lg" className="bg-white text-purple-900 hover:bg-gray-100">
          <Link href="https://preview.reve.art/" target="_blank" rel="noopener noreferrer">
            {t('button')} <icons.ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

