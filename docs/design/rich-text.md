# 富文本渲染与文案排版指南

面向翻译/内容/开发团队的富文本处理规范，基于 `@packages/third-ui/src/main/rich-text-expert.tsx` 沉淀。用于统一 SEO 内容、FAQ、Feature、Tips 等组件的文本样式与移动端兼容性。

---

## 1. 富文本渲染器支持的样式

### 当前实现

`rich-text-expert.tsx` 提供以下 HTML 标签的渲染器，可直接在翻译 JSON 中使用：

| 标签 | 用途 | Tailwind 类 | 示例 |
|------|------|-----------|------|
| `<strong>` | **强调文本**（加粗） | `font-bold` | `<strong>重要</strong>` |
| `<em>` | *强调文本*（斜体） | `italic` | `<em>关键字</em>` |
| `<u>` | <u>下划线文本</u> | `underline` | `<u>标记</u>` |
| `<mark>` | <mark>高亮文本</mark> | `bg-purple-300 dark:bg-purple-500 px-1 rounded` | `<mark>重点内容</mark>` |
| `<del>` | ~~删除线~~ | `line-through` | `<del>废弃功能</del>` |
| `<sub>` | 下标（化学式） | `text-xs` | H<sub>2</sub>O |
| `<sup>` | 上标（数学式、版本号） | `text-xs` | X<sup>2</sup>、v<sup>2.0</sup> |

### 渲染器实现位置

```typescript
// @packages/third-ui/src/main/rich-text-expert.tsx

const defaultTagRenderers = {
  strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
  em: (chunks: React.ReactNode) => <em>{chunks}</em>,
  u: (chunks: React.ReactNode) => <u>{chunks}</u>,
  mark: (chunks: React.ReactNode) => <mark className="bg-purple-300 dark:bg-purple-500 text-neutral-800 dark:text-neutral-300 px-1 rounded">{chunks}</mark>,
  del: (chunks: React.ReactNode) => <del>{chunks}</del>,
  sub: (chunks: React.ReactNode) => <sub>{chunks}</sub>,
  sup: (chunks: React.ReactNode) => <sup>{chunks}</sup>,
};
```

### 使用示例

在 `apps/ddaas/messages/en.json` 中的翻译文本：

```json
{
  "seoContent": {
    "intro": "Reve Image represents the <strong>cutting edge</strong> of AI image generation technology, offering users the ability to transform <em>text descriptions</em> into stunning visual content.",
    "sections": [
      {
        "title": "Understanding How Reve Image Works",
        "content": "When you enter a prompt, <strong><u>Reve Image</u></strong> analyzes the semantic meaning and generates corresponding imagery that matches your description."
      }
    ]
  }
}
```

### 标签组合规则

支持**多标签嵌套**，如：
- `<strong><em>Very important</em></strong>` → **_Very important_**
- `<strong><mark>Highlighted and bold</mark></strong>` → **<mark>Highlighted and bold</mark>**
- `<em><u>Emphasized and underlined</u></em>` → _<u>Emphasized and underlined</u>_

---

## 2. 移动端兼容性问题与排版陷阱

### 常见导致断行失效的符号

在翻译文本中使用以下符号或模式时，**务必特别关注移动端显示**，因为 CSS 的 `word-break` 规则无法在这些位置自动断行，导致内容撑爆容器宽度。

#### 2.1 斜杠分隔符 `/`（最常见）

```
Users/Subscriptions/Credits/Transactions/CreditAuditLog
```

**问题**：整段被视为一个"单词"，无法在斜杠处断行。

**检测场景**：
- 数据库字段名或表名列表
- API 路由路径
- 技术术语组合

**解决方案**（按优先级）：
1. **在翻译中手动调整**：改用其他格式或拆分成多行
   ```json
   "content": "Indexed fields: Users, Subscriptions, Credits, Transactions, CreditAuditLog"
   ```

2. **使用 `<wbr/>` 标签**（仅在必须保留原格式时）：
   ```json
   "content": "Users/<wbr/>Subscriptions/<wbr/>Credits/<wbr/>Transactions/<wbr/>CreditAuditLog"
   ```

3. **后续可在渲染器中添加自动处理**（见下方扩展方案）

#### 2.2 下划线分隔符 `_`

```
user_subscription_credits_transaction_audit_log
```

**问题**：同斜杠，下划线连接的字符串无法在下划线处自动断行。

**常见场景**：
- 数据库列名（Snake_case）
- 环境变量名
- 代码中的常量名

**解决方案**：同 2.1，优先调整文案或使用 `<wbr/>`。

#### 2.3 驼峰命名法 `camelCase` / `PascalCase`（无断行机制）

```
getUserSubscriptionCreditsTransactionsAuditLog
getUserSubscriptionCreditsTransactionsAuditLog
```

**问题**：完全无分隔符，最容易撑爆宽度。

**解决方案**：
- 避免在用户可见的翻译文本中直接使用
- 若必须使用（如展示类名），用 `<code>` 标签包裹并提供代码容器滚动支持

#### 2.4 点号分隔符 `.`（域名、版本号、模块路径）

```
example.com.subdomain.very.long.domain.name
package.module.submodule.function.name
v1.2.3.4.5
```

**问题**：通常在点号处会有断行，但超长序列仍可能导致溢出。

**解决方案**：一般安全，但 8+ 个点的超长序列需要测试。

#### 2.5 URL 与路径（特殊场景）

```
https://example.com/very/long/path/to/resource?param=value&other=value
/path/to/very/long/file/structure/with/many/segments
```

**问题**：通常不是主要问题，但极长 URL 仍需关注。

**解决方案**：
- 使用 CSS `word-break: break-all` 或 `overflow-x: auto`
- 在翻译中缩短 URL 或使用链接文案替代

#### 2.6 纯长单词或字母序列（任何语言）

```
verylongwordwithoutanybreakpointsatallwhatsover
aaaaaabbbbbbccccccddddddeeeeeeffffffffggggggg
```

**问题**：完全无法断行。

**解决方案**：
- 在翻译阶段避免或重组表述
- 对于生成内容（如用户输入），在组件级别添加 `word-break: break-all`

---

## 3. 移动端适配规范

### 3.1 文案审查清单

翻译或编写内容时，遵循以下检查项：

- [ ] **避免连续无分隔符字符串** 超过 20 个字符
- [ ] **斜杠/下划线分隔的字符串** 每段不超过 30 个字符（含分隔符）
- [ ] **技术术语列表** 优先拆分为独立句或使用项目符号
- [ ] **版本号、域名、路径** 需在小屏（375px）模拟测试
- [ ] **特殊符号组合** 若出现上述陷阱符号，需加注 `<!-- mobile-test -->` 标记供开发复查

### 3.2 翻译模板指导

当翻译涉及技术名词或标识符时，建议在翻译注释中备注：

```json
{
  "seoContent": {
    "sections": [
      {
        "title": "Schema-first reliability",
        "content": "Indexed for fingerprint lookup, order routing, and audit stability. // 注：移动端请勿直接显示原始数据库字段列表，如需展示请使用项目符号"
      }
    ]
  }
}
```

### 3.3 容器级别的样式保障

所有使用富文本的组件（`seo-content.tsx`、`tips.tsx`、`usage.tsx` 等）应在内容容器上添加：

```jsx
// 防止内容超宽
<div className="bg-gray-50 dark:bg-gray-800/60 ... overflow-hidden">
  <p className="... wrap-break-words">{data.intro}</p>
</div>
```

其中：
- `overflow-hidden`：截断超出的内容，防止横向滚动条
- `wrap-break-words`：Tailwind 自定义类，映射到 `word-break: break-word`

---

## 4. 扩展与后续改进

### 4.1 若需添加新的样式标签

直接修改 `rich-text-expert.tsx` 中的 `defaultTagRenderers`：

```typescript
const defaultTagRenderers = {
  // 现有标签...

  // 新增：代码块
  code: (chunks: React.ReactNode) => (
    <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-sm">
      {chunks}
    </code>
  ),

  // 新增：链接（若需要）
  a: (chunks: React.ReactNode, href: string) => (
    <a href={href} className="text-purple-500 underline hover:text-purple-600">
      {chunks}
    </a>
  ),
};
```

### 4.2 自动处理断行的富文本处理器（未来可选）

若项目后续频繁需要处理斜杠/下划线分隔的字符串，可考虑在渲染器中添加预处理：

```typescript
// 伪代码：自动在 / 和 _ 后插入 <wbr/> 的处理函数
function autoBreakWords(text: string): React.ReactNode {
  return text
    .split(/(?<=\/)|(?<=_)/)
    .map((segment, idx) => (
      <React.Fragment key={idx}>
        {segment}
        {/[/_]$/.test(segment) && <wbr />}
      </React.Fragment>
    ));
}
```

但此方案需与 `i18n` 库的富文本解析配合，目前不建议贸然实施。

---

## 5. 常见问题与排查

### Q: 为什么同一段文本在桌面显示正常，移动端就超宽了？

**A**: 可能原因：
1. 文本中包含上述 2.1–2.6 中的断行陷阱符号
2. 内容容器缺少 `overflow-hidden` 或 `wrap-break-words`
3. 富文本标签（`<strong>` 等）阻断了断行

**排查步骤**：
1. 用移动设备（或浏览器开发者工具 375px 视口）测试
2. 查看是否有红色横向溢出指示（检查元素）
3. 检查溢出的具体文本片段，确认是否包含陷阱符号
4. 若是，优先在翻译中调整，其次考虑渲染器扩展

### Q: 我能直接在 JSON 翻译中使用 `<br/>` 标签吗？

**A**: 可以，但不推荐。`<br/>` 会硬性断行，响应式设计中会导致布局不适。优先使用 `<wbr/>` 或调整文案。

### Q: 为什么 `<code>` 标签不在支持列表中？

**A**: 当前渲染器还未实现 `<code>` 标签。若需要，提交需求到开发团队，修改 `rich-text-expert.tsx` 即可。

---

## 参考链接

- **项目文件**：`@packages/third-ui/src/main/rich-text-expert.tsx`
- **使用示例**：`apps/ddaas/messages/en.json` 中的 `seoContent` / `tips` / `faq`
- **相关组件**：`seo-content.tsx`、`tips.tsx`、`usage.tsx`、`features.tsx`、`cta.tsx`、`faq.tsx`
- **设计指南**：`docs/design/UI.md`（移动端响应式布局）

---

> **最后提醒**：任何涉及技术术语、标识符、长字符串的文案，务必在移动设备上（或 375px 视口模拟）验证显示效果，确保无横向滚动条。
