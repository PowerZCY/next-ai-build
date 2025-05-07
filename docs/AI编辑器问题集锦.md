# AI编辑器问题集锦

# 一条命令获取模板工程
- 前置环境依赖
```bash
# Node.js 环境, 检查是否安装
node -v
# 如果未安装, 使用 brew 安装
brew install node

# 检查版本
npm -v
# npm 通常随 Node.js 一起安装, 如需更新：
npm install -g npm@latest
# 建议使用 nvm 管理 Node.js 版本, 安装 nvm
brew install nvm
# 安装特定版本的 Node.js（推荐使用 LTS 版本）
nvm install --lts
nvm use --lts

# 使用 npm 全局安装 pnpm, 用于管理项目依赖 pnpm比npm要好
npm install -g pnpm
# 验证安装
pnpm -v
# 设置淘宝镜像源（可选，但建议国内用户设置）
# pnpm config set registry https://registry.npmmirror.com
```

- 一键直达
```bash
# 
npx create-next-app . --example https://github.com/caofanCPU/模板仓库
```

## 编码类问题

### eslint未使用包报错
- 安装检查插件
```bash
pnpm add -D eslint-plugin-unused-imports
```
- 配置根目录**/.eslintrc.json**
```json
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "@typescript-eslint",
    "unused-imports"
  ],
  "rules": {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "error",
      {
        "vars": "all",
        "varsIgnorePattern": "^_",
        "args": "after-used",
        "argsIgnorePattern": "^_"
      }
    ]
  }
}
```
- 修改**package.json**，让本地dev环境执行时就会进行`eslint --fix . && next lint`命令，清除未使用的导入
- 生产环境不要使用，因为这是本地代码提交前就要保证的

```json
{
    "scripts": {
        "predev": "pnpm run lint",
        "dev": "next dev",
        "lint": "eslint --fix . && next lint"
    }
}
```

### 国际化语言翻译键值完整性检查
- 安装所需的依赖
```bash
pnpm add -D ts-node glob @types/glob typescript
```
- 创建**tsconfig.node.json**文件
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "CommonJS",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "target": "ES2020",
    "lib": ["ES2020"],
    "esModuleInterop": true
  },
  "include": ["scripts/**/*"]
}
```
- 创建**appConfig.ts**文件, 定义项目支持的语言列表
```ts
export const appConfig = {
  // 国际化配置
  i18n: {
    locales: ["en", "zh", "ja", "ko", "fr", "de", "es", "it", "pt", "ru", "ar", "hi", "tr", "pl", "uk"] as const,
    defaultLocale: "en" as const,
    localeLabels: {
      en: "English",
      zh: "简体中文",
      ja: "日本語",
      ko: "한국어",
      fr: "Français",
      de: "Deutsch",
      es: "Español",
      it: "Italiano",
      pt: "Português",
      ru: "Русский",
      ar: "العربية",
      hi: "हिन्दी",
      tr: "Türkçe",
      pl: "Polski",
      uk: "Українська"
    }
  }
}
```
- 创建国际化翻译目录**messages**及每种语言的翻译文件**XX.json**

- 在**package.json**中添加脚本
```json
{
  "scripts": {
    "check-translations": "ts-node scripts/check-translations.ts"
  }
}
```
- 运行脚本
```bash
pnpm check-translations
```


### eslint关于使用any类型的问题
- 尽量遵循规范，不要使用any类型
- 询问AI时，制定生成代码的规则，明确要求它遵守TS的强类型规范
- 对于历史代码，禁用改检查项

```text
1. 特定行禁用该规则，可以使用注释：
// eslint-disable-next-line @typescript-eslint/no-explicit-any

2. 特定文件禁用该规则，可以在文件顶部添加注释：
/* eslint-disable @typescript-eslint/no-explicit-any */

3. 特定函数禁用该规则，可以在 ESLint 配置文件（如 .eslintrc.json ）中进行配置：

module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
4. 使用useEffect警告缺失了依赖项, 但如果加上依赖项又会引起问题就需要屏蔽
// eslint-disable-next-line react-hooks/exhaustive-deps
```



## PNPM 依赖常用检查命令
### pnpm基础命令
```bash
# 安装依赖
pnpm install
# 添加新依赖
pnpm add <package-name>
# 添加只在开发环境下需要的依赖
pnpm add -D <package-name>
# 更新依赖
pnpm update
# 运行脚本
pnpm run <script-name>
# 清理依赖缓存
pnpm store prune
```

### pnpm 安全检查命令

- 首先运行 pnpm audit 检查安全漏洞
- 使用 pnpm outdated 查看是否有过时的包
- 如果发现问题，可以尝试使用 pnpm audit fix 进行修复
- 对于特定包的问题，使用 pnpm why 命令进行深入分析

```bash
# 1. 检查安全漏洞
pnpm audit
# 2. 检查过时依赖
pnpm outdated
# 3. 验证依赖存储完整性
pnpm list
# 4. 检查特定包的依赖关系
pnpm why <package-name>
# 5. 自动修复依赖问题
pnpm audit fix
# 6. 删除重复依赖
pnpm dedupe
```

### Prisma 命令
```bash
# 生成 Prisma Client
pnpm prisma generate
# 创建新的迁移
pnpm prisma migrate dev --name <migration-name>
# 部署迁移
pnpm prisma migrate deploy
# 重置数据库
pnpm prisma migrate reset
# 查看数据库
pnpm prisma studio
```

### PostgreSQL 常用操作
```bash
# 创建数据库
creatdb <database-name>
# 删除数据库
dropdb <database-name>
# 连接数据库
psql -d <database-name>

# 常用 psql 命令
\l          # 列出所有数据库
\c <dbname> # 连接到指定数据库
\dt         # 显示所有表
\d <table>  # 显示表结构
\q          # 退出
```

woca 