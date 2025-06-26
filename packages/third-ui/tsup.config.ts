import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/clerk/index.ts',
    'src/main/index.ts',
    'src/fuma/index.ts',
    'src/fuma/mdx/index.ts',
    'src/lib/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: [],
  external: [
    'react',
    'react-dom',
    'next',
    'next/link',
    'next/image',
    'next/navigation',
    'next/router',
    'next/head',
    'next/script',
    'next/dynamic',
    'next-intl',
    'next-themes',
    '@clerk/nextjs',
    '@clerk/themes',
    'fumadocs-core',
    'fumadocs-ui',
    'mermaid',
    'react-medium-image-zoom',
    'lucide-react',
    'class-variance-authority',
    'clsx',
    'tailwind-merge'
  ],
  banner: {
    js: '"use client";'
  },
  esbuildOptions: (options) => {
    options.alias = {
      '@': './src'
    };
  }
}); 