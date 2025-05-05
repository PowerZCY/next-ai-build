'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import Link from 'fumadocs-core/link';
import { Check } from 'lucide-react';

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
            <svg
              fill="currentColor"
              role="img"
              viewBox="0 0 1024 1024"
              className="size-4.5"
            >
              <title>Markdown</title>
              <path
                d="M20.48 327.76192a163.84 163.84 0 0 1 163.84-163.84h655.36a163.84 163.84 0 0 1 163.84 163.84v327.68a163.84 163.84 0 0 1-163.84 163.84H184.32a163.84 163.84 0 0 1-163.84-163.84v-327.68z m163.84-81.92a81.92 81.92 0 0 0-81.92 81.92v327.68a81.92 81.92 0 0 0 81.92 81.92h655.36a81.92 81.92 0 0 0 81.92-81.92v-327.68a81.92 81.92 0 0 0-81.92-81.92H184.32z m68.97664 84.00896a40.96 40.96 0 0 1 45.71136 14.336L389.12 464.24064l90.112-120.13568a40.96 40.96 0 0 1 73.728 24.576v245.76a40.96 40.96 0 0 1-81.92 0v-122.88l-49.152 65.536a41.04192 41.04192 0 0 1-65.536 0l-49.152-65.536v122.88a40.96 40.96 0 1 1-81.92 0v-245.76a40.96 40.96 0 0 1 28.01664-38.87104zM757.76 368.76288a40.96 40.96 0 0 0-81.92 0v146.8416l-12.00128-12.00128a40.96 40.96 0 0 0-57.91744 57.91744l81.92 81.92a40.96 40.96 0 0 0 57.91744 0l81.92-81.92a40.96 40.96 0 0 0-57.91744-57.91744l-12.00128 12.00128V368.72192z"
                fill="#ec4899" p-id="7370"></path>
            </svg>
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
      <svg
        fill="currentColor"
        role="img"
        viewBox="0 0 1024 1024"
        className="size-4.5"
      >
        <title>GitHub</title>
        <path
          d="M512 0C229.283787 0 0.142041 234.942803 0.142041 524.867683c0 231.829001 146.647305 428.553077 350.068189 497.952484 25.592898 4.819996 34.976961-11.38884 34.976961-25.294314 0-12.45521-0.469203-45.470049-0.725133-89.276559-142.381822 31.735193-172.453477-70.380469-172.453477-70.380469-23.246882-60.569859-56.816233-76.693384-56.816234-76.693385-46.493765-32.58829 3.540351-31.948468 3.540351-31.948467 51.356415 3.71097 78.356923 54.086324 78.356923 54.086324 45.683323 80.19108 119.817417 57.072162 148.993321 43.593236 4.649376-33.91059 17.915029-57.029508 32.50298-70.167195-113.675122-13.222997-233.151301-58.223843-233.1513-259.341366 0-57.285437 19.919806-104.163095 52.678715-140.846248-5.246544-13.265652-22.820334-66.626844 4.990615-138.884127 0 0 42.996069-14.076094 140.760939 53.787741 40.863327-11.644769 84.627183-17.445825 128.177764-17.6591 43.465272 0.213274 87.271782 6.014331 128.135109 17.6591 97.679561-67.906489 140.59032-53.787741 140.59032-53.787741 27.938914 72.257282 10.407779 125.618474 5.118579 138.884127 32.844219 36.683154 52.593405 83.560812 52.593405 140.846248 0 201.586726-119.646798 245.990404-233.663158 258.957473 18.341577 16.208835 34.721032 48.199958 34.721032 97.210357 0 70.167195-0.639822 126.7275-0.639823 143.960051 0 14.033439 9.213443 30.370239 35.190235 25.209005 203.250265-69.527373 349.769606-266.123484 349.769605-497.867175C1023.857959 234.942803 794.673558 0 512 0"
          fill="#ec4899" p-id="6929"></path>
      </svg>
      Edit this page on GitHub
    </Link>
  );
}