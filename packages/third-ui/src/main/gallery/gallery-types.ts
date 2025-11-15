
export interface GalleryProps {
  locale: string;
  sectionClassName?: string;
  button?: React.ReactNode;
}

export interface GalleryItem {
  id: string;
  url: string;
  altMsg: string;
}

export interface GalleryData {
  titleL: string;
  eyesOn: string;
  titleR: string;
  description: string;
  items: GalleryItem[];
  defaultImgUrl: string;
  downloadPrefix: string;
}