# @windrun-huaiin/lib

通用工具库，包含配置、工具函数、图标和 LLM 相关功能。

## 安装

```bash
pnpm add @windrun-huaiin/lib
```

## 使用

### 配置

```typescript
import { appConfig, iconColor, getValidLocale } from '@windrun-huaiin/lib/config';

// 使用应用配置
console.log(appConfig.baseUrl);

// 获取有效的语言设置
const locale = getValidLocale('zh');
```

### 工具函数

```typescript
import { cn, formatTimestamp } from '@windrun-huaiin/lib/utils';

// 合并 CSS 类名
const className = cn('text-red-500', 'font-bold');

// 格式化时间戳
const formatted = formatTimestamp('1640995200000', 'yyyy-MM-dd HH:mm:ss');
```

### 图标

```typescript
import { Search, Check, X } from '@windrun-huaiin/lib/icons';

// 在 React 组件中使用
function MyComponent() {
  return (
    <div>
      <Search className="w-4 h-4" />
      <Check className="w-4 h-4 text-green-500" />
      <X className="w-4 h-4 text-red-500" />
    </div>
  );
}
```

### LLM 功能

```typescript
import { getLLMText } from '@windrun-huaiin/lib/llm';

// 处理 MDX 内容
const result = await getLLMText(mdxContent, 'Title', 'Description');
```

## 构建

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck
```

## 发布

```bash
pnpm publish
``` 