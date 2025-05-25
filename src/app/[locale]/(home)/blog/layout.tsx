import type { ReactNode } from 'react';
import { blogSource } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import 'katex/dist/katex.min.css';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  return (
    <DocsLayout sidebar={{enabled: false}} tree={blogSource.pageTree[locale]}>
      {children}
    </DocsLayout>
  );
}