'use client'

import { Banner } from 'fumadocs-ui/components/banner';
import { useTranslations } from 'next-intl';

export function FumaBannerSuit({ showText }: { showText: boolean }) {
  const t = useTranslations('home');
  return (
    showText ?
      (<Banner variant="rainbow" changeLayout={true}>
        <p className="text-xl">{t('banner')}</p>
      </Banner>)
      : (<Banner variant="normal" changeLayout={true} />)
  );
}

