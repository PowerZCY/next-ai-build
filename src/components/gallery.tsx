'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { globalLucideIcons as icons } from "@/components/global-icon"
import Image from "next/image"
import { useTranslations } from 'next-intl'

export function Gallery() {
  const t = useTranslations('gallery');
  const galleryItems = t.raw('prompts') as string[];

  const handleDownload = async (index: number) => {
    try {
      const response = await fetch(`/${index + 1}.webp`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reve-image-${index + 1}.webp`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <section id="gallery" className="container mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
        {t('titleL')} <span className="text-purple-500">{t('eyesOn')}</span> {t('titleR')}
      </h2>
      <p className="text-center max-w-2xl mx-auto mb-16">
        {t('description')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((prompt, index) => (
          <div key={index} className="group relative overflow-hidden rounded-xl">
            <Image
              src={`/${index + 1}.webp`}
              alt="Reve Image AI-generated artwork"
              width={600}
              height={600}
              className="w-full h-80 object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-end justify-end p-4 opacity-0 group-hover:opacity-100 transition duration-300">
              <button
                onClick={() => handleDownload(index)}
                className="bg-black/50 hover:bg-black/70 p-2 rounded-full text-white/80 hover:text-white transition-all duration-300"
              >
                <icons.Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <Button
          asChild
          size="lg"
          className="bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-black dark:text-white"
        >
          <Link href="https://preview.reve.art/" target="_blank" rel="noopener noreferrer">
            {t('button')} <icons.ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

