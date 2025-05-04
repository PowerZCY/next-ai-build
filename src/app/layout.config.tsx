import { i18n } from '@/i18n';
import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appConfig } from '@/lib/appConfig';
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
} from 'lucide-react';
import Image from 'next/image';
import Preview from '@/../public/banner.png';

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

 
export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n,
    // 该导航栏为移动端特有的
    nav: {
      url: "https://d8ger.com",
      title: (
        <>
          {logo}
          <span className="font-medium [.uwu_&]:hidden [header_&]:text-[15px]">
          {locale === appConfig.i18n.defaultLocale ? "D8ger's SpaceX" : "帝八哥太空科技"}
          </span>
        </>
      ),
      transparentMode: 'top',
    },
    // 页面导航菜单
    links: [
      {
        type: 'menu',
        text: 'Documentation',
        url: '/docs/xx',
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