import type { ReactNode } from 'react';
import { legalSource } from '@/lib/source';
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
    <DocsLayout sidebar={{enabled: false}} tree={legalSource.pageTree[locale]}>
      {children}
    </DocsLayout>
  );
}