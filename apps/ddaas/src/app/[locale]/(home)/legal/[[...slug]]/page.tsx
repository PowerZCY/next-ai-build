import { getMDXComponents } from '@/components/mdx-components';
import { appConfig } from '@/lib/appConfig';
import { legalSource } from '@/lib/source';
import { createFumaPage } from '@third-ui/fuma';

const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  mdxContentSource: legalSource,
  getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir.legal,
  githubBaseUrl: appConfig.githubBaseUrl,
  showCopy: false,
});

export default Page;
export { generateMetadata, generateStaticParams };
