# @windrun-huaiin/dev-scripts

## 6.8.2

### Patch Changes

- test(package): just update version

## 6.8.1

### Patch Changes

- feat(app): enhance SEO and localization support

  - Added hero image URL to the Chinese messages
  - Refactored robots and sitemap generation using new handlers
  - Updated blog index and ioc articles' dates
  - Introduced SEO utility functions for better metadata handling
  - Improved app configuration for localization support

## 6.8.0

### Minor Changes

- rollback(dev-scripts): give up support monorepo for nextjs reason
  fix(build): tsup config fix

## 6.7.0

### Minor Changes

- feat(createApp): support monorepo

## 6.6.1

### Patch Changes

- fix(createApp): for completely runnable project

## 6.6.0

### Minor Changes

- feat(createApp): one command for standtard project init

## 6.5.3

### Patch Changes

- feat(ddaas): update API routes and sources for LLM content

  - Refactor API routes to use specific paths for blog, legal, and docs content
  - Update source imports in relevant components
  - Modify configuration to include new API route patterns
  - Adjust date fields in blog MDX files

  fix(lib): bugfix

  - LLMCopyHandler bugfix #3316 when copy page INDEX

  feat(third-ui): bugfix

  - LLMCopyButton now optimize for different router in multi-mdx-source, such as api/docs/llm-content, api/blog/llm-content
  - To avoid vercel deployment with Serverless Function 250M limitation, we recommand splitting different source router

## 6.5.2

### Patch Changes

- fix(scripts): blog generate index and ioc bug, should ignore !xxx
  fix(scripts): enhance handle EMPTY folder

## 6.5.1

### Patch Changes

- fix(scripts): scan dir without above dirs
  - **'.next|node_modules|logs|dist|pnpm-lock.yaml|turbo|.turbo|public|.cursor|.DS_Store|.git'**

## 6.5.0

### Minor Changes

- fix(mdx): add architecture generator scripts

## 6.4.1

### Patch Changes

- fix(icon): add icon

## 6.4.0

### Minor Changes

- feat(main): add price UI
  fix(main): goToTop UI fix
  fix(fuma): menu bar style fix
  feat(icon): add lucide FAQ icon

## 6.3.0

### Minor Changes

- fix(href): next link href should be carful!

## 6.2.0

### Minor Changes

- fix(blog): improve blog prefix handling
  - Refactor blog prefix assignment logic
  - Ensure proper handling of undefined, null, and empty string cases

## 6.1.0

### Minor Changes

- feat(base-ui): add useful icon
  feat(third-ui): add useful fuma mdx component, siteX for email and site title
  feat(ddaas): update mdx

  closed #TP00-108

## 6.0.1

### Patch Changes

- README update

## 6.0.0

### Major Changes

- Add new command `easy-changeset` to generate changeset template
  - Add new command `deep-clean` to clean project env cache

## 5.0.0

### Major Changes

- Server components and Client components are separated!
  - The key point is IMPORT, once you import a client component, then you're client too!

## 4.1.0

### Minor Changes

- Fix tsup config, pack dist should be CAREFUL!

## 4.0.0

### Major Changes

-

## 3.3.0

### Minor Changes

- Repair bundle build config for reason: DO NOT PACK REACT!

## 3.2.3

### Patch Changes

- Clean packages and republish

## 3.2.2

### Patch Changes

- Align the version of some packages to 3.2.2
  - Try to release new version to npm repo

## 3.1.0

### Minor Changes

- Align the version of all packages to 3.1.0
  - Release version 3.1.0

## 1.4.0

### Minor Changes

- Finish the build process for all packages.

  - The build process for all packages is now complete.
  - Turbo build:prod is now complete.
  - Environment variables are now correctly passed to the build process.
  - README.md is now updated.

## 1.3.0

### Minor Changes

- Major icon system refactor and shared assets infrastructure

  ## 🚀 New Features

  ### 📦 Shared Assets Package

  - Introduce `@windrun-huaiin/shared-assets` package for centralized cross-application static resource management
  - Integrate Turborepo task orchestration with intelligent caching for resource copying workflows
  - Provide TypeScript type-safe path configuration and utilities
  - Support development watch mode and production build-time asset copying

  ### 🎨 Icon System Architecture Overhaul

  - Refactor icon component architecture by eliminating redundant size parameters
  - Enhance `globalIcon` intelligent wrapper for unified size and color management
  - Resolve CSS priority conflicts to ensure proper external style inheritance
  - Strengthen type safety with comprehensive icon component type inference

  ## 🔧 Improvements

  ### Base UI (@windrun-huaiin/base-ui)

  - Restructure all custom SVG icon components with simplified parameter interfaces
  - Fix viewBox and fill attribute issues in Java, SQL, CSV, and other icon components
  - Optimize `global-icon.tsx` type definitions and intelligent processing logic
  - Enhance CSS class handling capabilities for icon components

  ### Third UI (@windrun-huaiin/third-ui)

  - Update `FumaGithubInfo` component to resolve icon sizing inconsistencies
  - Improve error handling with graceful network failure fallback mechanisms
  - Standardize icon usage patterns for consistent styling across components

  ### Library (@windrun-huaiin/lib)

  - Provide curated Lucide icon set to optimize bundle size
  - Enhance common utility functions and configuration management

  ### Dev Scripts (@windrun-huaiin/dev-scripts)

  - Support multilingual project development workflows
  - Provide blog index generation and translation validation tools

  ### DDAAS Website (@windrun-huaiin/ddaas-website)

  - Integrate new shared resource management system
  - Modernize icon usage patterns with unified `icons.*` API calls
  - Optimize build pipeline with Turborepo task dependency management

  ## 🐛 Bug Fixes

  - Resolve icon display issues across different theme configurations
  - Fix CSS class priority conflicts causing incorrect icon dimensions
  - Correct SVG viewBox mismatches resulting in icon distortion
  - Address confusion between `themeSvgIconColor` and `themeIconColor` usage

  ## 💥 Breaking Changes

  - Icon components no longer accept `size` parameter; managed centrally by `globalIcon`
  - Default icon dimensions may be adjusted; please verify UI display
  - Shared resource file path structure changes require reference updates

  ## 🧪 Technical Improvements

  - Implement inline style precedence to override external CSS constraints
  - Enhance wrapper component type safety with proper generic constraints
  - Optimize build performance through intelligent asset copying strategies
  - Standardize icon component interfaces across the entire system

  ## 📚 Documentation

  - Comprehensive usage documentation for shared-assets package
  - Updated icon system best practices and implementation guidelines
  - Turborepo integration configuration and deployment instructions

  ***

  This major architectural enhancement improves developer experience and project maintainability. We recommend thorough testing of icon display and shared resource loading before production deployment.

## 1.2.0

### Minor Changes

- feat: upgrade all packages to version 1.2.0

  - Align project base version

## 1.1.0

### Minor Changes

- feat: upgrade all packages to version 1.2.0

  - Refactor ddaas from single-project to monorepo
  - Extract useful UI、Config、util、Script
