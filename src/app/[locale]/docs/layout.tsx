import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/app/layout.config';
 
export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
 
  return (
    <DocsLayout {...baseOptions(locale)} tree={source.pageTree[locale]}>
      {children}
    </DocsLayout>
  );
}