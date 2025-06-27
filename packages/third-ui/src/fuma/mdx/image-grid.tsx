'use client';

import { ImageZoom } from '@third-ui/fuma/mdx/image-zoom';

export function ImageGrid({
  type="url",
  images,
  altPrefix = '',
  cdnBaseUrl,
}: {
  type: "url" | "local";
  images: string[];
  altPrefix?: string;
  cdnBaseUrl?: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        justifyItems: 'center',
        alignItems: 'center', 
      }}
    >
      {images.map((img, idx) => (
        <ImageZoom
          key={img}
          src={type === "url" ? `${cdnBaseUrl}/${img}` : img}
          alt={`${altPrefix}-${idx+1}`}
        />
      ))}
    </div>
  );
} 