'use client';

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { cn } from '@lib/utils';
import { richText } from '@third-ui/main/rich-text-expert';

export function FAQ({ sectionClassName }: { sectionClassName?: string }) {
  const t = useTranslations('faq');
  const items = t.raw('items') as Array<{
    question: string;
    answer: string;
  }>;
  const [openArr, setOpenArr] = useState<boolean[]>(() => items.map(() => false));

  const handleToggle = (idx: number) => {
    setOpenArr(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  return (
    <section id="faq" className={cn("px-16 py-10 mx-16 md:mx-32 scroll-mt-20", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        {t('title')}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-base md:text-lg mx-auto">
        {richText(t, 'description')}
      </p>
      <div className="space-y-6">
        {items.map((item, idx) => {
          const isOpen = openArr[idx];
          const Icon = isOpen ? icons.ChevronDown : icons.ChevronRight;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800/60 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition shadow-sm dark:shadow-none"
            >
              <button
                className="w-full flex items-center justify-between text-left focus:outline-none"
                onClick={() => handleToggle(idx)}
                aria-expanded={isOpen}
              >
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.question}</span>
                <Icon className="w-6 h-6 text-gray-400 ml-2 transition-transform duration-200" />
              </button>
              {isOpen && (
                <div className="mt-4 text-gray-700 dark:text-gray-300 text-base">
                  {richText(t, `items.${idx}.answer`)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
} 