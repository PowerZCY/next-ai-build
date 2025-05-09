import { globalLucideIcons as icons } from "@/components/global-icon"
import Link, { type LinkProps } from 'next/link';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Spot from '@/../public/banner.png';

export default function D8gerPage(): React.ReactElement {
  return (
    <main className="container relative flex flex-col items-center py-16 text-center z-[2]">
      <div className="absolute inset-0 z-[-1] select-none overflow-hidden opacity-50 flex justify-center items-center">
        <Image
          alt="spot"
          src={Spot}
          sizes="100vw"
          className="w-full h-full object-contain"
          priority
        />
      </div>
      <h1 className="mb-4 text-4xl font-semibold md:text-5xl">
        Getting Started
      </h1>
      <p className="text-fd-muted-foreground">
        You can start with Fumadocs, or just use the core library.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <a
          href="https://github.com/fuma-nama/fumadocs"
          rel="noreferrer noopener"
          className={cn(buttonVariants({ size: 'lg' }))}
        >
          Github
        </a>
        <Link
          href="/showcase"
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
        >
          Showcase
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 gap-4 text-left md:grid-cols-2">
        <Item href="/docs/ui">
          <Icon>
            <icons.Building2 className="size-full" />
          </Icon>
          <h2 className="mb-2 text-lg font-semibold">Fumadocs</h2>
          <p className="text-sm text-fd-muted-foreground">
            The full-powered documentation framework with an excellent UI.
          </p>
        </Item>
        <Item href="/docs/headless">
          <Icon>
            <icons.LibraryIcon className="size-full" />
          </Icon>
          <h2 className="mb-2 text-lg font-semibold">Fumadocs Core</h2>
          <p className="text-sm text-fd-muted-foreground">
            The core library of Fumadocs.
          </p>
        </Item>
      </div>
    </main>
  );
}

function Icon({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      className="mb-2 size-9 rounded-lg border p-1.5 shadow-fd-primary/30"
      style={{
        boxShadow: 'inset 0px 8px 8px 0px var(--tw-shadow-color)',
      }}
    >
      {children}
    </div>
  );
}

function Item(
  props: LinkProps & { children: React.ReactNode },
): React.ReactElement {
  return (
    <Link
      {...props}
      className="rounded-2xl border border-transparent p-6 shadow-lg"
      style={{
        backgroundImage:
          'linear-gradient(to right bottom, var(--color-fd-background) 10%, var(--color-fd-accent), var(--color-fd-background) 60%),' +
          'linear-gradient(to right bottom, rgb(40,40,40) 10%, rgb(180,180,180), rgb(30,30,30) 60%)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      {props.children}
    </Link>
  );
}