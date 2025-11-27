import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { preserveDirectives } from 'rollup-plugin-preserve-directives';

// Align build entry points with package.json exports to produce per-module outputs
const entries = [
  'src/index.ts',
  'src/cli/index.ts',
  'src/prisma/index.ts',
  'src/prisma/client.ts',
  'src/services/database/index.ts',
  'src/services/aggregate/index.ts',
  'src/services/context/index.ts',
  'src/services/stripe/index.ts',
  'src/lib/index.ts',
];

const createConfig = (format) => ({
  input: entries,
  external: [
    'next',
    /^next\//,
    /^@clerk\//,
    'stripe',
    'svix',
    /^@windrun-huaiin\//,
    /^@prisma\/client/,
    'commander',
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: format === 'es',
      declarationMap: format === 'es',
      declarationDir: format === 'es' ? 'dist' : undefined,
      rootDir: 'src',
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      module: 'esnext',
    }),
    preserveDirectives(),
  ],
  output: {
    dir: 'dist',
    format,
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: format === 'es' ? '[name].mjs' : '[name].js',
    chunkFileNames: format === 'es' ? '[name]-[hash].mjs' : '[name]-[hash].js',
    exports: 'auto',
    banner: (chunk) => (chunk.facadeModuleId?.endsWith('cli/index.ts') ? '#!/usr/bin/env node' : undefined),
  },
});

export default defineConfig([
  createConfig('es'),
  createConfig('cjs'),
]);
