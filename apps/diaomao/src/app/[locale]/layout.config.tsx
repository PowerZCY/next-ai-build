import { i18n } from '@/i18n';
import { appConfig } from '@/lib/appConfig';
import { SiteIcon } from '@/lib/site-config';
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { ClerkUser } from '@third-ui/clerk';
import { type LinkItemType } from 'fumadocs-ui/layouts/docs';
import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { getTranslations } from 'next-intl/server';

// home page normal menu
export async function homeNavLinks(locale: string): Promise<LinkItemType[]> {
  const t1 = await getTranslations({ locale: locale, namespace: 'linkPreview' });
  return [
    {
      icon: <icons.AlbumIcon />,
      text: t1('blog'),
      url: `/${locale}/blog`,
    },
    {
      type: 'custom',
      // false to put the menu on the left, true to put the button on the right
      secondary: true,
      // NicknameFilter is also used in its internal useNickname
      children: <ClerkUser locale={locale} clerkAuthInModal={appConfig.style.clerkAuthInModal} />
    },
  ];
}

// level special menu
export async function levelNavLinks(locale: string): Promise<LinkItemType[]> {
  console.log('levelNavLinks TODO: add links here', locale);
  return [];
}

export async function baseOptions(locale: string): Promise<BaseLayoutProps> {
  const t = await getTranslations({ locale: locale, namespace: 'home' });
  return {
    nav: {
      url: `/${locale}`,
      title: (
        <>
          <SiteIcon />
          <span className="font-medium [.uwu_&]:hidden [header_&]:text-[15px]">
            {t('title')}
          </span>
        </>
      ),
      transparentMode: 'none',
    },
    i18n,
    githubUrl: appConfig.github,
  };
}