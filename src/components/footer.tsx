'use client'

import { Zap } from "lucide-react"
import { useTranslations } from 'next-intl'
import Link from "next/link";

export function Footer() {
  const t = useTranslations('home');
  
  return (
    <footer className="mt-auto border-t bg-fd-card py-12 text-fd-secondary-foreground">
      <div className="container flex flex-col gap-4">
        <div className="mb-4 flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-purple-500" />
            <span className="mb-1 text-sm font-semibold">{t('title')}</span>
          </Link>
        </div>
        <div className="flex flex-row items-start gap-x-2">
         <span className="text-xs">Thanks to ❤️</span>
          <span className="text-xs">
            <Link href="https://fumadocs.dev/" rel="noreferrer noopener" target="_blank" className="font-medium hover:underline">Fumadocs</Link>
          </span>
          <span className="text-xs">|</span>
          <span className="text-xs">
            <Link href="https://reveimage.directory/" rel="noreferrer noopener" target="_blank" className="font-medium hover:underline">Reveimage</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

