import { Hero } from "@/components/hero"
import { Gallery, Usage, Features, Tips, FAQ, SeoContent, CTA, PricePlan } from "@third-ui/main"
import { pricePlanConfig } from "@/lib/price-config"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300">
      <Hero />
      <Gallery />
      <Usage />
      <Features />
      <Tips />
      <FAQ />
      <PricePlan pricePlanConfig={pricePlanConfig} currency="￥"/>
      <SeoContent />
      <CTA />
    </main>
  )
}

