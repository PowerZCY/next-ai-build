import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    // React 
    'react',
    'react-dom',
    // Next.js core and submodules
    'next',
    'next/image',
    'next/link',
    'next/navigation',
    'next/router',
    'next/head',
    'next/script',
    'next/dynamic',
    'next/server',
    'next/config',
    'next/error',
    'next/font',
    'next/headers',
    'next/cookies',
    // Next.js plugins
    'next-intl',
    'next-themes'
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