'use client';

import { EditOnGitHub, LastUpdatedDate, LLMCopyButton } from '@/components/toc-base';
import { appConfig } from '@/lib/appConfig';

interface TocFooterProps {
  /**
   * The last modified date of the page.
   */
  lastModified: string | undefined;
  /**
   * The path to the file for the \"Edit on GitHub\" link.
   * This should be the relative path from the repository root, e.g., 'src/mdx/docs/your-page.mdx'.
   */
  editPath?: string | undefined;
  /**
   * Whether to show the copy button.
   */
  showCopy?: boolean | undefined;
}

export function TocFooter({ lastModified, showCopy, editPath }: TocFooterProps) {
  const showEdit = appConfig.githubBaseUrl && editPath;
  return (
    <div className="flex flex-col gap-y-2 items-start m-4">
      <LastUpdatedDate date={lastModified} />
      {showCopy && <LLMCopyButton />}
      {showEdit && <EditOnGitHub url={`${appConfig.githubBaseUrl}${editPath}`} />}
    </div>
  );
} 