# @windrun-huaiin/ddaas-website

## 5.14.0

### Minor Changes

- feat(main): gallery support R2 public url

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.1
  - @windrun-huaiin/third-ui@5.11.5
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.13.2

### Patch Changes

- rollback(main): hero style
- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.1
  - @windrun-huaiin/third-ui@5.11.4
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.13.1

### Patch Changes

- fix(main): hero style
- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.1
  - @windrun-huaiin/third-ui@5.11.4
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.13.0

### Minor Changes

- fix(hotfix): aipromt-textarea style bug

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.1
  - @windrun-huaiin/third-ui@5.11.4
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.12.0

### Minor Changes

- fix(hotfix): aipromt-textarea style bug

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.1
  - @windrun-huaiin/third-ui@5.11.3
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.11.0

### Minor Changes

- fix(hotfix): aipromt-textarea title view bug

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.1
  - @windrun-huaiin/third-ui@5.11.2
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.10.0

### Minor Changes

- feat(banner): take over banner suit all! No need more fumadocs-banner

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.1
  - @windrun-huaiin/third-ui@5.11.1
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.9.0

### Minor Changes

- feat(banner): take over banner suit all! No need more fumadocs-banner

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.1
  - @windrun-huaiin/third-ui@5.11.0
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.8.3

### Patch Changes

- feat(clerk): clerk now can show signup button optional in fuma header
  feat(icon): defalt icon change to Sparkles
- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.1
  - @windrun-huaiin/third-ui@5.10.3
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.8.2

### Patch Changes

- refactor(icon): icon now only exists in @windrun-huaiin/buse-ui, and just control dependenly!
- Updated dependencies
  - @windrun-huaiin/base-ui@6.0.0
  - @windrun-huaiin/third-ui@5.10.2
  - @windrun-huaiin/lib@6.1.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.8.0

### Minor Changes

- fix(lib): llmCopy handler refactor, for it's heavy dependency node:fs/path

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@5.3.1
  - @windrun-huaiin/third-ui@5.9.3
  - @windrun-huaiin/lib@5.7.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.7.0

### Minor Changes

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

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@5.3.1
  - @windrun-huaiin/third-ui@5.9.0
  - @windrun-huaiin/lib@5.6.5
  - @windrun-huaiin/shared-assets@4.1.3

## 5.6.2

### Patch Changes

- fix(mdx): add architecture generator scripts
- Updated dependencies
  - @windrun-huaiin/base-ui@5.3.1
  - @windrun-huaiin/third-ui@5.8.1
  - @windrun-huaiin/lib@5.6.1
  - @windrun-huaiin/shared-assets@4.1.3

## 5.6.1

### Patch Changes

- fix(UI): fix uniform link button, defalt is open new tab
- Updated dependencies
  - @windrun-huaiin/base-ui@5.3.1
  - @windrun-huaiin/third-ui@5.8.1
  - @windrun-huaiin/lib@5.6.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.6.0

### Minor Changes

- refactor(mdx): fix llmcopy button, now can support multi-mdx-source

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@5.3.1
  - @windrun-huaiin/third-ui@5.8.0
  - @windrun-huaiin/lib@5.6.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.5.0

### Minor Changes

- refactor(toc): fix copy button

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@5.3.1
  - @windrun-huaiin/third-ui@5.7.0
  - @windrun-huaiin/lib@5.5.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.4.0

### Minor Changes

- fix(icon): add icon
  fix(main): optimize MAIN UI style
  fix(i18n): adaptor translation

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@5.3.1
  - @windrun-huaiin/third-ui@5.6.0
  - @windrun-huaiin/lib@5.5.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.3.1

### Patch Changes

- fix(icon): add icon
- Updated dependencies
  - @windrun-huaiin/base-ui@5.3.1
  - @windrun-huaiin/third-ui@5.5.0
  - @windrun-huaiin/lib@5.4.0
  - @windrun-huaiin/shared-assets@4.1.3

## 5.3.0

### Minor Changes

- feat(main): add price UI
  fix(main): goToTop UI fix
  fix(fuma): menu bar style fix
  feat(icon): add lucide FAQ icon

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@5.3.0
  - @windrun-huaiin/third-ui@5.4.0
  - @windrun-huaiin/lib@5.3.0
  - @windrun-huaiin/shared-assets@4.1.2

## 5.2.2

### Patch Changes

- fix(href): next link href should be carful!
- Updated dependencies
  - @windrun-huaiin/base-ui@5.2.0
  - @windrun-huaiin/third-ui@5.3.0
  - @windrun-huaiin/lib@5.2.0
  - @windrun-huaiin/shared-assets@4.1.2

## 5.2.1

### Patch Changes

- fix(blog): improve blog prefix handling
  - Refactor blog prefix assignment logic
  - Ensure proper handling of undefined, null, and empty string cases
- Updated dependencies
  - @windrun-huaiin/base-ui@5.2.0
  - @windrun-huaiin/third-ui@5.2.1
  - @windrun-huaiin/lib@5.2.0
  - @windrun-huaiin/shared-assets@4.1.2

## 5.2.0

### Minor Changes

- feat(base-ui): add useful icon
  feat(third-ui): add useful fuma mdx component, siteX for email and site title
  feat(ddaas): update mdx

  closed #TP00-108

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@5.2.0
  - @windrun-huaiin/third-ui@5.2.0
  - @windrun-huaiin/lib@5.2.0
  - @windrun-huaiin/shared-assets@4.1.2

## 5.1.2

### Patch Changes

- README update
- Updated dependencies
  - @windrun-huaiin/base-ui@5.1.2
  - @windrun-huaiin/third-ui@5.1.2
  - @windrun-huaiin/lib@5.1.2
  - @windrun-huaiin/shared-assets@4.1.2

## 5.1.1

### Patch Changes

- Server components and Client components are separated!
  - The key point is IMPORT, once you import a client component, then you're client too!
- Updated dependencies
  - @windrun-huaiin/base-ui@5.1.1
  - @windrun-huaiin/third-ui@5.1.1
  - @windrun-huaiin/lib@5.1.1
  - @windrun-huaiin/shared-assets@4.1.1

## 5.1.0

### Minor Changes

- Fix tsup config, pack dist should be CAREFUL!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@5.1.0
  - @windrun-huaiin/third-ui@5.1.0
  - @windrun-huaiin/lib@5.1.0
  - @windrun-huaiin/shared-assets@4.1.0

## 5.0.0

### Major Changes

-

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@5.0.0
  - @windrun-huaiin/third-ui@5.0.0
  - @windrun-huaiin/lib@5.0.0
  - @windrun-huaiin/shared-assets@4.0.0

## 4.0.1

### Patch Changes

- fix: export components should be CAREFUL!
- Updated dependencies
  - @windrun-huaiin/base-ui@4.1.1
  - @windrun-huaiin/third-ui@4.0.1
  - @windrun-huaiin/lib@4.0.0
  - @windrun-huaiin/shared-assets@3.3.0

## 4.0.0

### Major Changes

- React version shoud be fixed at 「19.2.0-canary-3fbfb9ba-20250409」, WTF!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@4.0.0
  - @windrun-huaiin/third-ui@4.0.0
  - @windrun-huaiin/lib@4.0.0
  - @windrun-huaiin/shared-assets@3.3.0

## 3.3.0

### Minor Changes

- Repair bundle build config for reason: DO NOT PACK REACT!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@3.6.0
  - @windrun-huaiin/third-ui@3.4.0
  - @windrun-huaiin/lib@3.4.0
  - @windrun-huaiin/shared-assets@3.3.0

## 3.2.1

### Patch Changes

- Clean packages and republish
- Updated dependencies
  - @windrun-huaiin/base-ui@3.5.1
  - @windrun-huaiin/third-ui@3.3.1
  - @windrun-huaiin/lib@3.3.1
  - @windrun-huaiin/shared-assets@3.2.3

## 3.2.0

### Minor Changes

- refactor(clean): DELETE unuse!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@3.4.0
  - @windrun-huaiin/third-ui@3.3.0
  - @windrun-huaiin/lib@3.2.2
  - @windrun-huaiin/shared-assets@3.2.2

## 3.1.2

### Patch Changes

- Server components and client components separation
- Updated dependencies
  - @windrun-huaiin/base-ui@3.3.0
  - @windrun-huaiin/third-ui@3.3.0
  - @windrun-huaiin/lib@3.2.2
  - @windrun-huaiin/shared-assets@3.2.2

## 3.1.1

### Patch Changes

- Align the version of some packages to 3.2.2
  - Try to release new version to npm repo
- Updated dependencies
  - @windrun-huaiin/base-ui@3.2.4
  - @windrun-huaiin/third-ui@3.2.2
  - @windrun-huaiin/lib@3.2.2
  - @windrun-huaiin/shared-assets@3.2.2

## 3.1.0

### Minor Changes

- Align the version of all packages to 3.1.0
  - Release version 3.1.0

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@3.1.0
  - @windrun-huaiin/third-ui@3.2.0
  - @windrun-huaiin/lib@3.1.0
  - @windrun-huaiin/shared-assets@3.1.0

## 1.4.0

### Minor Changes

- Finish the build process for all packages.

  - The build process for all packages is now complete.
  - Turbo build:prod is now complete.
  - Environment variables are now correctly passed to the build process.
  - README.md is now updated.

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@1.4.0
  - @windrun-huaiin/third-ui@1.4.0
  - @windrun-huaiin/lib@1.4.0
  - @windrun-huaiin/shared-assets@1.4.0

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

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@1.3.0
  - @windrun-huaiin/third-ui@1.3.0
  - @windrun-huaiin/lib@1.3.0
  - @windrun-huaiin/shared-assets@1.3.0

## 1.2.0

### Major Changes

- feat: upgrade all packages to version 1.2.0

  - Align project base version

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@1.2.0
  - @windrun-huaiin/lib@1.0.0
  - @windrun-huaiin/third-ui@1.2.0

## 0.2.0

### Minor Changes

- feat: upgrade all packages to version 1.2.0

  - Refactor ddaas from single-project to monorepo
  - Extract useful UI、Config、util、Script

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/base-ui@1.1.0
  - @windrun-huaiin/lib@0.2.0
  - @windrun-huaiin/third-ui@1.1.0
