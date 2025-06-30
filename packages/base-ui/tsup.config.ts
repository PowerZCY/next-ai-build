import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/ui/index.ts',
    'src/components/index.ts',
    'src/components/server.ts',
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
  platform: 'neutral',
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
    'clsx',
    'tailwind-merge',
    'tailwindcss',
    // Node global variables
    'process'
  ],
  esbuildOptions: (options) => {
    options.alias = {
      '@': './src'
    };
  }
}); 