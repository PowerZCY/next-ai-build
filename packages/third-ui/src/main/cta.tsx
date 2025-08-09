import { getTranslations } from 'next-intl/server';
import { GradientButton } from "@third-ui/fuma/mdx/gradient-button";
import { cn } from '@lib/utils';
import { richText } from '@third-ui/main/rich-text-expert';

interface CTAData {
  title: string;
  eyesOn: string;
  description1: string;
  description2: string;
  button: string;
  url: string;
}

export async function CTA({ 
  locale, 
  sectionClassName 
}: { 
  locale: string;
  sectionClassName?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'cta' });
  
  const data: CTAData = {
    title: t('title'),
    eyesOn: t('eyesOn'),
    description1: richText(t, 'description1'),
    description2: t('description2'),
    button: t('button'),
    url: t('url')
  };

  return (
    <section id="cta" className={cn("px-16 py-20 mx-16 md:mx-32 scroll-mt-20", sectionClassName)}>
      <div className="
        bg-gradient-to-r from-[#f7f8fa] via-[#e0c3fc] to-[#b2fefa]
        dark:bg-gradient-to-r dark:from-[#2d0b4e] dark:via-[#6a3fa0] dark:to-[#3a185a]
        rounded-2xl p-12 text-center
        bg-[length:200%_auto] animate-cta-gradient-wave
        ">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          {data.title} <span className="text-purple-400">{data.eyesOn}</span>?
        </h2>
        <p className="text-2xl mx-auto mb-8">
          {data.description1}
          <br />
          <span className="text-purple-400">{data.description2}</span>
        </p>
        <GradientButton
          title={data.button}
          href={data.url}
          align="center"
        />
      </div>
    </section>
  )
}

