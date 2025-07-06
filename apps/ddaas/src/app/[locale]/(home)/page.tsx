import { Hero } from "@/components/hero"
import { Gallery, Usage, Features, Tips, FAQ, SeoContent, CTA, PricePlan } from "@third-ui/main"
import { pricePlanConfig } from "@/lib/appConfig"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <PricePlan pricePlanConfig={pricePlanConfig} currency="￥" />
      <Gallery />
      <Usage />
      <Features />
      <Tips />
      <FAQ />
      <SeoContent />
      <CTA />
    </main>
  )
}

