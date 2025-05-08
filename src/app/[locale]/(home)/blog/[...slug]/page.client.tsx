'use client';
import { globalLucideIcons as icons } from "@/components/global-icon"
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';

export function Control({ url }: { url: string }): React.ReactElement {
  const [isChecked, onCopy] = useCopyButton(() => {
    void navigator.clipboard.writeText(`${window.location.origin}${url}`);
  });

  return (
    <button
      type="button"
      className={cn(
        buttonVariants({ className: 'gap-2', variant: 'secondary' }),
      )}
      onClick={onCopy}
    >
      {isChecked ? <icons.Check className="size-4" /> : <icons.Share className="size-4" />}
      {isChecked ? 'Copied URL' : 'Share Post'}
    </button>
  );
}