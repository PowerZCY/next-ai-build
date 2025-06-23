import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { globalLucideIcons as icons } from '@/components/global-icon';

export function GradientButton({
  title,
  icon,
  href,
  align = 'left',
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  href: string;
  align?: 'left' | 'center' | 'right';
}) {
  // 根据对齐方式设置justify类
  const getAlignmentClass = () => {
    switch (align) {
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default: // 'left'
        return 'justify-start';
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${getAlignmentClass()}`}>
      <Button
        asChild
        size="lg"
        className="
          bg-gradient-to-r 
          from-purple-400 to-pink-500 
          hover:from-purple-500 hover:to-pink-600
          dark:from-purple-500 dark:to-pink-600 
          dark:hover:from-purple-600 dark:hover:to-pink-700
          text-white text-base font-bold shadow-lg hover:shadow-xl
          transition-all duration-300
          rounded-full
        "
      >
        <Link href={href} target="_blank" rel="noopener noreferrer" className="no-underline hover:no-underline">
          <span>{title}</span>
          <span className="ml-1">
            {icon ? 
              React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
                className: "h-4 w-4 text-white" 
              }) : 
              <icons.ArrowRight className="h-4 w-4 text-white" />
            }
          </span>
        </Link>
      </Button>
    </div>
    
  );
} 