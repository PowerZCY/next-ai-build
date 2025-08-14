'use client';

// Fingerprint system client-side exports
// This follows the design specification for fingerprint module exports

// Shared utilities (can be used in any environment)
export * from './fingerprint-shared';
export * from './types';

// Client-side utilities (browser only)
export * from './fingerprint-client';

// Client-side hooks and context
export * from './use-fingerprint';
export * from './fingerprint-provider';