'use client'

import { useEffect } from 'react';
import { showBanner } from '@/lib/appConfig';

export function FumaBannerSuit() {
  useEffect(() => {
    // 如果设置了banner, 就需要调节header的高度
    document.documentElement.style.setProperty('--fd-banner-height', showBanner ? '2.5rem' : '-0.5rem');
  }, []);

  return (
    <></>
  );
}

