'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import Link from 'fumadocs-core/link';
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { Button } from '@base-ui/ui/button';

const cache = new Map<string, string>();

export function LLMCopyButton() {
  const [isLoading, setLoading] = useState(false);
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string[];

  const [checked, onClick] = useCopyButton(async () => {
    setLoading(true);

    const path = slug.join('/');
    const apiUrl = `/api/llm-content?locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(path)}`;
    console.log('Fetching LLM content from:', apiUrl);

    try {
      const content: string =
        cache.get(apiUrl) ?? (await fetch(apiUrl).then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch LLM content: ${res.status} ${res.statusText}`);
          }
          return res.text();
        }));

      cache.set(apiUrl, content);
      await navigator.clipboard.writeText(content);
    } catch (error) {
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
      // 强制按钮左对齐
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