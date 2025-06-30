import { NotFoundPage } from '@base-ui/components/client';
import { SiteIcon } from '@/lib/site-config';

  export default async function D8gerPage() {
  return (
    <NotFoundPage siteIcon={<SiteIcon />} />
  );
}