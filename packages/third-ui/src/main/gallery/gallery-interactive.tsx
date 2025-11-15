'use client';

import { useEffect, useState } from 'react';
import type { GalleryData } from './gallery-types';

export function GalleryInteractive({ data }: { data: GalleryData }) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());
  const cdnProxyUrl = process.env.NEXT_PUBLIC_STYLE_CDN_PROXY_URL;

  useEffect(() => {
    const downloadListeners = new Map<HTMLButtonElement, () => void>();
    const imageErrorListeners = new Map<HTMLImageElement, () => void>();

    data.items.forEach((item, index) => {
      const downloadButtons = Array.from(
        document.querySelectorAll(`[data-gallery-download="${item.id}"]`)
      ) as HTMLButtonElement[];

      const imageElements = Array.from(
        document.querySelectorAll(`[data-gallery-image="${item.id}"]`)
      ) as HTMLImageElement[];

      const handleDownload = async () => {
        if (downloadingItems.has(item.id)) {
          return;
        }

        setDownloadingItems(prev => new Set(prev).add(item.id));

        try {
          if (!cdnProxyUrl) {
            throw new Error('CDN proxy URL not configured');
          }

          const originalUrl = new URL(item.url);
          const filename = originalUrl.pathname.substring(1);
          const proxyUrl = `${cdnProxyUrl}/${encodeURIComponent(filename)}`;
          const urlExtension = item.url.split('.').pop()?.toLowerCase();
          let extension = '.webp';

          if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(urlExtension)) {
            extension = `.${urlExtension}`;
          }

          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${data.downloadPrefix}-${index + 1}${extension}`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();

          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          }, 100);
        } catch (error) {
          console.error('Download failed:', error);
        } finally {
          setDownloadingItems(prev => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        }
      };

      downloadButtons.forEach((button) => {
        button.addEventListener('click', handleDownload);
        downloadListeners.set(button, handleDownload);
      });

      const handleImageError = () => {
        setImageErrors(prev => new Set(prev).add(item.id));
      };

      imageElements.forEach((imageElement) => {
        imageElement.addEventListener('error', handleImageError);
        imageErrorListeners.set(imageElement, handleImageError);
      });
    });

    const updateDownloadStates = () => {
      data.items.forEach((item) => {
        const downloadButtons = Array.from(
          document.querySelectorAll(`[data-gallery-download="${item.id}"]`)
        ) as HTMLButtonElement[];

        downloadButtons.forEach((downloadButton) => {
          const isDownloading = downloadingItems.has(item.id);

          if (isDownloading) {
            downloadButton.disabled = true;
            downloadButton.classList.add('bg-black/30', 'text-white/50');
            downloadButton.classList.remove('bg-black/50', 'hover:bg-black/70', 'text-white/80', 'hover:text-white');
            downloadButton.innerHTML = `
              <svg class="h-5 w-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            `;
          } else {
            downloadButton.disabled = false;
            downloadButton.classList.remove('bg-black/30', 'text-white/50');
            downloadButton.classList.add('bg-black/50', 'hover:bg-black/70', 'text-white/80', 'hover:text-white');
            downloadButton.innerHTML = `
              <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            `;
          }
        });
      });
    };

    const updateImageErrors = () => {
      data.items.forEach((item) => {
        if (imageErrors.has(item.id)) {
          const imageElements = Array.from(
            document.querySelectorAll(`[data-gallery-image="${item.id}"]`)
          ) as HTMLImageElement[];

          imageElements.forEach((imageElement) => {
            imageElement.src = data.defaultImgUrl;
          });
        }
      });
    };

    updateDownloadStates();
    updateImageErrors();

    return () => {
      downloadListeners.forEach((handler, downloadButton) => {
        downloadButton.removeEventListener('click', handler);
      });
      imageErrorListeners.forEach((handler, imageElement) => {
        imageElement.removeEventListener('error', handler);
      });
    };
  }, [data, downloadingItems, imageErrors, cdnProxyUrl]);

  return null;
}
