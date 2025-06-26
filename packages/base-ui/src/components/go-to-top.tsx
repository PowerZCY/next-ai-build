'use client';

import { useState, useEffect } from 'react';
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
export default function GoToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // 监听滚动事件
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // 回到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-neutral-800 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-300 dark:text-neutral-900 dark:hover:bg-neutral-400 rounded-full shadow-lg transition-all z-50"
          aria-label="Go to top"
        >
          <icons.ArrowUp size={20} />
        </button>
      )}
    </>
  );
} 