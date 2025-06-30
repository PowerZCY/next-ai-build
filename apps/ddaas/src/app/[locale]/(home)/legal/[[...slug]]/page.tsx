import { getMDXComponents } from '@/components/mdx-components';
import { appConfig } from '@/lib/appConfig';
import { SiteIcon } from '@/lib/site-config';
import { legalSource } from '@/lib/source';
import { createFumaPage } from '@third-ui/fuma';

const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  mdxContentSource: legalSource,
  getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir.legal,
  githubBaseUrl: appConfig.githubBaseUrl,
  showCopy: false,
  siteIcon: <SiteIcon />,
});

export default Page;
export { generateMetadata, generateStaticParams };
