'use client';

import { useState, useEffect } from 'react';

interface GalleryItem {
  id: string;
  url: string;
  altMsg: string;
}

interface GalleryData {
  titleL: string;
  eyesOn: string;
  titleR: string;
  description: string;
  items: GalleryItem[];
  defaultImgUrl: string;
  downloadPrefix: string;
}

export function GalleryInteractive({ data }: { data: GalleryData }) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());
  
  // Get CDN proxy URL from environment
  const cdnProxyUrl = process.env.NEXT_PUBLIC_STYLE_CDN_PROXY_URL;

  useEffect(() => {
    // Progressive enhancement: Add download functionality and error handling
    data.items.forEach((item, index) => {
      const downloadButton = document.querySelector(`[data-gallery-download="${item.id}"]`) as HTMLButtonElement;
      const imageElement = document.querySelector(`[data-gallery-image="${item.id}"]`) as HTMLImageElement;

      if (downloadButton) {
        const handleDownload = async () => {
          // Prevent duplicate clicks
          if (downloadingItems.has(item.id)) {
            return;
          }

          // Set download status
          setDownloadingItems(prev => new Set(prev).add(item.id));

          try {
            if (!cdnProxyUrl) {
              throw new Error('CDN proxy URL not configured');
            }

            // Use R2 proxy to download directly
            const originalUrl = new URL(item.url);
            const filename = originalUrl.pathname.substring(1);
            
            // Build proxy download URL
            const proxyUrl = `${cdnProxyUrl}/${encodeURIComponent(filename)}`;
            
            // Extract file extension from URL
            const urlExtension = item.url.split('.').pop()?.toLowerCase();
            let extension = '.webp';
            if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(urlExtension)) {
              extension = `.${urlExtension}`;
            }
            
            // Fetch file from proxy
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Convert to blob
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            // Create download link and trigger download
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${data.downloadPrefix}-${index + 1}${extension}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            // Clean up DOM elements and blob URL
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(blobUrl);
            }, 100);
            
          } catch (error) {
            console.error('Download failed:', error);
          } finally {
            // Clear download status
            setDownloadingItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(item.id);
              return newSet;
            });
          }
        };

        downloadButton.addEventListener('click', handleDownload);
      }

      if (imageElement) {
        const handleImageError = () => {
          setImageErrors(prev => new Set(prev).add(item.id));
          // Update image src to default
          imageElement.src = data.defaultImgUrl;
        };

        imageElement.addEventListener('error', handleImageError);
      }
    });

    // Update download button states based on downloading status
    const updateDownloadStates = () => {
      data.items.forEach((item) => {
        const downloadButton = document.querySelector(`[data-gallery-download="${item.id}"]`) as HTMLButtonElement;
        if (downloadButton) {
          const isDownloading = downloadingItems.has(item.id);
          
          if (isDownloading) {
            downloadButton.disabled = true;
            downloadButton.classList.add('bg-black/30', 'text-white/50');
            downloadButton.classList.remove('bg-black/50', 'hover:bg-black/70', 'text-white/80', 'hover:text-white');
            
            // Replace icon with spinner
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
            
            // Reset to download icon
            downloadButton.innerHTML = `
              <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            `;
          }
        }
      });
    };

    updateDownloadStates();

    // Cleanup event listeners
    return () => {
      data.items.forEach((item) => {
        const downloadButton = document.querySelector(`[data-gallery-download="${item.id}"]`) as HTMLButtonElement;
        const imageElement = document.querySelector(`[data-gallery-image="${item.id}"]`) as HTMLImageElement;
        
        if (downloadButton) {
          const newButton = downloadButton.cloneNode(true);
          downloadButton.parentNode?.replaceChild(newButton, downloadButton);
        }
        
        if (imageElement) {
          const newImage = imageElement.cloneNode(true);
          imageElement.parentNode?.replaceChild(newImage, imageElement);
        }
      });
    };
  }, [data, downloadingItems, imageErrors, cdnProxyUrl]);

  return null; // Progressive enhancement - no additional DOM rendering
}