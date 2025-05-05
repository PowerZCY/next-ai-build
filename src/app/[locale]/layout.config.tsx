import { i18n } from '@/i18n';
import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { type LinkItemType } from 'fumadocs-ui/layouts/docs';
import {
  AlbumIcon,
  BitcoinIcon,
  ComponentIcon,
  Heart,
  Layout,
  LayoutTemplate,
  Pencil,
  Server,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import Preview from '@/../public/banner.png';
import { getTranslations } from 'next-intl/server';
import { appConfig } from '@/lib/appConfig';

// 页面导航菜单
export const linkItems: LinkItemType[] = [
  {
    icon: <AlbumIcon />,
    text: 'Blog',
    url: '/blog',
    active: 'nested-url',
  },
  {
    text: 'Showcase',
    url: '/showcase',
    icon: <LayoutTemplate />,
    active: 'url',
  },
  {
    text: 'Sponsors',
    url: '/sponsors',
    icon: <Heart />,
  },
];

export const logo = (
  <>
    <BitcoinIcon fill="currentColor" />
  </>
);

export async function baseOptions(locale: string): Promise<BaseLayoutProps> {
  const t = await getTranslations({ locale : locale, namespace: 'home' });
  return {
    i18n,
    nav: {
      url: appConfig.baseUrl,
      title: (
        <>
          <Zap className="h-6 w-6 text-purple-500" />
          <span className="font-medium [.uwu_&]:hidden [header_&]:text-[15px]">
            {t('title')}
          </span>
        </>
      ),
      transparentMode: 'none',
    },
    // 页面导航菜单
    links: [
      {
        type: 'menu',
        text: 'Documentation',
        url: '/docs/read-session-data',
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
            url: '/docs/ui',
          },
          {
            icon: <ComponentIcon />,
            text: 'Components',
            description: 'Add interactive experience to your docs.',
            url: '/docs/ui/components',
            menu: {
              className: 'lg:col-start-2',
            },
          },
          {
            icon: <Server />,
            text: 'OpenAPI',
            description:
              'Generate interactive playgrounds and docs for your OpenAPI schema.',
            url: '/docs/ui/openapi',
            menu: {
              className: 'lg:col-start-2',
            },
          },
          {
            icon: <Pencil />,
            text: 'Markdown',
            description: 'Learn the writing format/syntax of Fumadocs.',
            url: '/docs/ui/markdown',
            menu: {
              className: 'lg:col-start-3 lg:row-start-1',
            },
          },
          {
            icon: <Layout />,
            text: 'Layouts',
            description: 'See the available layouts of Fumadocs UI.',
            url: '/docs/ui/layouts/docs',
            menu: {
              className: 'lg:col-start-3',
            },
          },
        ],
      },
      ...linkItems,
    ],
    githubUrl: "https://github.com/caofanCPU/next-ai-build",
  };
}