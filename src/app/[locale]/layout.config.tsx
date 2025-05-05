import { i18n } from '@/i18n';
import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { type LinkItemType } from 'fumadocs-ui/layouts/docs';
import {
  
} from 'lucide-react';
import { globalLucideIcons as icons } from '@/lib/mdx-components';
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
      url: `/${locale}/docs/framework/step`,
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
          text: 'Getting Started',
          description: 'Learn to use Fumadocs on your docs site.',
          url: `/${locale}/docs/framework`,
        },
        {
          icon: <icons.ComponentIcon />,
          text: 'Components',
          description: 'Add interactive experience to your docs.',
          url: `/${locale}/docs/framework/clerk-quick-start`,
          menu: {
            className: 'lg:col-start-2',
          },
        },
        {
          icon: <icons.Server />,
          text: 'OpenAPI',
          description:
            'Generate interactive playgrounds and docs for your OpenAPI schema.',
          url: `/${locale}/docs/framework/clerk-setup`,
          menu: {
            className: 'lg:col-start-2',
          },
        },
        {
          icon: <icons.Pencil />,
          text: 'Markdown',
          description: 'Learn the writing format/syntax of Fumadocs.',
          url: `/${locale}/docs/framework/(showcase)`,
          menu: {
            className: 'lg:col-start-3 lg:row-start-1',
          },
        },
        {
          icon: <icons.Layout />,
          text: 'Layouts',
          description: 'See the available layouts of Fumadocs UI.',
          url: `/${locale}/docs/framework/fumadocs`,
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
          <icons.Zap className="h-6 w-6 text-purple-500" />
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