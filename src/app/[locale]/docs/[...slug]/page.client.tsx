'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import Link from 'fumadocs-core/link';
import { Check } from 'lucide-react';
import {formatTimestamp} from '@/lib/utils'
import Image from 'next/image';

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
    <button
      disabled={isLoading}
      className="flex items-center gap-x-2 text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300 text-sm"
      onClick={onClick}
    >
      {checked ?
        (
          <>
            <Check className="size-3.5" color="#ec4899" />
            Copied!
          </>
        ) : (
          <>
            <Image
              src="/icons/markdown.svg"
              alt="Copy"
              className="size-4.5"
              width={18}
              height={18}
            />
            Copy page as Markdown
          </>
        )} 
    </button>
  );
}

export function EditOnGitHub({ url }: { url: string }) {
  return (
    <Link
      className="flex items-center gap-x-2 text-stone-600 hover:text-stone-500 dark:text-stone-400 dark:hover:text-stone-300 text-sm"
      href={url}
    >
      <Image
        src="/icons/github.svg"
        alt="GitHub"
        className="size-4.5"
        width={18}
        height={18}
      />
      Edit this page on GitHub
    </Link>
  );
}

// New component for displaying the last updated date with an icon
export function LastUpdatedDate({ gitTimestamp }: { gitTimestamp: Date | undefined }) {
  return (
    <div className="flex items-center gap-x-2 text-stone-600 dark:text-stone-400 text-sm">
      <Image
        src="/icons/latest.svg"
        alt="Last updated"
        className="size-4.5"
        width={18}
        height={18}
      />
      Lastest on {gitTimestamp ? formatTimestamp(gitTimestamp.toString(), "yyyy-MM-dd") : "Ages ago"}
    </div>
  );
}