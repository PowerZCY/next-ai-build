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
    'react',
    'react-dom',
    'next',
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