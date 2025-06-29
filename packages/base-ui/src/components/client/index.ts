"use client";

// Client Components Only
// These components use 'use client' directive and should be imported separately
// to avoid contaminating server components in the main index.ts

// Base Client Components
export * from '../404-page';
export * from '../go-to-top';
export * from '../language-detector';
export * from '../language-switcher';

// Script Components (All Client-side)
export * from '../script/google-analytics-script';
export * from '../script/microsoft-clarity-script'; 