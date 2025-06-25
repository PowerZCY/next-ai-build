import Link from 'fumadocs-core/link';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import { globalLucideIcons as icons } from '@/components/global-icon';

export type ZiaCardProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;

  href?: string;
  external?: boolean;
};

export function ZiaCard({ icon, title, description, ...props }: ZiaCardProps) {
  const E = props.href ? Link : 'div';

  return (
    <E
      {...props}
      data-card
      className={cn(
        'block rounded-lg border bg-fd-card p-4 text-fd-card-foreground shadow-md transition-colors @max-lg:col-span-full',
        props.href && 'hover:bg-fd-accent/80',
        props.className,
      )}
    >
      <div className="not-prose mb-2 w-fit rounded-md border bg-fd-muted p-1.5 text-fd-muted-foreground [&_svg]:size-4">
        {icon ? icon : <icons.CircleSmall />}
      </div>
      <h3 className="not-prose mb-1 text-sm font-medium line-clamp-2 min-h-[2.5rem]">{title}</h3>
      {description ? (
        <p className="!my-0 text-sm text-fd-muted-foreground">{description}</p>
      ) : (
        <p className="!my-0 text-sm text-fd-muted-foreground opacity-0 select-none">&nbsp;</p>
      )}
      {props.children ? (
        <div className="text-sm text-fd-muted-foreground prose-no-margin">
          {props.children}
        </div>
      ) : null}
    </E>
  );
}
