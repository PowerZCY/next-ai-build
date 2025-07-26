'use client'

import { globalLucideIcons as icons } from "@base-ui/components/global-icon"
import { useTranslations } from 'next-intl'
import Image from "next/image"
import { GradientButton } from "@third-ui/fuma/mdx/gradient-button"
import { cn } from '@lib/utils';
import { useState } from 'react';

interface GalleryItem {
  url: string;
  altMsg: string;
}

export function Gallery({ sectionClassName }: { sectionClassName?: string }) {
  const t = useTranslations('gallery');
  const galleryItems = t.raw('prompts') as GalleryItem[];
  const defaultImgUrl = t.raw('defaultImgUrl') as string;
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleDownload = async (item: GalleryItem, index: number) => {
    try {
      const response = await fetch(item.url);
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

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const getImageSrc = (item: GalleryItem, index: number) => {
    return imageErrors.has(index) ? defaultImgUrl : item.url;
  };

  return (
    <section id="gallery" className={cn("container mx-auto px-4 py-20 scroll-mt-20", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
        {t('titleL')} <span className="text-purple-500">{t('eyesOn')}</span> {t('titleR')}
      </h2>
      <p className="text-center max-w-2xl mx-auto mb-16">
        {t('description')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item, index) => (
          <div key={index} className="group relative overflow-hidden rounded-xl">
            <Image
              src={getImageSrc(item, index)}
              alt={item.altMsg}
              width={600}
              height={600}
              className="w-full h-80 object-cover transition duration-300 group-hover:scale-105"
              onError={() => handleImageError(index)}
            />
            <div className="absolute inset-0 flex items-end justify-end p-4 opacity-0 group-hover:opacity-100 transition duration-300">
              <button
                onClick={() => handleDownload(item, index)}
                className="bg-black/50 hover:bg-black/70 p-2 rounded-full text-white/80 hover:text-white transition-all duration-300"
              >
                <icons.Download className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <GradientButton
          title={t('button')}
          href="https://preview.reve.art/"
          align="center"
        />
      </div>
    </section>
  )
}

