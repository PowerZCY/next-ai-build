'use client'

import { Hero } from "@/components/hero"
import { Gallery, Usage, Features, Tips, FAQ, SeoContent, CTA, PricePlan } from "@third-ui/main"
import { pricePlanConfig } from "@/lib/price-config"
import { GradientButton } from "@third-ui/fuma/mdx/gradient-button"
import { useTranslations } from "next-intl"

export default function Home() {
  const t = useTranslations('gallery');
  return (
    <>
      <Hero />
      <Gallery
        button={
          <GradientButton
            title={t("button.title")}
            href={t("button.href")}
            align={t("button.align") as "center" | "left" | "right"}
          />
        }
      />
      <Usage />
      <Features />
      <Tips />
      <FAQ />
      <PricePlan pricePlanConfig={pricePlanConfig} currency="￥" />
      <SeoContent />
      <CTA />
    </>
  );
}

