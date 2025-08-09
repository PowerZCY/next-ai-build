import { getTranslations } from 'next-intl/server';
import { Banner } from '@third-ui/fuma/mdx/banner';

export async function FumaBannerSuit({ locale, showBanner }: { locale: string, showBanner: boolean }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const heightValue = showBanner ? 3 : 0.5;
  const height= `${heightValue}rem`;
  const bannerText = t('banner');
  return (
    <>
      {showBanner ? (
        <Banner variant="rainbow" changeLayout={true} height={heightValue}>
          <p className="text-xl">{bannerText}</p>
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

