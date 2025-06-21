import React from 'react';
import { ImageZoom } from '@/components/mdx/image-zoom';
import { appConfig } from '@/lib/appConfig';

export function ImageGrid({
  type="url",
  images,
  altPrefix = '',
}: {
  type: "url" | "local";
  images: string[];
  altPrefix?: string;
}) {
  const basePath = appConfig.style.cdnBaseUrl;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        justifyItems: 'center',
      }}
    >
      {images.map((img, idx) => (
        <ImageZoom
          key={img}
          src={type === "url" ? img : `${basePath}/${img}`}
          alt={`${altPrefix}-${idx+1}`}
        />
      ))}
    </div>
  );
} 