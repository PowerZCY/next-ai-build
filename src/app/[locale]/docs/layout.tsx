import type { ReactNode } from 'react';
import { docsSource } from '@/lib/source';
import { baseOptions } from '@/app/[locale]/layout.config';
// https://fumadocs.dev/docs/ui/layouts/notebook
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import { GithubInfo } from 'fumadocs-ui/components/github-info';
import 'katex/dist/katex.min.css';

async function docsOptions(locale: string): Promise<DocsLayoutProps> {
  const options = await baseOptions(locale);
  return {
    ...options,
    tree: docsSource.pageTree[locale],
    links: [
      {
        type: 'custom',
        children: (
          <GithubInfo owner="caofanCPU" repo="D8gerAutoCode" className="lg:-mx-2" />
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

          const color = `var(--${meta.file.dirname}-color, var(--color-fd-foreground))`;

          return {
            ...option,
            icon: (
              <div
                className="rounded-md p-1 shadow-lg ring-0.5 border border-purple-500 ring-purple-500/20 [&_svg]:size-5"
                style={
                  {
                    color,
                  } as object
                }
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
 
  return (
    <DocsLayout {...customeOptions} >
      {children}
    </DocsLayout>
  );
}