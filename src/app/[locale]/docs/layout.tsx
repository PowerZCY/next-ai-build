import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { baseOptions } from '@/app/[locale]/layout.config';
// https://fumadocs.dev/docs/ui/layouts/notebook
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
 
import 'katex/dist/katex.min.css';

async function docsOptions(locale: string): Promise<DocsLayoutProps> {
  const options = await baseOptions(locale);
  return {
    ...options,
    tree: source.pageTree[locale],
    sidebar: {
      tabs: {
        transform(option, node) {
          const meta = source.getNodeMeta(node);
          if (!meta || !node.icon) return option;

          const color = `var(--${meta.file.dirname}-color, var(--color-fd-foreground))`;

          return {
            ...option,
            icon: (
              <div
                className="rounded-md p-1 shadow-lg ring-2 [&_svg]:size-5"
                style={
                  {
                    color,
                    border: `1px solid color-mix(in oklab, ${color} 50%, transparent)`,
                    '--tw-ring-color': `color-mix(in oklab, ${color} 20%, transparent)`,
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