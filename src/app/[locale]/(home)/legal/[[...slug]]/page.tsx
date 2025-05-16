import { legalSource } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx-components';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { slug, locale } = await params;
  const page = legalSource.getPage(slug, locale);
  if (!page) notFound();
	
 
  // Markdown content requires await if you config 'async: true' in source.config.ts
  // const { body: MdxContent, toc } = await page.data.load();
  const MDX = page.data.body;
 
  return (
    <DocsPage 
      tableOfContent={{ style: 'clerk', single: false}}
      toc={page.data.toc}
      full={page.data.full}
      article={{
        className: 'max-sm:pb-16',
      }}
      // lastUpdate={page.data.lastModified}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-2">{page.data.description}</DocsDescription>
      <DocsBody className="text-fd-foreground/80">
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
 

export function generateStaticParams() {
  return legalSource.generateParams('slug', 'locale');
}
 
export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = legalSource.getPage(params.slug);
  if (!page) notFound();
 
  return {
    title: page.data.title,
    description: page.data.description,
  };
}