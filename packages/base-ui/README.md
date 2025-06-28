# Base UI Components

A comprehensive set of UI components built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Built-in Icon System**: 28 commonly used icons are built-in as React components
- **TypeScript Support**: Full type safety and IntelliSense
- **Tailwind CSS**: Utility-first CSS framework integration
- **Radix UI**: Accessible and unstyled UI primitives
- **Tree Shaking**: Only import what you need

## 📦 Installation

```bash
pnpm add @windrun-huaiin/base-ui
```

## TailwindCSS 4.x Config

- Assume you have a project structure like this:

```txt
Your-project/
├── src/
│   └── app/
│       └── globals.css
├── node_modules/
│   ├── @windrun-huaiin/
│   │   ├── third-ui/
│   │   │   └── src/        # This is third-ui src
│   │   └── base-ui/
│   │       └── src/        # This is base-ui src
└── package.json
```

- Then, in your `globals.css` file, you have to configure Tailwind CSS 4.x like this:

```css
@import 'tailwindcss';

@source "../node_modules/@windrun-huaiin/third-ui/src/**/*.{js,ts,jsx,tsx}";
@source "../node_modules/@windrun-huaiin/base-ui/src/**/*.{js,ts,jsx,tsx}";
@source "./src/**/*.{js,ts,jsx,tsx}";

/* Import styles */
@import '@windrun-huaiin/third-ui/styles/base-ui.css';
```

## 🎨 Built-in Icons

This package includes 28 built-in icons as React components. All icons are accessible through the `globalLucideIcons` object.

### Available Icons

**Development Tools:**
- GitHub, D8, Clerk, Iterm

**File Types:** 
- Markdown, MDX, Html, Json, XML, Yaml, CSV, Txt, Java, SQL, Log

**Technologies:**
- MAC, BTC, CSS, Mermaid

**Documentation:**
- LastUpdated, Snippets, Test, Diff

**Business/Legal:**
- DPA, SubP, T3P

**Network:**
- Http, Scheme

## Usage

### 1. Direct Icon Usage
```tsx
import { globalLucideIcons } from '@windrun-huaiin/base-ui';

// Use any built-in icon
<globalLucideIcons.GitHub className="h-6 w-6" />
<globalLucideIcons.BTC className="h-4 w-4" />
<globalLucideIcons.Mmd className="h-4 w-4" /> // Auto 16x16 size for Mermaid
```

### 2. Dynamic Icon Loading
```tsx
import { getGlobalIcon } from '@windrun-huaiin/base-ui';

// Get icon component
const GitHubIcon = getGlobalIcon('GitHub');
<GitHubIcon className="h-6 w-6" />

// Get icon element (for fumadocs)
const iconElement = getGlobalIcon('GitHub', true);
```

### 3. Utility Components
```tsx
import { SiteIcon, NotFoundIcon } from '@windrun-huaiin/base-ui';

// Pre-configured site icon
<SiteIcon />

// Pre-configured 404 icon  
<NotFoundIcon />
```

## Benefits

- ✅ **Zero Configuration**: No need to copy SVG files to your project
- ✅ **Self-contained**: All icons are bundled as React components
- ✅ **Consistent Styling**: Global icon color configuration
- ✅ **Type Safety**: Full TypeScript support with auto-completion
- ✅ **Performance**: No network requests for icon files
- ✅ **Special Sizing**: Mermaid icon has optimized 16x16 default size

## Environment Variables

```bash
# Optional: Set global icon color (defaults to text-purple-500)
NEXT_PUBLIC_STYLE_ICON_COLOR=text-blue-600
```

## License

MIT

## Included Components

### UI Components (ui/)
- Radix UI base components
- Unified styles and themes
- Full TypeScript support

### Base Components (components/)
- 404-page: 404 error page component
- cta: Call-to-Action component
- features: Feature showcase component
- footer: Footer component
- gallery: Image gallery component
- global-icon: Global icon management
- go-to-top: Go to top button
- LanguageDetector: Language detection component
- LanguageSwitcher: Language switcher component
- seo-content: SEO content component
- tips: Tip component

### Script Components (script/)
- GoogleAnalyticsScript: Google Analytics script
- MicrosoftClarityScript: Microsoft Clarity script

## Usage Example

```tsx
import { Button, NotFoundPage, LanguageSwitcher } from '@windrun-huaiin/base-ui';

// Use UI components
<Button variant="default" size="lg">
  Click me
</Button>

// Use base components
<NotFoundPage />

// Use language switcher component (need to pass in configuration)
<LanguageSwitcher 
  locales={['en', 'zh']}
  localeLabels={{ en: 'English', zh: '中文' }}
/>
```

## Dependencies

- React 18+
- Next.js 15+
- TypeScript

## Development

```bash
# Build
pnpm build

# Development mode
pnpm dev

# Type check
pnpm type-check
``` 