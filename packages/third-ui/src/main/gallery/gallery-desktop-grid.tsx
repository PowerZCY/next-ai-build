import Image from "next/image";
import { GalleryItem } from "./gallery-types";

interface Props {
  items: GalleryItem[];
}

export function GalleryDesktopGrid({ items }: Props) {
  return (
    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="group relative overflow-hidden rounded-xl"
            data-gallery-item={item.id}
            data-gallery-index={index}
          >
            <Image
              src={item.url}
              alt={item.altMsg}
              width={600}
              height={600}
              className="w-full h-80 object-cover transition duration-300 group-hover:scale-105"
              data-gallery-image={item.id}
            />
            <div className="absolute inset-0 flex items-end justify-end p-4 opacity-0 group-hover:opacity-100 transition duration-300">
              <button
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all duration-300"
                data-gallery-download={item.id}
                aria-label={`Download ${item.altMsg}`}
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
  );
}