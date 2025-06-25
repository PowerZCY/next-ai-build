import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    utils: 'src/utils.ts',
    'limited-lucide-icons': 'src/limited-lucide-icons.ts',
    'llm-utils': 'src/llm-utils.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
  splitting: false,
  sourcemap: true,
  minify: false,
}) 