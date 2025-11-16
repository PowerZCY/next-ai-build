'use client';

import * as React from 'react';
import { useState } from 'react';
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { cn } from '@windrun-huaiin/lib/utils';

export function CopyableText({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    // 关键！阻止 button 默认行为，才能让移动端长按生效
    e.preventDefault();

    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 静默失败
    }
  };

  if (!text) return <span className="text-slate-400">--</span>;

  return (
    // 改成 div + onMouseDown + preventDefault
    // 这样既能点又能长按，还能用 hover 高亮
    <div
      onMouseDown={handleCopy}
      // 关键两行：允许文本被选中 + 允许长按菜单
      className={cn(
        'group relative inline-flex items-center gap-1.5 rounded-md',
        'px-1.5 -mx-1.5 py-0.5 cursor-pointer select-text', // select-text 至关重要！
        'hover:bg-purple-50 hover:text-purple-700',
        'dark:hover:bg-purple-500/10 dark:hover:text-purple-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400',
        'transition-all',
        'text-[0.5rem] sm:text-[0.625rem] md:text-xs font-mono leading-tight',
        'min-h-4'
      )}
      title="Click to copy"
    >
      <span className="break-all">
        {children || text}
      </span>

      <icons.Check
        className={cn(
          'size-3 shrink-0',
          'transition-opacity duration-200',
          copied ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}