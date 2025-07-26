'use client'

import { useTranslations } from 'next-intl';
import { Banner } from '@third-ui/fuma/mdx/banner';

export function FumaBannerSuit({ showBanner }: { showBanner: boolean }) {
  const t = useTranslations('home');
  const heightValue = showBanner ? 3 : 0.5;
  const height= `${heightValue}rem`;
  return (
    <>
      {/* 设置 header 的 top 位置为 Banner 的底部，避免间隙 */}
      {showBanner ? (
        <Banner variant="rainbow" changeLayout={true} height={heightValue}>
          <p className="text-xl">{t('banner')}</p>
        </Banner>
      ) : (
        <div
          className="fixed top-0 left-0 w-screen z-[1001] m-0 rounded-none bg-neutral-100 dark:bg-neutral-900"
          style={{
            height: height,
            minHeight: height,
            maxHeight: height,
          }}
        />
      )}
    </>
  );
}

