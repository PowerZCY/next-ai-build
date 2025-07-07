# @packages/dev-scripts

一个用于多语言项目的开发脚本工具集，支持翻译检查、翻译清理、博客索引生成等功能。

## 功能特性

- ✅ **翻译检查**: 检查翻译文件的完整性和一致性
- 🧹 **翻译清理**: 自动清理未使用的翻译键
- 📝 **博客索引生成**: 自动生成博客索引和月度统计
- ⚙️ **配置驱动**: 支持多种配置方式，适配不同项目结构
- 🔧 **CLI工具**: 统一的命令行接口，易于集成到构建流程

## 安装

```bash
# 在 monorepo 中使用
pnpm add -D @packages/dev-scripts

# 或在独立项目中使用
npm install -D @packages/dev-scripts
```

## 快速开始

### 1. 配置 package.json

在项目的 `package.json` 中添加配置：

```json
{
  "scripts": {
    "check-translations": "dev-scripts check-translations",
    "clean-translations": "dev-scripts clean-translations",
    "generate-blog-index": "dev-scripts generate-blog-index"
  },
  "devScripts": {
    "locales": ["en", "zh"],
    "defaultLocale": "en",
    "messageRoot": "messages",
    "scanDirs": ["src/**/*.{tsx,ts,jsx,js}"],
    "blogDir": "src/mdx/blog",
    "logDir": "logs"
  }
}
```

### 2. 运行命令

```bash
# 检查翻译完整性
pnpm check-translations

# 清理未使用的翻译键（仅显示）
pnpm clean-translations

# 实际删除未使用的翻译键
pnpm clean-translations --remove

# 生成博客索引
pnpm generate-blog-index
```

## 配置选项

### 通过 package.json 配置

在 `package.json` 中添加 `devScripts` 字段：

```json
{
  "devScripts": {
    "locales": ["en", "zh", "ja"],           // 支持的语言列表
    "defaultLocale": "en",                   // 默认语言
    "messageRoot": "messages",               // 翻译文件目录
    "scanDirs": [                           // 扫描的代码目录
      "src/**/*.{tsx,ts,jsx,js}"
    ],
    "blogDir": "src/mdx/blog",              // 博客MDX文件目录
    "logDir": "logs"                     // 日志输出目录
  },
  "architectureConfig": {
    ".": "RootProject"
  }
}
```

### 通过配置文件

创建 `dev-scripts.config.json`：

```json
{
  "i18n": {
    "locales": ["en", "zh"],
    "defaultLocale": "en",
    "messageRoot": "messages"
  },
  "scan": {
    "include": ["src/**/*.{tsx,ts,jsx,js}"],
    "exclude": ["src/**/*.test.ts", "src/**/*.d.ts"]
  },
  "blog": {
    "mdxDir": "src/mdx/blog",
    "outputFile": "index.mdx",
    "metaFile": "meta.json",
    "iocSlug": "ioc",
    "prefix": "blog"
  },
  "output": {
    "logDir": "logs",
    "verbose": false
  }
}
```

## 命令详解

### check-translations

检查翻译文件的完整性和一致性。

```bash
dev-scripts check-translations [options]

Options:
  -v, --verbose     显示详细日志
  --config <path>   指定配置文件路径
  -h, --help       显示帮助信息
```

**功能：**
- 扫描代码中使用的翻译键
- 检查翻译文件中是否存在对应的键
- 检查不同语言文件之间的一致性
- 生成详细的检查报告

**输出示例：**
```
=== 翻译检查报告 ===

✅ en 翻译文件中包含所有使用的命名空间
✅ zh 翻译文件中包含所有使用的命名空间

🔴 en 翻译文件中缺失的键:
  - common.newFeature
  - dashboard.analytics

✅ zh 翻译文件中包含所有使用的键
```

### clean-translations

清理未使用的翻译键。

```bash
dev-scripts clean-translations [options]

Options:
  -v, --verbose     显示详细日志
  --remove          实际删除未使用的键（默认只显示）
  --config <path>   指定配置文件路径
  -h, --help       显示帮助信息
```

**功能：**
- 找出翻译文件中未在代码中使用的键
- 支持安全预览模式（默认）
- 支持实际删除模式（--remove）
- 自动清理空的命名空间对象

### generate-blog-index

生成博客索引文件和月度统计。

```bash
dev-scripts generate-blog-index [options]

Options:
  -v, --verbose     显示详细日志
  --config <path>   指定配置文件路径
  -h, --help       显示帮助信息
```

**功能：**
- 扫描博客MDX文件
- 解析frontmatter元数据
- 生成主索引页面
- 生成月度统计页面
- 自动排序和分类

### deep-clean

一键清理 node_modules、.next、dist、.turbo、pnpm-lock.yaml 等依赖和缓存目录，自动适配 monorepo 或单工程结构。

```bash
dev-scripts deep-clean [options]

Options:
  --yes           实际删除匹配到的目录（默认只预览）
  -v, --verbose   显示详细日志
  --config <path> 指定配置文件路径
  -h, --help      显示帮助信息
```

**无需任何配置，脚本会自动识别工程类型：**
- 如果当前目录下有 `pnpm-workspace.yaml`，会按 monorepo 规则清理：
  - 根 node_modules
  - packages/*/node_modules
  - apps/*/node_modules
  - .next、dist、.turbo 及其子包下的同名目录
  - pnpm-lock.yaml
- 如果没有 `pnpm-workspace.yaml`，只清理：
  - node_modules
  - .next
  - pnpm-lock.yaml

**输出示例：**
```
==============================
当前工作目录: /your/project/path
==============================
【Root directory dependencies】
🗑️  [预览] /your/project/path/node_modules
...
如需实际删除，请加 --yes 参数。
```

实际删除时：
```
✅ 已删除: /your/project/path/node_modules
✅ 已删除: /your/project/path/pnpm-lock.yaml
...
✅ 共清理 3 个目录或文件。
```

## 支持的翻译模式

脚本支持多种翻译使用模式：

```typescript
// useTranslations hook
const t = useTranslations('common')
t('welcome')

// getTranslations (服务端)
const t = await getTranslations('common')
t('welcome')

// 带参数的getTranslations
const t = await getTranslations({ locale, namespace: 'common' })
t('welcome')

// FormattedMessage组件
<FormattedMessage id="welcome" />

// 模板字符串（动态键）
t(`tags.${tagName}`)

// 变量键
t(menuItem.key)
```

## 项目结构要求

### 翻译文件结构

```
messages/
├── en.json          # 英文翻译
├── zh.json          # 中文翻译
└── ja.json          # 日文翻译（可选）
```

翻译文件格式：
```json
{
  "common": {
    "welcome": "Welcome",
    "goodbye": "Goodbye"
  },
  "dashboard": {
    "title": "Dashboard",
    "analytics": {
      "title": "Analytics",
      "views": "Views"
    }
  }
}
```

### 博客文件结构

```
src/mdx/blog/
├── index.mdx        # 自动生成的索引文件
├── ioc.mdx         # 自动生成的月度统计
├── meta.json       # 特色文章配置
├── 2024-01-01.mdx  # 博客文章
├── 2024-01-15.mdx
└── ...
```

博客文章frontmatter格式：
```markdown
---
title: "文章标题"
description: "文章描述"
icon: "BookOpen"
date: "2024-01-01"
---

文章内容...
```

## 集成示例

### GitHub Actions

```yaml
name: Check Translations
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run check-translations
```

### Pre-commit Hook

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "dev-scripts check-translations"
    }
  }
}
```

## 故障排除

### 常见问题

1. **找不到翻译文件**
   - 检查 `messageRoot` 配置是否正确
   - 确保翻译文件存在且为有效JSON格式

2. **扫描不到代码文件**
   - 检查 `scanDirs` 配置是否包含正确的glob模式
   - 确保文件路径相对于项目根目录

3. **翻译键检测不准确**
   - 当前基于正则表达式匹配，对于复杂的动态键可能需要手动处理
   - 使用命名规范来帮助脚本识别（如 t1, t2 用于不同命名空间）

### 调试模式

使用 `--verbose` 选项获取详细日志：

```bash
dev-scripts check-translations --verbose
```

这将显示：
- 扫描的文件列表
- 找到的翻译函数映射
- 提取的翻译键
- 详细的检查过程

## 许可证

MIT License 