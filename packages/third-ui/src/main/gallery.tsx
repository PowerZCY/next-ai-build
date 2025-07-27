'use client'

import { globalLucideIcons as icons } from "@base-ui/components/global-icon"
import { cn } from '@lib/utils'
import { useTranslations } from 'next-intl'
import Image from "next/image"
import { useState } from 'react'

interface GalleryItem {
  url: string;
  altMsg: string;
}

interface GalleryProps {
  sectionClassName?: string;
  button?: React.ReactNode;
}

export function Gallery({ sectionClassName, button }: GalleryProps) {
  const t = useTranslations('gallery');
  const galleryItems = t.raw('prompts') as GalleryItem[];
  const defaultImgUrl = t.raw('defaultImgUrl') as string;
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleDownload = async (item: GalleryItem, index: number) => {
    try {
      // use fetch to force download, and DO NEED  CORS config in R2
      const response = await fetch(item.url, {
        method: 'GET',
        // CORS mode declaration
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // set extension based on the actual file type
      const contentType = response.headers.get('content-type');
      let extension = '.webp';

      if (contentType) {
        switch (contentType) {
          case 'image/jpeg':
          case 'image/jpg':
            extension = '.jpg';
            break;
          case 'image/png':
            extension = '.png';
            break;
          case 'image/gif':
            extension = '.gif';
            break;
          case 'image/webp':
            extension = '.webp';
            break;
          case 'image/svg+xml':
            extension = '.svg';
            break;
          default:
            // if cannot determine, try to extract the extension from the URL
            const urlExtension = item.url.split('.').pop()?.toLowerCase();
            if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(urlExtension)) {
              extension = `.${urlExtension}`;
            }
        }
      }
      const downloadPrefix = t('downloadPrefix');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadPrefix}-${index + 1}${extension}`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
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
      {button && (
        <div className="text-center mt-12">
          {button}
        </div>
      )}
    </section>
  )
}

