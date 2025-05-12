import { i18n } from '@/i18n';
import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { type LinkItemType } from 'fumadocs-ui/layouts/docs';
import { globalLucideIcons as icons, SiteIcon } from '@/components/global-icon';
import Image from 'next/image';
import Preview from '@/../public/banner.png';
import { getTranslations } from 'next-intl/server';

// 首页普通菜单
export function homeNavLinks(locale: string): LinkItemType[] {
  return [
    {
      icon: <icons.AlbumIcon />,
      text: 'Blog',
      url: `/${locale}/blog`,
      active: 'nested-url',
    },
    {
      icon: <icons.LayoutTemplate />,
      text: 'Showcase',
      url: `/${locale}/docs/introduction/mdx-quickstart`,
      active: 'url',
    },
    {
      icon: <icons.GlobeLock />,
      text: 'Legal',
      url: `/${locale}/legal`,
      active: 'url',
    },
  ];
}

// 层级特殊菜单
export function levelNavLinks(locale: string): LinkItemType[] {
  return [
    {
      type: 'menu',
      text: 'Documentation',
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
          icon: <icons.Mmd />,
          text: 'Graph',
          description: 'Mermaid showcase.',
          url: `/${locale}/docs/introduction/mermaid`,
          menu: {
            className: 'lg:col-start-2',
          },
        },
        {
          icon: <icons.Snippets />,
          text: 'Quick generation',
          description: 'MDX Snippets',
          url: `/${locale}/docs/introduction/mdx-snippets`,
          menu: {
            className: 'lg:col-start-2',
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
          icon: <icons.ShieldUser/>,
          text: 'Privacy Policy',
          description: 'Privacy Policy',
          url: `/${locale}/docs/legislations/privacy`,
          menu: {
            className: 'lg:col-start-3',
          },
        },
      ],
    },
  ]
}

export async function baseOptions(locale: string): Promise<BaseLayoutProps> {
  const t = await getTranslations({ locale : locale, namespace: 'home' });
  return {
    // 导航Header配置
    nav: {
      url: `/${locale}`,
      title: (
        <>
          <SiteIcon/>
          <span className="font-medium [.uwu_&]:hidden [header_&]:text-[15px]">
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
    githubUrl: "https://github.com/caofanCPU/next-ai-build",
  };
}