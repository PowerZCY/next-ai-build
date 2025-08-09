
import { Hero } from "@/components/hero"
import { Gallery, Usage, Features, Tips, FAQ, SeoContent, CTA, PricePlan } from "@third-ui/main/server"
import { pricePlanConfig } from "@/lib/price-config"
import { GradientButton } from "@third-ui/fuma/mdx/gradient-button"
import { getTranslations } from "next-intl/server"

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery' });
  return (
    <>
      <Hero locale={locale}/>
      <Gallery
        locale={locale}
        button={
          <GradientButton
            title={t("button.title")}
            href={t("button.href")}
            align={t("button.align") as "center" | "left" | "right"}
          />
        }
      />
      <Usage locale={locale} />
      <Features locale={locale} />
      <Tips locale={locale} />
      <FAQ locale={locale} />
      <PricePlan locale={locale} pricePlanConfig={pricePlanConfig} currency="￥" />
      <SeoContent locale={locale} />
      <CTA locale={locale} />
    </>
  );
}

