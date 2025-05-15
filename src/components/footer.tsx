'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from "next/link";
import { SiteIcon } from '@/components/global-icon';
import { globalLucideIcons as icons } from '@/components/global-icon';
import { useEffect } from 'react';
import { showBanner } from '@/lib/appConfig';

export function Footer() {
  const t = useTranslations('home');
  const tFooter = useTranslations('footer');
  const locale = useLocale();

  useEffect(() => {
    // 如果设置了banner, 就需要调节header的高度
    document.documentElement.style.setProperty('--fd-banner-height', showBanner ? '2.5rem' : '-0.5rem');
  }, []);

  return (
    <div className="mb-10 w-full mx-auto border-t-purple-700/80 border-t-1">
      <footer>
        <div className="w-[94%] items-start mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Left Aligned */}
          <div className="flex flex-col items-start text-left space-y-3">
            {/* Row 1.1: Site Icon and Title */}
            <Link href="/" className="flex items-center space-x-2">
              <SiteIcon/>
              <span className="text-sm font-semibold">{t('title', { defaultValue: 'Re8ger' })}: {t('slug', { defaultValue: 'Rethink | Redefine | Rebuild' })}</span>
            </Link>
            {/* Row 1.2: Thanks */}
            <div className="flex flex-col items-start text-xs">
              <div className="flex items-center pl-2">
                <icons.BTC className="h-3.5 w-3.5"/>
                <span className="ml-5">{tFooter('thanks', { defaultValue: 'Thanks to' })}</span>
                <Link href="https://fumadocs.dev/" rel="noreferrer noopener" target="_blank" className="font-medium hover:underline ml-1">Fumadocs</Link>
                <span className="ml-1">|</span>
                <Link href="https://reveimage.directory/" rel="noreferrer noopener" target="_blank" className="font-medium hover:underline ml-1">Reveimage</Link>
              </div>
            </div>
          </div>

          {/* Column 2: Center Aligned */}
          <div className="flex flex-col items-center text-center m-2 space-y-5">
            {/* Row 2.1: Legal Links */}
            <div className="flex items-center space-x-4 text-xs">
              <Link href={`/${locale}/legal/terms`} className="flex items-center space-x-1 hover:underline">
                <icons.ReceiptText className="h-3.5 w-3.5"/>
                <span>{tFooter('terms', { defaultValue: 'Terms of Service' })}</span>
              </Link>
              <Link href={`/${locale}/legal/privacy`} className="flex items-center space-x-1 hover:underline">
                <icons.ShieldUser className="h-3.5 w-3.5"/>
                <span>{tFooter('privacy', { defaultValue: 'Privacy Policy' })}</span>
              </Link>
              <Link href={`/${locale}/legal/dpa`} className="flex items-center space-x-1 hover:underline">
                <icons.DPA className="h-3.5 w-3.5"/>
                <span>{tFooter('dpa', { defaultValue: 'Data Protection Agreement' })}</span>
              </Link>
            </div>
            {/* Row 2.2: Copyright */}
            <div className="text-xs">
              <span>
                {tFooter('copyright', { year: new Date().getFullYear(), name: tFooter('company') })}
              </span>
            </div>
          </div>

          {/* Column 3: Right Aligned */}
          <div className="flex justify-end m-2 space-x-4">
            <div className="flex flex-col space-y-5">
              {/* Link 1 */}
              <Link href={`/${locale}/docs/introduction/mdx-shiki`} className="text-xs flex items-center space-x-1 hover:underline text-left">
                <icons.Highlighter className="h-3.5 w-3.5"/>
                <span>Shiki</span>
              </Link>
              {/* Link 2 */}
              <Link href={`/${locale}/docs/introduction/mdx-snippets`} className="text-xs flex items-center space-x-1 hover:underline text-left">
                <icons.Snippets className="h-3.5 w-3.5"/>
                <span>Snippets</span>
              </Link>
            </div>
            <div className="flex flex-col space-y-5">
              {/* Link 1 */}
              <Link href={`/${locale}/docs/introduction/mdx-mermaid`} className="text-xs flex items-center space-x-1 hover:underline text-left">
                <icons.Mmd className="h-3.5 w-3.5"/>
                <span>Mermaid</span>
              </Link>
              {/* Link 2 */}
              <Link href={`/${locale}/docs/tool-manuals/d8ger-auto-code`} className="text-xs flex items-center space-x-1 hover:underline text-left">
                <icons.D8 className="h-3.5 w-3.5"/>
                <span>D8gerAutoCode</span>
              </Link>
            </div>
            <div className="flex flex-col space-y-5">
              {/* Link 1 */}
              <Link href={`/${locale}/docs/tool-manuals/macos-software`} className="text-xs flex items-center space-x-1 hover:underline text-left">
                <icons.MAC className="h-3.5 w-3.5"/>
                <span>Software</span>
              </Link>
              {/* Link 2 */}
              <Link href={`/${locale}/docs/tool-manuals/easy-http`} className="text-xs flex items-center space-x-1 hover:underline text-left">
                <icons.Iterm className="h-3.5 w-3.5"/>
                <span>EasyHttp</span>
              </Link>
            </div>
            <div className="flex flex-col space-y-5">
              {/* Link 1 */}
              <Link href={`/${locale}/docs/tool-manuals/git`} className="text-xs flex items-center space-x-1 hover:underline text-left">
                <icons.GitPullRequestArrow className="h-3.5 w-3.5"/>
                <span>Git</span>
              </Link>
              {/* Link 2 */}
              <Link href={`/${locale}/docs/tool-manuals/httpie`} className="text-xs flex items-center space-x-1 hover:underline text-left">
                <icons.Terminal className="h-3.5 w-3.5"/>
                <span>HTTPie</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

