'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@windrun-huaiin/base-ui/ui';
import { useEffect, useMemo, useRef, useState } from 'react';

interface CreditNavButtonProps {
  locale: string;
  totalBalance: number;
  totalLabel: string;
  children: React.ReactNode;
}

export function CreditNavButton({
  locale,
  totalBalance,
  totalLabel,
  children,
}: CreditNavButtonProps) {

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const formattedBalance = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(totalBalance),
    [locale, totalBalance],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const handleMatchChange = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };

    handleMatchChange();
    mediaQuery.addEventListener('change', handleMatchChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMatchChange);
    };
  }, []);

  useEffect(() => {
    if (!open || !isMobile) {
      return;
    }

    const closeMenu = () => setOpen(false);
    const shouldIgnoreTarget = (target: Node | null) =>
      (triggerRef.current && target && triggerRef.current.contains(target)) ||
      (contentRef.current && target && contentRef.current.contains(target));

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (shouldIgnoreTarget(target)) {
        return;
      }
      closeMenu();
    };

    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target as Node | null;
      if (shouldIgnoreTarget(target)) {
        return;
      }
      closeMenu();
    };

    const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;
    if (supportsPointer) {
      document.addEventListener('pointerdown', handlePointerDown);
    } else {
      document.addEventListener('touchstart', handleTouchStart);
    }

    return () => {
      if (supportsPointer) {
        document.removeEventListener('pointerdown', handlePointerDown);
      } else {
        document.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (!open || !isMobile) {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open, isMobile]);

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${formattedBalance} ${totalLabel}`}
          className={cn(
            'group ml-1 mr-0 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-2 pr-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
            'hover:border-transparent hover:bg-linear-to-r hover:from-purple-500/90 hover:to-pink-500/90 hover:text-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 dark:hover:from-purple-500 dark:hover:to-pink-500',
          )}
          ref={triggerRef}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-purple-400/20 to-pink-500/20 text-purple-600 transition-transform group-hover:scale-105 dark:text-purple-200">
            <icons.Gem className="h-3.5 w-3.5" />
          </span>
          <span className="relative flex items-center">
            <span className="text-base font-semibold leading-none">
              {formattedBalance}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={12}
        align="end"
        className="z-50 border-0 bg-transparent p-0 shadow-none  mx-4 sm:mx-2 md:mx-1"
      >
        <div
          className="w-[90vw] max-w-[90vw] overflow-y-auto overflow-x-hidden rounded-3xl bg-transparent sm:w-[410px] sm:max-w-[95vw]"
          ref={contentRef}
        >
          {children}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
