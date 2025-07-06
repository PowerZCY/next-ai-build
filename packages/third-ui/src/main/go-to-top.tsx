'use client';

import { useState, useEffect } from 'react';
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';

export function GoToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // listen to scroll event
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

  // scroll to top
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
          className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 dark:hover:to-pink-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          aria-label="Go to top"
        >
          <icons.ArrowUp size={20} className="text-white" />
        </button>
      )}
    </>
  );
} 