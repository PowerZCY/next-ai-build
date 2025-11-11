import { baseOptions } from '@/app/[locale]/layout.config';
import { docsSource } from '@/lib/source-docs';
import type { ReactNode } from 'react';
// https://fumadocs.dev/docs/ui/layouts/notebook
import { FumaGithubInfo } from '@third-ui/fuma/mdx';
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import { appConfig } from '@/lib/appConfig';

async function docsOptions(locale: string): Promise<DocsLayoutProps> {
  const options = await baseOptions(locale);
  return {
    ...options,
    tree: docsSource.pageTree[locale],
    links: [
      {
        type: 'custom',
        children: (
          <FumaGithubInfo 
            owner="caofanCPU" 
            repo="D8gerAutoCode" 
            token={appConfig.githubInfoToken}
            className="lg:-mx-2" 
          />
        ),
      },
    ],
    sidebar: {
      // 禁用侧边栏Link组件预加载, 降低服务端负荷, 并尽可能降低触发云平台限流规则的概率
      prefetch: false,
      tabs: {
        transform(option, node) {
          const meta = docsSource.getNodeMeta(node);
          if (!meta || !node.icon) return option;

          return {
            ...option,
            icon: (
              <div
                className="rounded-md shadow-lg ring-0.5 border border-purple-500 ring-purple-500/20"
              >
                {node.icon}
              </div>
            ),
          };
        },
      },
    },
  };
}

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const customeOptions = await docsOptions(locale);
  
  // // 在这里添加人工延迟
  // console.log('Starting 5-second delay for testing loading animation...');
  // await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒延迟
  // console.log('Delay finished. Rendering page.');
 
  return (
    <DocsLayout {...customeOptions} 
      themeSwitch={{
        enabled: true,
        mode: 'light-dark-system',
      }}
    >
      {children}
    </DocsLayout>
  );
}