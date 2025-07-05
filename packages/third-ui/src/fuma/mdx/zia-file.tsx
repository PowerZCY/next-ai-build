import { globalLucideIcons as icons } from '@base-ui/components/global-icon'; 
import { type HTMLAttributes, type ReactNode, useState } from 'react';
import { cn } from '@lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'fumadocs-ui/components/ui/collapsible';
import React from 'react';
import Link from 'next/link';

const itemVariants = 'flex flex-row items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4';

// 注解样式：色彩突出且主题适配
const anotionClass = 'ms-2 px-2 py-0.5 rounded text-xs font-semibold bg-fd-accent/80 text-fd-accent-foreground dark:bg-white/20 dark:text-white';

export interface ZiaFileProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  icon?: ReactNode;
  anotion?: string;
  href?: string;
}

export interface ZiaFolderProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  anotion?: string;
  disabled?: boolean;
  defaultOpen?: boolean;
}

export function ZiaFile({
  name,
  icon = <icons.File />,
  className,
  anotion,
  href,
  ...rest
}: ZiaFileProps): React.ReactElement {
  const validHref = typeof href === 'string' && href.trim() !== '';
  const Comp: React.ElementType = validHref ? Link : 'div';
  const validAnotion = typeof anotion === 'string' && anotion.trim() !== '';
  return React.createElement(
    Comp,
    {
      className: cn(itemVariants,  className),
      ...(validHref ? { href } : {}),
      ...rest,
    },
    <>
      {icon}
      <span>{name}</span>
      {validAnotion && (
        <span className={anotionClass}>{anotion}</span>
      )}
    </>
  );
}

export function ZiaFolder({
  name,
  anotion,
  defaultOpen = false,
  className,
  children,
  ...props
}: ZiaFolderProps): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);
  const validAnotion = typeof anotion === 'string' && anotion.trim() !== '';

  return (
    <Collapsible open={open} onOpenChange={setOpen} {...props}>
      <CollapsibleTrigger className={cn(itemVariants, className, 'w-full')}>
        {open ? <icons.FolderOpen /> : <icons.Folder />}
        <span>{name}</span>
        {validAnotion && (
          <span className={anotionClass}>{anotion}</span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ms-2 flex flex-col border-l ps-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
} 