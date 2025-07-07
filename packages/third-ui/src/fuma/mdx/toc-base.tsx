'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import Link from 'fumadocs-core/link';
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { Button } from '@base-ui/ui/button';

const cache = new Map<string, string>();

export function LLMCopyButton({ llmApiUrl }: { llmApiUrl?: string } = {}) {
  const [isLoading, setLoading] = useState(false);
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string[];

  const [checked, onClick] = useCopyButton(async () => {
    setLoading(true);

    // Handle cases where slug might be undefined or empty
    const path = (slug && Array.isArray(slug)) ? slug.join('/') : '';
    const apiPrefix = llmApiUrl || '/api/llm-content';
    const apiUrl = `${apiPrefix}?locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(path)}`;
    console.log('Fetching LLM content from:', apiUrl);

    let content: string;
    try {
      if (cache.has(apiUrl)) {
        content = cache.get(apiUrl)!;
      } else {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          content = `Error: Failed to fetch LLM content: ${res.status} ${res.statusText}`;
        } else {
          content = await res.text();
          // only success then store cache
          cache.set(apiUrl, content); 
        }
      }
      await navigator.clipboard.writeText(content);
    } catch (error) {
      const errMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
      await navigator.clipboard.writeText(errMsg);
      console.error("Error fetching or copying LLM content:", error);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={isLoading}
      // force button to left align
      className="justify-start px-0 text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300"
      onClick={onClick}
    >
      {checked ? (
        <>
          <icons.Check/>
          Copied!
        </>
      ) : (
        <>
          <icons.Markdown/>
          Copy page as Markdown
        </>
      )}
    </Button>
  );
}

export function EditOnGitHub({ url }: { url: string }) {
  return (
    <Link
      className="flex items-center gap-x-2 text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300 text-sm"
      href={url}
    >
      <icons.GitHub/>
      Edit this page on GitHub
    </Link>
  );
}

// New component for displaying the last updated date with an icon
export function LastUpdatedDate({ date }: { date: string | undefined }) {
  return (
    <div className="flex items-center gap-x-2 text-stone-600 dark:text-stone-400 text-sm">
      <icons.LastUpdated/>
      Lastest on {date ? date : "Ages ago"}
    </div>
  );
}