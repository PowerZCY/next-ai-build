# @windrun-huaiin/base-ui

基础 UI 组件库，包含所有可复用的 UI 组件和基础组件。

## 安装

```bash
pnpm add @windrun-huaiin/base-ui
```

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