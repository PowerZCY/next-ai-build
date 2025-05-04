import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { baseOptions, linkItems } from '@/app/layout.config';
// https://fumadocs.dev/docs/ui/layouts/notebook
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/notebook';
 
import 'katex/dist/katex.min.css';

function docsOptions(locale: string): DocsLayoutProps {
  return {
    ...baseOptions(locale),
    tree: source.pageTree[locale],
    links: linkItems,
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
 
  return (
    <DocsLayout {...docsOptions(locale)} >
      {children}
    </DocsLayout>
  );
}