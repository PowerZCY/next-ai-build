import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/clerk/index.ts',
    'src/clerk/server.ts',
    'src/main/index.ts',
    'src/main/server.ts',
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
  // Use code splitting to reduce the size of the bundle
  splitting: true,
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
    
    // Keep 'use client' and 'use server' directives
    options.banner = {
      js: '/* eslint-disable */',
    };
  },
  esbuildPlugins: [
    {
      name: 'preserve-use-directives',
      setup(build) {
        // Process TypeScript/JavaScript files
        build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args) => {
          try {
            // Dynamically import fs
            // @ts-ignore - fs/promises is available at runtime
            const { readFile } = await import('fs/promises');
            const contents = await readFile(args.path, 'utf8');
            
            // Check if the file contains use directives
            const useClientMatch = contents.match(/^['"]use client['"];?\s*$/m);
            const useServerMatch = contents.match(/^['"]use server['"];?\s*$/m);
            
            if (useClientMatch || useServerMatch) {
              // Ensure directives are at the top of the file
              let processedContents = contents;
              const directive = useClientMatch ? "'use client';" : "'use server';";
              
              // Remove existing directives
              processedContents = processedContents.replace(/^['"]use (client|server)['"];?\s*\n?/gm, '');
              
              // Add directives at the top
              processedContents = `${directive}\n${processedContents}`;
              
              return {
                contents: processedContents,
                loader: args.path.endsWith('.tsx') || args.path.endsWith('.jsx') ? 'tsx' : 'ts',
              };
            }
          } catch (error) {
            console.warn(`Failed to process ${args.path}:`, error);
          }
        });
      },
    },
  ],
});