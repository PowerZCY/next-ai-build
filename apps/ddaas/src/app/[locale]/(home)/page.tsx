import { Hero } from "@/components/hero"
import { Features, Gallery, Tips, SeoContent, CTA } from "@windrun-huaiin/third-ui/main"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Gallery />
      <Features />
      <Tips />
      <SeoContent />
      <CTA />
    </main>
  )
}

