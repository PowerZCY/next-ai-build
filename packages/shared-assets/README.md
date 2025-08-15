# @windrun-huaiin/shared-assets

> 🚀 一键管理 monorepo 中的共享静态资源

轻松在多个应用间共享图标、图片等静态资源，自动复制，类型安全，零配置。

## ⚡ 快速上手

### 📁 存放共享资源

将你的共享资源放到这里：

```
packages/shared-assets/public/
├── icons/
│   ├── logo.svg           # ← 把共享图标放这里
│   └── menu.svg
└── images/
    ├── banner.jpg         # ← 把共享图片放这里  
    └── avatar-default.png
```

### 🔧 两种构建方式

**🌟 方式一：构建所有应用（推荐）**
```bash
# 在项目根目录执行
pnpm build
```

**⚡ 方式二：只构建单个应用**
```bash
# 在项目根目录执行，指定应用
pnpm --filter ddaas build
pnpm --filter formato build
```

**就这么简单！** 🎉 共享资源会自动复制到 `apps/*/public/shared/` 目录。

## 💡 在应用中使用

### 方式一：直接路径引用（推荐）
```jsx
// 在 React 组件中
<img src="/shared/icons/logo.svg" alt="Logo" />

// 在 CSS 中  
background-image: url('/shared/images/banner.jpg');
```

### 方式二：类型安全的路径（可选）
```typescript
import { SharedAssetPaths } from '@windrun-huaiin/shared-assets/paths';

// TypeScript 智能提示
<img src={SharedAssetPaths.icons.logo} alt="Logo" />
```

> 💡 **小贴士**：新增资源后记得更新 `src/paths.ts` 以获得 TypeScript 支持。

## 🎯 常用场景

### 📦 日常开发
```bash
# 启动开发环境（自动监听资源变化）
pnpm dev

# 构建所有应用发布
pnpm build
```

### ⚡ 只开发特定应用
```bash
# 只构建 ddaas 应用（节省时间）
pnpm --filter ddaas build

# 只构建 formato 应用
pnpm --filter formato build
```

### 🔄 手动复制资源（极少使用）
```bash
# 全量复制
pnpm --filter=@windrun-huaiin/shared-assets copy-shared-assets

# 指定单个应用
TARGET_APP=ddaas pnpm --filter=@windrun-huaiin/shared-assets copy-shared-assets
```

> 💡 **建议**：99% 的情况下只需要用 `pnpm build` 和 `pnpm dev`，其他命令了解即可。

## 📋 复制效果

构建后，共享资源会自动出现在各应用中：

```
apps/ddaas/public/shared/     # ← 自动复制到这里
├── icons/logo.svg
├── icons/menu.svg
├── images/banner.jpg
└── images/avatar-default.png

apps/formato/public/shared/   # ← 同样复制到这里（如果有 package.json）
├── icons/logo.svg
├── icons/menu.svg  
├── images/banner.jpg
└── images/avatar-default.png
```

## 🔧 工作原理

### 📱 应用发现规则
系统会自动扫描 `apps/*` 目录，并根据以下规则确定目标应用：

```typescript
// 发现有效应用的条件：
1. 位于 apps/ 目录下
2. 包含 package.json 文件
3. 是一个有效的 Node.js 项目
```

**示例**：
```
apps/
├── ddaas/               # ✅ 有 package.json → 会复制
│   └── package.json
├── formato/             # ❌ 空目录 → 跳过
└── admin/               # ✅ 有 package.json → 会复制  
    └── package.json
```

### ⚡ 智能缓存机制
使用 Turborepo 的智能缓存，大幅提升构建速度：

**首次构建（cache miss）**：
```bash
🕒 当前时间: 14:30:25
🚀 开始复制共享静态资源...    # ← 真正执行复制
✅ 复制到 apps/ddaas/public/shared
```

**后续构建（cache hit）**：
```bash
cache hit, replaying logs
🚀 开始复制共享静态资源...    # ← 只是回放日志
✅ 复制到 apps/ddaas/public/shared  # ← 从缓存瞬间恢复文件
```

> 💡 **智能之处**：只有共享资源真正变化时才重新复制，否则直接使用缓存结果。

## 💡 最佳实践

### ✅ 适合共享的资源
- 🎨 品牌 Logo 和图标
- 🔧 公共 UI 图标  
- 👤 默认头像、占位图
- 🎯 错误页面图片
- 🎨 品牌素材

### ❌ 不适合共享的资源
- 📱 应用特有的业务图片
- 📤 用户上传的内容
- 🎬 大型媒体文件（建议用 CDN）

### ⚠️ 重要禁忌

**🚫 不要手动修改 `shared` 目录！**
```bash
# ❌ 永远不要这样做：
apps/ddaas/public/shared/    # ← 这个目录完全由系统管理
├── custom.png              # ❌ 手动添加会被清空
└── modified-logo.svg       # ❌ 手动修改会丢失
```

**✅ 正确的做法**：
```bash
# ✅ 所有共享资源都放在这里：
packages/shared-assets/public/
├── icons/custom.svg        # ✅ 添加到这里
└── images/logo.svg         # ✅ 修改这里的文件
```

> 🔴 **原因**：每次构建时，`apps/*/public/shared/` 目录会被完全清空后重新复制，手动修改会丢失！

### 🔧 文件管理建议
- **按类型分目录**：`icons/`、`images/`、`branding/`
- **命名规范**：使用 `kebab-case.svg`
- **及时更新**：新增文件后更新 `src/paths.ts`

## 🚀 部署说明

**零配置部署！** 构建后的应用已包含所有共享资源，可直接部署到：
- ✅ Vercel  
- ✅ Cloudflare Pages
- ✅ Netlify
- ✅ 任何静态托管平台

---

> 🎉 **就是这么简单！** 专注于添加资源和使用，其他的交给我们处理。 



## Showcase

- [Free Trivia Game](https://freetrivia.info/)
- [Music Poster](https://musicposter.org/en)
- [Image Narration](https://imagenarration.com/en)
- [Describe Yourself](https://describeyourself.org/en)
- [Newspaper Template](https://newspaper-template.org/en)
- [breathing exercise](https://breathingexercise.net/en)
- [ai directory list](https://aidirectorylist.com/en)
- [reve image directory](https://reveimage.directory/en)