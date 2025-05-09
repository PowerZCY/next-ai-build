'use client'

import { useTranslations } from 'next-intl'
import Link from "next/link";
import { SiteIcon } from '@/components/global-icon';
import { globalLucideIcons as icons } from '@/components/global-icon';
import { useEffect } from 'react';
import { showBanner } from '@/lib/appConfig';

export function Footer() {
  const t = useTranslations('home');
  const tFooter = useTranslations('footer');

  useEffect(() => {
    // 如果设置了banner, 就需要调节header的高度
    document.documentElement.style.setProperty('--fd-banner-height', showBanner ? '2.5rem' : '-0.5rem');
  }, []);

  return (
    <footer className="mt-auto bg-fd-card text-fd-secondary-foreground max-w-full border-2 border-fd-foreground/10 transition-colors lg:mx-2 lg:my-1 rounded-2xl lg:border-0 lg:bg-fd-background/80 lg:backdrop-blur-lg supports-[backdrop-filter]:bg-fd-background/80 supports-[backdrop-filter]:backdrop-blur-lg">
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Left Aligned */}
        <div className="flex flex-col items-start text-left space-y-3">
          {/* Row 1.1: Site Icon and Title */}
          <Link href="/" className="flex items-center space-x-2">
            <SiteIcon/>
            <span className="text-sm font-semibold">{t('title', { defaultValue: 'Re8ger' })}</span>
          </Link>
          {/* Row 1.2: Thanks */}
          <div className="flex flex-col items-start text-xs space-y-0.5">
            <div className="flex items-center space-x-1">
              <icons.Bitcoin className="h-3.5 w-3.5"/>
              <span>Thanks to </span>
              <Link href="https://fumadocs.dev/" rel="noreferrer noopener" target="_blank" className="font-medium hover:underline">Fumadocs</Link>
              <span>|</span>
              <Link href="https://reveimage.directory/" rel="noreferrer noopener" target="_blank" className="font-medium hover:underline">Reveimage</Link>
            </div>
          </div>
        </div>

        {/* Column 2: Center Aligned */}
        <div className="flex flex-col items-center text-center m-2 space-y-5">
          {/* Row 2.1: Legal Links */}
          <div className="flex items-center space-x-4 text-xs">
            <Link href="/legal/terms" className="flex items-center space-x-1 hover:underline">
              <icons.ReceiptText className="h-3.5 w-3.5"/>
              <span>{tFooter('terms', { defaultValue: 'Terms of Service' })}</span>
            </Link>
            <Link href="/legal/privacy" className="flex items-center space-x-1 hover:underline">
              <icons.ShieldUser className="h-3.5 w-3.5"/>
              <span>{tFooter('privacy', { defaultValue: 'Privacy Policy' })}</span>
            </Link>
          </div>
          {/* Row 2.2: Copyright */}
          <div className="text-xs">
            <span>
              {tFooter('copyright', { year: new Date().getFullYear(), name: "巽川・怀因" })}
            </span>
          </div>
        </div>

        {/* Column 3: Right Aligned */}
        <div className="flex justify-end m-2">
          <div className="flex flex-col space-y-5">
            {/* Link 1 */}
            <Link href="/legal/dpa" className="text-xs flex items-center space-x-1 hover:underline text-left">
              <icons.Fingerprint className="h-3.5 w-3.5"/>
              <span>{tFooter('contact', { defaultValue: 'Contact Us' })}</span>
            </Link>
            {/* Link 2 */}
            <Link href="/legal/subprocessors" className="text-xs flex items-center space-x-1 hover:underline text-left">
              <icons.Handshake className="h-3.5 w-3.5"/>
              <span>{tFooter('sitemap', { defaultValue: 'Sitemap' })}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

