import Preview from '@/../public/banner.png';
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { SiteIcon } from '@/lib/site-config';
import { type LinkItemType } from 'fumadocs-ui/layouts/docs';
import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
// import { ClerkOrganization } from '@third-ui/clerk';
import { ClerkUser } from '@third-ui/clerk/server';
import { i18n } from '@/i18n';
import { appConfig } from '@/lib/appConfig';
import { CreditPopover } from '@/components/credit-popover';

// 首页普通菜单
export async function homeNavLinks(locale: string): Promise<LinkItemType[]> {
  const t1 = await getTranslations({ locale: locale, namespace: 'linkPreview' });
  return [
    {
      text: t1('blog'),
      url: `/${locale}/blog`,
    },
    {
      text: t1('pricing'),
      url: `/${locale}/pricing`,
    },
    {
      type: 'custom',
      secondary: true,
      children: <CreditPopover locale={locale} />,
    },
    {
      type: 'custom',
      // false就先排左边的菜单, true就先排右边的按钮
      secondary: true,
      // NicknameFilter 假设在其内部也使用了 useNickname
      children: <ClerkUser locale={locale} clerkAuthInModal={appConfig.style.clerkAuthInModal} showSignUp={true}/>
    },
    // {
    //   type: 'custom',
    //   secondary: true,
    //   children: <ClerkOrganization locale={locale} />
    // }
  ];
}

// 层级特殊菜单
export async function levelNavLinks(locale: string): Promise<LinkItemType[]> {
  const t1 = await getTranslations({ locale: locale, namespace: 'linkPreview' });
  return [
    {
      type: 'menu',
      text: t1('docs'),
      // 文档落地页
      url: `/${locale}/docs`,
      items: [
        {
          menu: {
            banner: (
              <div className="-mx-3 -mt-3">
                <Image
                  src={Preview}
                  alt="Perview"
                  className="rounded-t-lg object-cover"
                  style={{
                    maskImage:
                      'linear-gradient(to bottom,white 60%,transparent)',
                  }}
                />
              </div>
            ),
            className: 'md:row-span-2',
          },
          text: 'FumaDocs',
          description: 'Learn to use Fumadocs on your docs site.',
          url: `/${locale}/docs/introduction`,
        },
        {
          icon: <icons.ShieldUser />,
          text: 'FumaMDX',
          description: 'FumaMDX tips',
          url: `/${locale}/docs//introduction/fuma-mdx`,
          menu: {
            className: 'lg:col-start-2 lg:row-start-1',
          },
        },
        {
          icon: <icons.Snippets />,
          text: 'Quick generation',
          description: 'MDX Snippets',
          url: `/${locale}/docs/introduction/mdx-snippets`,
          menu: {
            className: 'lg:col-start-2 lg:row-start-2',
          },
        },
        {
          icon: <icons.Highlighter />,
          text: 'Codeblock',
          description: 'Codeblock full case',
          url: `/${locale}/docs/introduction/mdx-shiki`,
          menu: {
            className: 'lg:col-start-3 lg:row-start-1',
          },
        },
        {
          icon: <icons.Mmd />,
          text: 'Graph',
          description: 'Mermaid showcase.',
          url: `/${locale}/docs/introduction/mdx-mermaid`,
          menu: {
            className: 'lg:col-start-3 lg:row-start-2',
          },
        },
      ],
    },
  ]
}

export async function baseOptions(locale: string): Promise<BaseLayoutProps> {
  const t = await getTranslations({ locale: locale, namespace: 'home' });
  return {
    // 导航Header配置
    nav: {
      url: `/${locale}`,
      title: (
        <>
          <SiteIcon />
          <span className="font-medium in-[.uwu]:hidden in-[header]:text-[15px]">
            {t('title')}
          </span>
        </>
      ),
      // 导航Header, 透明模式选项: none | top | always
      // https://fumadocs.dev/docs/ui/layouts/docs#transparent-mode
      transparentMode: 'none',
    },
    // 导航Header, 语言切换
    i18n,
    // 导航Header, Github链接
    // githubUrl: appConfig.github,
  };
}
