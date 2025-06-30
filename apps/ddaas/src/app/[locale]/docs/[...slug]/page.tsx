import { getMDXComponents } from '@/components/mdx-components';
import { appConfig } from '@/lib/appConfig';
import { SiteIcon } from '@/lib/site-config';
import { docsSource } from '@/lib/source';
import { createFumaPage } from '@third-ui/fuma/server';

const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  mdxContentSource: docsSource,
  getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir.docs,
  githubBaseUrl: appConfig.githubBaseUrl,
  showCopy: true,
  siteIcon: <SiteIcon />,
});

export default Page;
export { generateMetadata, generateStaticParams };