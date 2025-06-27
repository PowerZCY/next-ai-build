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

## 包含的组件

### UI 组件 (ui/)
- Radix UI 基础组件的封装
- 统一的样式和主题
- 完整的 TypeScript 支持

### 基础组件 (components/)
- 404-page: 404 错误页面组件
- cta: Call-to-Action 组件
- features: 功能展示组件
- footer: 页脚组件
- gallery: 图片画廊组件
- global-icon: 全局图标管理
- go-to-top: 回到顶部按钮
- LanguageDetector: 语言检测组件
- LanguageSwitcher: 语言切换组件
- seo-content: SEO 内容组件
- tips: 提示组件

### 脚本组件 (script/)
- GoogleAnalyticsScript: Google Analytics 脚本
- MicrosoftClarityScript: Microsoft Clarity 脚本

## 使用示例

```tsx
import { Button, NotFoundPage, LanguageSwitcher } from '@windrun-huaiin/base-ui';

// 使用 UI 组件
<Button variant="default" size="lg">
  点击我
</Button>

// 使用基础组件
<NotFoundPage />

// 使用语言切换组件（需要传入配置）
<LanguageSwitcher 
  locales={['en', 'zh']}
  localeLabels={{ en: 'English', zh: '中文' }}
/>
```

## 依赖要求

- React 18+
- Next.js 15+
- TypeScript

## 开发

```bash
# 构建
pnpm build

# 开发模式
pnpm dev

# 类型检查
pnpm type-check
``` 