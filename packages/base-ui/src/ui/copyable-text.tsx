'use client';

import * as React from "react";
import { useState } from "react";
import { globalLucideIcons as icons } from "@base-ui/components/global-icon";
import { cn } from "@windrun-huaiin/lib/utils"


export function CopyableText({ text, children }: { text: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (!text) return <span className="text-slate-400">--</span>;

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 -mx-1 transition-all',
        'hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-500/10 dark:hover:text-purple-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 dark:focus-visible:ring-purple-500/50',
        'cursor-pointer select-none'
      )}
      title="点击复制"
    >
      <span className="font-mono text-xs break-all">
        {children || text}
      </span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <icons.Check className="size-3.5 text-green-600 dark:text-green-400" />
        ) : (
          <icons.Copy className="size-3.5 text-purple-500 dark:text-purple-400" />
        )}
      </span>
    </button>
  );
}