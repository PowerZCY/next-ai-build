import { Hero } from "@/components/hero"
import { Gallery, Usage, Features, Tips, FAQ, SeoContent, CTA } from "@third-ui/main"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
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

