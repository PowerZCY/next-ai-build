// Re-export everything from sub-modules for convenience
// ⚠️ IMPORTANT: Client components are NOT exported here to avoid server component contamination
// For client components, use: import { ... } from '@base-ui/components/client'

export * from './ui';
export * from './components'; // Only server/universal components
export * from './lib'; 