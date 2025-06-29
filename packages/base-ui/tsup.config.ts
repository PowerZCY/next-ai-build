import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/ui/index.ts',
    'src/components/index.ts',
    'src/components/client/index.ts',
    'src/lib/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Force using rollup instead of esbuild
  bundle: true,
  platform: 'neutral',
  // Explicit external configuration
  external: [
    /^react$/,
    /^react\//,
    /^react-dom$/,
    /^react-dom\//,
    /^next$/,
    /^next\//,
    'next-intl',
    'next-themes',
    'clsx',
    'tailwind-merge',
    'tailwindcss',
    // Node global variables
    'process'
  ],
  // Disable code splitting, ensure external works correctly
  treeshake: true,
  minify: false
}); 