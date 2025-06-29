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
  external: [
    // React/Next
    /^react$/,
    /^react\//,
    /^react-dom$/,
    /^react-dom\//,
    /^next$/,
    /^next\//,
    // peer dependencies
    'next-intl',
    'next-themes',
    'tailwindcss',
    'clsx',
    'tailwind-merge',
    'nprogress'
  ],
  esbuildOptions: (options) => {
    options.alias = {
      '@': './src'
    };
  }
}); 