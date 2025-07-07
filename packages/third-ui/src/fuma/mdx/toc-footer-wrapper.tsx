'use client';
import { EditOnGitHub, LastUpdatedDate, LLMCopyButton } from '@third-ui/fuma/mdx/toc-base';

interface TocFooterProps {
  lastModified: string | undefined;
  editPath?: string;
  githubBaseUrl?: string;
  showCopy?: boolean;
}

export function TocFooterWrapper({ lastModified, editPath, githubBaseUrl, showCopy }: TocFooterProps) {
  const showEdit = githubBaseUrl && editPath;
  return (
    <div className="flex flex-col gap-y-2 items-start m-4">
      <LastUpdatedDate date={lastModified} />
      {showCopy && <LLMCopyButton />}
      {showEdit && <EditOnGitHub url={`${githubBaseUrl}${editPath}`} />}
    </div>
  );
} 