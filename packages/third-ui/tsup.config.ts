import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/clerk/index.ts',
    'src/main/index.ts',
    'src/fuma/server.ts',
    'src/fuma/mdx/index.ts',
    'src/lib/server.ts'
  ],
  format: ['cjs', 'esm'],
  outExtension: ({ format }) => {
    return {
      js: format === 'esm' ? '.mjs' : '.js'
    };
  },
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
      '@': './src',
      '@third-ui': './src',
      '@base-ui': '../base-ui/src',
      '@lib': '../lib/src'
    };
  }
}); 