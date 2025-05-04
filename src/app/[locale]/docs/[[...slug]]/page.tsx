import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import { EditOnGitHub, LLMCopyButton } from './page.client';
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { slug, locale } = await params;
  const page = source.getPage(slug, locale);
  if (!page) notFound();
 
  const MDX = page.data.body;
 
  return (
    <DocsPage 
      tableOfContent={{ style: 'clerk', single: false }}
      toc={page.data.toc}
      full={page.data.full}
      article={{
        className: 'max-sm:pb-16',
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-2">{page.data.description}</DocsDescription>
      <DocsBody className="text-fd-foreground/80">
        <div className="flex flex-row gap-x-2 items-center mb-4">
          <LLMCopyButton />
          <EditOnGitHub
            url={`https://github.com/caofanCPU/next-ai-build/blob/fumadocs-base/${page.file.path}`}
          />
        </div>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
 

export function generateStaticParams() {
  return source.generateParams('slug', 'locale');
}
 
export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
 
  return {
    title: page.data.title,
    description: page.data.description,
  };
}