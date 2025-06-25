import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/clerk/index.ts',
    'src/main/index.ts',
    'src/fuma/index.ts',
    'src/fuma/mdx/index.ts'
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
    '@clerk/nextjs',
    'fumadocs-core',
    'fumadocs-ui'
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