import { Hero } from "@/components/hero"
import { Gallery, Usage, Features, Tips, FAQ, SeoContent, CTA, PricePlan } from "@third-ui/main"
import { pricePlanConfig } from "@/lib/price-config"

export default function Home() {
  return (
    <>
      <Hero />
      <Gallery />
      <Usage />
      <Features />
      <Tips />
      <FAQ />
      <PricePlan pricePlanConfig={pricePlanConfig} currency="￥"/>
      <SeoContent />
      <CTA />
    </>
  )
}

