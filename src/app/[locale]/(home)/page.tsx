import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Gallery } from "@/components/gallery"
import { Tips } from "@/components/tips"
import { SeoContent } from "@/components/seo-content"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"
export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Gallery />
      <Features />
      <Tips />
      <SeoContent />
      <CTA />
      <Footer />
    </main>
  )
}

