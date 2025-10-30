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
  title: string;
  totalLabel: string;
  children: React.ReactNode;
}

export function CreditNavButton({
  locale,
  totalBalance,
  title,
  totalLabel,
  children,
}: CreditNavButtonProps) {
  const { Gift } = icons;

  const formattedBalance = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(totalBalance),
    [locale, totalBalance],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'group inline-flex items-center gap-2 rounded-full border border-[var(--color-fd-border)] bg-[color:var(--color-fd-muted)] px-4 py-2 text-sm font-semibold text-[color:var(--color-fd-foreground)] transition-all',
            'hover:border-[var(--color-fd-primary)] hover:text-[var(--color-fd-primary)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-fd-primary)]',
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-fd-primary)] text-[var(--color-fd-primary-foreground)] transition-transform group-hover:scale-105">
            <Gift className="h-4 w-4" />
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-xs font-medium text-[color:var(--color-fd-muted-foreground)]">
              {title}
            </span>
            <span>
              {formattedBalance}{' '}
              <span className="text-xs font-medium text-[color:var(--color-fd-muted-foreground)]">
                {totalLabel}
              </span>
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={12}
        align="end"
        className="z-50 border-0 bg-transparent p-0 shadow-none"
      >
        <div className="w-[320px]">
          {children}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
