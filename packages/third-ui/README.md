# @windrun-huaiin/third-ui

第三方集成 UI 组件库，包含 Clerk 认证、Fumadocs 文档和主要应用组件。

## 安装

```bash
pnpm add @windrun-huaiin/third-ui
```

## 包含的组件

### Clerk 认证组件 (clerk/)
- `ClerkOrganization`: 组织切换器组件
- `ClerkProviderClient`: Clerk 提供者客户端组件
- `ClerkUser`: 用户按钮和认证组件

### 主要应用组件 (main/)
- `cta`: Call-to-Action 组件
- `features`: 功能展示组件  
- `footer`: 页脚组件
- `gallery`: 图片画廊组件
- `go-to-top`: 回到顶部按钮
- `seo-content`: SEO 内容组件
- `tips`: 提示组件

### Fumadocs 文档组件 (fuma/)
- `fuma-banner-suit`: Fumadocs 横幅套件
- `mdx-components`: MDX 组件
- `toc-base`: 目录基础组件
- `toc`: 目录组件

## 使用示例

### 导入所有组件
```tsx
import { ClerkUser, CTA, TOC } from '@windrun-huaiin/third-ui';
```

### 按模块导入
```tsx
// 只导入 Clerk 相关组件
import { ClerkUser, ClerkOrganization } from '@windrun-huaiin/third-ui/clerk';

// 只导入主要应用组件
import { CTA, Features } from '@windrun-huaiin/third-ui/main';

// 只导入 Fumadocs 组件  
import { TOC, FumaBannerSuit } from '@windrun-huaiin/third-ui/fuma';
```

### 使用组件
```tsx
// Clerk 用户组件（需要传入翻译和配置）
<ClerkUser 
  locale="zh"
  clerkAuthInModal={true}
  t={{ signIn: "登录" }}
  t2={{ terms: "服务条款", privacy: "隐私政策" }}
/>

// Clerk 组织组件
<ClerkOrganization locale="zh" className="custom-class" />

// 主要应用组件
<CTA />
<Features />
```

## 设计理念

1. **模块化**：按功能域分组，支持按需导入
2. **参数化**：去除硬编码依赖，通过 props 传递配置
3. **类型安全**：完整的 TypeScript 支持
4. **路径别名**：内部使用 `@/` 别名，保持代码整洁

## 依赖关系

- `@windrun-huaiin/base-ui`: 基础 UI 组件
- `@windrun-huaiin/lib`: 通用工具库
- `@clerk/nextjs`: Clerk 认证
- `fumadocs-core`, `fumadocs-ui`: Fumadocs 文档

## 注意事项

- 组件已经去除了直接的 `appConfig` 依赖，需要通过 props 传递配置
- Clerk 组件需要在应用层提供正确的翻译文本
- 某些组件可能需要特定的 CSS 动画类（如 `animate-cta-gradient-wave`） 

# Third UI Components

这个包提供了第三方集成的 UI 组件，包括 Clerk 认证、Fumadocs 文档和通用页面组件。

## 安装

```bash
npm install @windrun-huaiin/third-ui
```

## 使用

### Clerk 组件

```tsx
import { ClerkProviderClient, ClerkUser } from '@windrun-huaiin/third-ui/clerk';

// 在 layout.tsx 中使用
<ClerkProviderClient 
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  waitlistUrl="/waitlist"
>
  {children}
</ClerkProviderClient>

// 在导航栏中使用
<ClerkUser clerkAuthInModal={true} />
```

### Main 组件

```tsx
import { CTA, Features, Footer } from '@windrun-huaiin/third-ui/main';

// 使用各种页面组件
<Features />
<CTA />
<Footer />
```

### Fumadocs 组件

```tsx
import { createMDXComponents, TocFooter } from '@windrun-huaiin/third-ui/fuma';

// 创建预配置的 MDX 组件
const getMDXComponents = createMDXComponents({
  watermark: {
    enabled: true,
    text: "Your Watermark"
  },
  githubBaseUrl: "https://github.com/your-org/your-repo/edit/main/"
});

// 在页面中使用
const MDX = page.data.body;
<MDX components={getMDXComponents()} />

// 使用 TocFooter
<TocFooter 
  lastModified={page.data.date}
  showCopy={true}
  editPath="src/docs/your-file.mdx"
  githubBaseUrl="https://github.com/your-org/your-repo/edit/main/"
/>
```

#### MDX 组件全局配置

使用 `createMDXComponents` 工厂函数可以避免在每个 MDX 文件中重复传递配置参数：

```tsx
// 创建预配置的组件函数
const getMDXComponents = createMDXComponents({
  watermark: {
    enabled: process.env.NEXT_PUBLIC_WATERMARK_ENABLED === 'true',
    text: process.env.NEXT_PUBLIC_WATERMARK_TEXT || "Default Watermark"
  },
  cdnBaseUrl: "https://cdn.example.com",
  placeHolderImage: "/default-placeholder.webp"
});

// 现在在 MDX 文件中使用组件时，配置会自动应用
// - Mermaid: 水印会自动应用
// - ImageGrid: CDN 基础URL会自动应用
// - ImageZoom: 占位图片会自动应用
```

在 MDX 文件中：

```mdx
<!-- Mermaid 图表，水印自动应用 -->
<Mermaid
  chart="graph TD; A-->B"
  title="My Diagram"
/>

<!-- 图片网格，CDN URL 自动应用 -->
<ImageGrid
  type="url"
  images={["image1.webp", "image2.webp"]}
  altPrefix="example"
/>

<!-- 图片缩放，占位图片自动应用 -->
<ImageZoom src="/some-image.jpg" alt="Example" />
```

所有配置参数会自动从全局配置中获取，无需在每个使用处重复指定。

## 组件列表

### Clerk 模块
- `ClerkProviderClient` - Clerk 认证提供者
- `ClerkUser` - 用户按钮组件  
- `ClerkOrganization` - 组织切换器

### Main 模块
- `CTA` - 行动召唤组件
- `Features` - 功能特性展示
- `Footer` - 页脚组件
- `Gallery` - 图片画廊
- `GoToTop` - 返回顶部按钮
- `SEOContent` - SEO 内容组件
- `Tips` - 提示组件

### Fuma 模块
- `getMDXComponents` - MDX 组件配置函数
- `createMDXComponents` - MDX 组件工厂函数
- `TocFooter` - 目录页脚组件
- `FumaBannerSuit` - Fumadocs 横幅组件

### Fuma MDX 子模块
- `Mermaid` - 流程图组件
- `ImageZoom` - 图片缩放组件
- `TrophyCard` - 奖杯卡片组件
- `ImageGrid` - 图片网格组件
- `ZiaCard` - Zia 卡片组件
- `GradientButton` - 渐变按钮组件 