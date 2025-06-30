// Server Components and Universal Components
// ⚠️ IMPORTANT: To avoid client/server component mixing issues in Next.js bundling,
// client components with 'use client' directive are exported separately.
//
// Usage:
// - Server components: import from '@base-ui/components' (this file)
// - Client components: import from '@base-ui/components/client'
//
// Example:
// import { globalLucideIcons, getGlobalIcon } from '@base-ui/components'
// import { NotFoundPage, GoToTop } from '@base-ui/components/client'

// Main server/universal components
export * from './global-icon';
// Icon Configuration  
export { createSiteIcon } from './site-icon';

// For client components, please use:
// import { ... } from '@base-ui/components/client' 