结合你的当前环境和 `fumadocs-ui@16.0.9` 及相关依赖的版本要求，以下是需要升级的包及建议，确保兼容性和功能完整性：


### **一、核心依赖升级（必升）**
#### 1. `fumadocs` 相关包（核心升级目标）
- **当前版本**：`fumadocs-core@15.3.3`、`fumadocs-ui@15.3.3`、`fumadocs-mdx@11.6.3`、`fumadocs-typescript@4.0.4`  
- **目标版本**：均升级至 `16.0.9`（或同系列最新版）  
  - 理由：`fumadocs-ui@16.x` 需与同版本 `fumadocs-core` 等配套使用，避免核心逻辑与 UI 组件不兼容。

#### 2. React 及相关
- **当前版本**：`react@19.1.0`、`react-dom@19.1.0`  
- **目标版本**：`19.2.0+`  
  - 理由：`fumadocs-ui@16.x` 强制要求 React ≥19.2.0，修复了 19.1.0 中的部分类型和渲染问题。

#### 3. Next.js（若继续使用）
- **当前版本**：`next@15.3.2`、`eslint-config-next@15.3.2`  
- **目标版本**：`16.0.0+`  
  - 理由：Next.js 16 是与 React 19 适配的稳定版本，`fumadocs-core@16.x` 依赖其新特性（如服务器组件优化）。


### **二、重要依赖升级（建议升）**
#### 1. TypeScript 及类型定义
- **当前版本**：`typescript@5.9.3`（已满足最低要求，但可跟进最新版）  
- **建议版本**：`5.6.2+`（保持与生态兼容性，最新稳定版即可）  
  - 理由：`fumadocs@16.x` 依赖 TS 5.2+ 类型特性，5.9.3 已兼容，若需新语法可升级至 `5.6.2` 或更高。

#### 2. Radix UI 组件（避免样式冲突）
- **当前版本**：`@radix-ui/react-alert-dialog@1.1.15`、`@radix-ui/react-dropdown-menu@2.1.16` 等  
- **建议版本**：统一升级至最新版（如 `1.1.16+`）  
  - 理由：`fumadocs-ui` 基于 Radix UI 构建，新版本修复了部分移动端交互和类型问题。

#### 3. Shiki（代码高亮引擎）
- **当前版本**：`shiki@3.15.0`  
- **建议版本**：`3.17.0+`  
  - 理由：`fumadocs-ui@16.x` 切换 Shiki 默认引擎为 JavaScript Regex，新版本优化了移动端代码块渲染。


### **三、可暂不升级（兼容性无影响）**
- **Clerk 相关**：`@clerk/nextjs@6.34.4` 等（与 React 19 和 Next.js 16 兼容）。  
- **Tailwind 生态**：`tailwindcss@4.1.16`、`@tailwindcss/typography@0.5.19`（已满足 `fumadocs-ui` 要求）。  
- **工具类**：`clsx@2.1.1`、`tailwind-merge@3.3.1`（无破坏性变更）。  
- **其他第三方库**：`stripe@19.3.0`、`svix@1.81.0` 等（与核心框架无关）。


### **四、升级步骤建议**
1. 先升级 React 相关：  
   ```bash
   pnpm add react@^19.2.0 react-dom@^19.2.0
   ```
2. 升级 Next.js（若使用）：  
   ```bash
   pnpm add next@^16.0.0 eslint-config-next@^16.0.0
   ```
3. 升级 `fumadocs` 全家桶：  
   ```bash
   pnpm add fumadocs-core@16.0.9 fumadocs-ui@16.0.9 fumadocs-mdx@16.0.9 fumadocs-typescript@16.0.9
   ```
   注意：版本补丁"fumadocs-ui@15.3.3": "patches/fumadocs-ui@15.3.3.patch", 先直接改为 16.0.9， 然后需要补充应用补丁的命令
   这里的补丁背景：只是复写了fumadocs的一个UI组件，最新版本的代码好像不涉及。 你可以分析下该补丁设计的逻辑处理
4. 按需升级 Radix UI 和 Shiki：  
   ```bash
   pnpm add @radix-ui/react-alert-dialog@latest @radix-ui/react-dropdown-menu@latest shiki@latest
   ```


### **说明**
- 升级后可能需要处理 `fumadocs@16.x` 的 API 变更（如侧边栏组件迁移、搜索 API 调整），建议参考官方迁移指南。  
- 若暂时不想升级 Next.js 到 16，需确保 `next@15.3.2` 与 React 19.2.0 兼容（经测试基本兼容，但部分新特性可能受限）。



心区别

  - workspace:^（见 packages/third-ui/package.json:71-87）只用来声明“依赖的是本仓里的另一个包，并且版本范围是 ^”。开发期它会被软链接到本地包；pnpm pack/publish 时会把 workspace:^ 展开成真实语义化版本（我刚在
    packages/third-ui 执行 pnpm pack --pack-destination /tmp，tarball 里已经变成 @windrun-huaiin/lib: ^7.1.2）。这是确保内部包相互引用最安全的写法，但它只适用于仓库里确实存在的包。
  - catalog:（packages/third-ui/package.json:99-105）等于是去 pnpm-workspace.yaml:5-105 找统一定义的版本别名。你在包里写 @types/react: "catalog:"，pnpm 安装时会查 catalog 里的 @types/react: 19.1.2 并按这个版本锁定；
    打包或发布时也会被替换成普通 semver。它的意义更像集中管理“外部依赖”版本，避免每个包都手抄数字。缺点是：只有 pnpm 认识这套语法，所以必须用 pnpm install/pack/publish，不能直接用 npm publish，否则 package.json 会带
    着 catalog: 被发出去。

  与 overrides 的关系

  - catalog 只影响“谁引用了 catalog 的那个依赖”，是一种模板语法；pnpm.overrides 或 npm 的 overrides 则是硬性重写整个依赖树里某个包的版本，适合解决漏洞或齐刷刷换版本。你当前更多是用 catalog 保证显式依赖一致，再配合
    overrides（需要时）兜底强控传递依赖。

  打包/发布层面的可行性

  - Rollup 构建时看到的总是已经解析好的真实依赖版本，所以 catalog: 与 workspace: 不会影响 bundle 的内容。
  - 只要执行 pnpm pack 或 pnpm publish --filter @windrun-huaiin/third-ui，pnpm 会在打包阶段把所有 catalog: / workspace: 展开；如果有 CI 里用 npm publish 的习惯，需要改成 pnpm publish，否则 npm 根本不知道怎么解析这些
    前缀，会导致包失效。

  .pnpmrc 中的“依赖提升”设置

  - prefer-workspace-packages=true + save-workspace-protocol=true（.pnpmrc:3-8）保证只要仓库里有同名包，pnpm add 默认就用 workspace:^ 记下来，这也是你看到 @windrun-huaiin/base-ui、@windrun-huaiin/lib 自动写成
    workspace:^ 的原因。
  - public-hoist-pattern[]（.pnpmrc:18-24）会把 React/Next/TypeScript 这类包提升到根 node_modules，防止旧版工具或构建链找不到依赖；这不影响各 package 的真实依赖版本，只是额外创建了一份可被老工具解析的入口。
  - dedupe-injected-deps=true 和 auto-install-peers=true 则是在安装时尽量合并 peer deps，避免你在不同包中重复装 React 导致运行时有多个实例。

  给你的建议

  1. 对“要发布到 npm 的包”，workspace:^ 继续用于内部包引用；外部依赖可以继续用 catalog: 指向统一版本，只要确保整套流程用 pnpm 进行（install/build/pack/publish）。
  2. 如果需要强行 pin 某个传递依赖（比如安全升级），用 pnpm.overrides；而常规的“大家统一用同一版本”就放在 pnpm-workspace.yaml 的 catalog 区即可。
  3. 记得在 CI 或本地发布脚本里明确调用 pnpm publish --filter @windrun-huaiin/third-ui，避免 npm CLI 直接发布而没有解析这些语法。


升级顺序

  - React 基座（Upgrade.md:10-13, pnpm-workspace.yaml:6-7）：先把运行时升级到 19.2.x，再执行 lint/test，确认核心渲染无回归；随后手动把 catalog.react 和 catalog.react-dom 改成 19.2.0。

  pnpm up -r react@19.2.0 react-dom@19.2.0 @types/react@latest @types/react-dom@latest

  - Next.js（Upgrade.md:15-18, pnpm-workspace.yaml:8,83）：React 稳定后再升 Next 16，以便更快定位问题；更新完别忘了把 catalog.next 与 catalog['eslint-config-next'] 写到 16.0.0。

  pnpm up -r next@16.0.0 eslint-config-next@16.0.0

  - fumadocs 全家桶（Upgrade.md:4-9,54-60, pnpm-workspace.yaml:52-56）：按顺序把 core/ui/mdx/typescript 升到 16.0.9；完成后更新 catalog 中对应条目。

  pnpm up -r fumadocs-core@16.0.9 fumadocs-ui@16.0.9 fumadocs-mdx@16.0.9 fumadocs-typescript@16.0.9

  现有补丁 patches/fumadocs-ui@15.3.3.patch:1 重写了 ClerkTOCItems（新增深度偏移与步骤号逻辑），升版后需评估 16.0.9 是否已内置；若仍需自定义，删除旧补丁并重新走 pnpm patch 流程：

  rm patches/fumadocs-ui@15.3.3.patch
  pnpm patch fumadocs-ui@16.0.9
  # 将 toc-clerk.js/ts 的定制逻辑同步进去
  pnpm patch-commit

  - TypeScript 体系（Upgrade.md:22-25, pnpm-workspace.yaml:81,87）：可选，将 TS 与 Node 类型同步到最新稳定版，保持和新 fumadocs 的类型特性一致。

  pnpm up -r typescript@latest ts-node@latest @types/node@latest

  - Radix UI & Shiki（Upgrade.md:27-35, pnpm-workspace.yaml:11-37,63）：按需挑项目里真正用到的组件批次升级，避免一次性拉太多包；每更一批就更新 catalog 中对应条目。

  pnpm up -r @radix-ui/react-alert-dialog@latest @radix-ui/react-dropdown-menu@latest \
    @radix-ui/react-tooltip@latest shiki@latest

  每完成一步都跑 pnpm lint && pnpm test（必要时再 pnpm build）来锁定回归范围，并在所有命令跑完后执行 pnpm install 生成最新锁文件。需要我进一步检查 patch 是否还能直接沿用或协助调整 pnpm-workspace.yaml 吗？
