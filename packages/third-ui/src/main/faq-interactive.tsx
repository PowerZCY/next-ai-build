'use client';

import { useState, useEffect } from 'react';

interface FAQData {
  title: string;
  description: string;
  items: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export function FAQInteractive({ data }: { data: FAQData }) {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Progressive enhancement: Add interactivity to existing DOM elements
    data.items.forEach((item) => {
      const toggleButton = document.querySelector(`[data-faq-toggle="${item.id}"]`) as HTMLButtonElement;
      const contentDiv = document.querySelector(`[data-faq-content="${item.id}"]`) as HTMLDivElement;
      const iconSvg = document.querySelector(`[data-faq-icon="${item.id}"]`) as SVGElement;

      if (toggleButton && contentDiv && iconSvg) {
        const handleClick = () => {
          const isOpen = openStates[item.id] || false;
          const newOpenState = !isOpen;

          // Update state
          setOpenStates(prev => ({
            ...prev,
            [item.id]: newOpenState
          }));

          // Update DOM
          if (newOpenState) {
            contentDiv.classList.remove('hidden');
            toggleButton.setAttribute('aria-expanded', 'true');
            iconSvg.style.transform = 'rotate(90deg)';
          } else {
            contentDiv.classList.add('hidden');
            toggleButton.setAttribute('aria-expanded', 'false');
            iconSvg.style.transform = 'rotate(0deg)';
          }
        };

        toggleButton.addEventListener('click', handleClick);

        // Cleanup function will be handled by the effect cleanup
      }
    });

    // Cleanup event listeners
    return () => {
      data.items.forEach((item) => {
        const toggleButton = document.querySelector(`[data-faq-toggle="${item.id}"]`) as HTMLButtonElement;
        if (toggleButton) {
          // Remove all event listeners by cloning the element
          const newButton = toggleButton.cloneNode(true);
          toggleButton.parentNode?.replaceChild(newButton, toggleButton);
        }
      });
    };
  }, [data, openStates]);

  return null; // Progressive enhancement - no additional DOM rendering
}