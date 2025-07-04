'use client';

import { cn } from '@lib/utils';
import Link from 'fumadocs-core/link';
import type { HTMLAttributes, ReactNode } from 'react';

export function AirticalCards(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('grid grid-cols-2 gap-4 @container', props.className)}
    >
      {props.children}
    </div>
  );
}

export type AirticalCardProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;

  href?: string;
  external?: boolean;
};

export function AirticalCard({ icon, title, description, ...props }: AirticalCardProps) {
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
      {icon ? (
        <div className="not-prose mb-2 w-fit rounded-md border bg-fd-muted p-1.5 text-fd-muted-foreground [&_svg]:size-4">
          {icon}
        </div>
      ) : null}
      <h3 className="not-prose mb-1 text-sm font-medium">{title}</h3>
      {description ? (
        <p className="!my-0 text-sm text-fd-muted-foreground">{description}</p>
      ) : null}
      {props.children ? (
        <div className="text-sm text-fd-muted-foreground prose-no-margin">
          {props.children}
        </div>
      ) : null}
    </E>
  );
}
