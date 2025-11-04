'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@windrun-huaiin/base-ui/ui';
import { useMemo } from 'react';

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

  const formattedBalance = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(totalBalance),
    [locale, totalBalance],
  );

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${formattedBalance} ${totalLabel}`}
          className={cn(
            'group ml-1 mr-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-2 pr-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
            'hover:border-transparent hover:bg-gradient-to-r hover:from-purple-500/90 hover:to-pink-500/90 hover:text-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 dark:hover:from-purple-500 dark:hover:to-pink-500',
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-400/20 to-pink-500/20 text-purple-600 transition-transform group-hover:scale-105 dark:text-purple-200">
            <icons.Gem className="h-3.5 w-3.5" />
          </span>
          <span className="relative flex items-center">
            <span className="text-base font-semibold leading-none">
              {formattedBalance}
            </span>
            <span className="sr-only">
              {` ${totalLabel}`}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={12}
        align="end"
        className="z-50 border-0 bg-transparent p-0 shadow-none"
      >
        <div className="w-[410px] max-w-[95vw] overflow-y-auto overflow-x-hidden rounded-3xl bg-transparent">
          {children}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
