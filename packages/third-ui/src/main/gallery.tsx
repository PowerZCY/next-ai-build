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
  const [downloadingItems, setDownloadingItems] = useState<Set<number>>(new Set());
  const cdnProxyUrl = process.env.NEXT_PUBLIC_STYLE_CDN_PROXY_URL!;

  const handleDownload = async (item: GalleryItem, index: number) => {
    // prevent duplicate clicks
    if (downloadingItems.has(index)) {
      return;
    }

    // set download status
    setDownloadingItems(prev => new Set(prev).add(index));

    try {
      // use R2 proxy to download directly, no need to fetch
      // convert original R2 URL to proxy URL
      const originalUrl = new URL(item.url);
      const filename = originalUrl.pathname.substring(1);
      
      // build proxy download URL
      const proxyUrl = `${cdnProxyUrl}/${encodeURIComponent(filename)}`;
      
      // extract file extension from URL
      const urlExtension = item.url.split('.').pop()?.toLowerCase();
      let extension = '.webp';
      if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(urlExtension)) {
        extension = `.${urlExtension}`;
      }
      const downloadPrefix = t('downloadPrefix');
      
      // fetch file from proxy
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // convert to blob
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // create download link and trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${downloadPrefix}-${index + 1}${extension}`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // clean up DOM elements and blob URL
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      // clear download status
      setDownloadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
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
                disabled={downloadingItems.has(index)}
                className={cn(
                  "p-2 rounded-full transition-all duration-300",
                  downloadingItems.has(index)
                    ? "bg-black/30 text-white/50"
                    : "bg-black/50 hover:bg-black/70 text-white/80 hover:text-white"
                )}
              >
                {downloadingItems.has(index) ? (
                  <icons.Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <icons.Download className="h-5 w-5 text-white" />
                )}
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
