'use client';

import { EditOnGitHub, LastUpdatedDate, LLMCopyButton } from '@/components/toc-base';
import { appConfig } from '@/lib/appConfig';

interface TocFooterProps {
  /**
   * The last modified date of the page.
   */
  lastModified: Date | undefined;
  /**
   * The path to the file for the \"Edit on GitHub\" link.
   * This should be the relative path from the repository root, e.g., 'src/mdx/docs/your-page.mdx'.
   */
  editPath: string;
}

export function TocFooter({ lastModified, editPath }: TocFooterProps) {
  const githubBaseUrl = appConfig.githubBaseUrl;
  const fullEditUrl = `${githubBaseUrl}${editPath}`;

  return (
    <div className="flex flex-col gap-y-2 items-start m-4">
      <LastUpdatedDate gitTimestamp={lastModified} />
      <LLMCopyButton />
      <EditOnGitHub url={fullEditUrl} />
    </div>
  );
} 