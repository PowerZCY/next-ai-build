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
  publicDir: './src/styles',
  noExternal: [],
  external: [
    'react',
    'react-dom',
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
    'next-intl',
    'next-themes'
  ],
  esbuildOptions: (options) => {
    options.alias = {
      '@': './src'
    };
  }
}); 