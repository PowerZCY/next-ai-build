import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    utils: 'src/utils.ts',
    'llm-utils': 'src/llm-utils.ts',
    'common-app-config': 'src/common-app-config.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'clsx', 'tailwind-merge'],
  splitting: false,
  sourcemap: true,
  treeshake: true,
  minify: false,
}) 