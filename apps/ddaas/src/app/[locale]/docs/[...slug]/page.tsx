import { getMDXComponents } from '@/components/mdx-components';
import { appConfig } from '@/lib/appConfig';
import { docsSource } from '@/lib/source';
import { createFumaPage } from '@third-ui/fuma';

const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  mdxContentSource: docsSource,
  getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir.docs,
  githubBaseUrl: appConfig.githubBaseUrl,
  showCopy: true,
});

export default Page;
export { generateMetadata, generateStaticParams };