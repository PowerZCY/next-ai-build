import { getTranslations } from 'next-intl/server';
import { ClerkOrganizationClient } from './clerk-organization-client';

interface ClerkOrganizationProps {
  className?: string;
  locale: string;
}

interface ClerkOrganizationData {
  homepage: string;
  terms: string;
  privacy: string;
  locale: string;
  className: string;
}

export async function ClerkOrganization({
  locale,
  className = '',
}: ClerkOrganizationProps) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  
  const data: ClerkOrganizationData = {
    homepage: 'Homepage',
    terms: t('terms'),
    privacy: t('privacy'),
    locale,
    className
  };

  return <ClerkOrganizationClient data={data} />;
} 