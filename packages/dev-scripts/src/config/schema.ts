export interface DevScriptsConfig {
  // 国际化配置
  i18n: {
    locales: string[]
    defaultLocale: string
    messageRoot: string
  }
  
  // 文件扫描配置
  scan: {
    include: string[]
    exclude?: string[]
    baseDir?: string
  }
  
  // 博客配置
  blog?: {
    mdxDir: string
    outputFile?: string
    metaFile?: string
    iocSlug?: string
    prefix?: string
  }
  
  // 输出配置
  output: {
    logDir: string
    verbose?: boolean
  }
}

export interface PackageJsonDevScripts {
  locales?: string[]
  defaultLocale?: string
  messageRoot?: string
  scanDirs?: string[]
  blogDir?: string
  logDir?: string
}

export const DEFAULT_CONFIG: DevScriptsConfig = {
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
    messageRoot: 'messages'
  },
  scan: {
    include: ['src/**/*.{tsx,ts,jsx,js}'],
    exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'node_modules/**']
  },
  blog: {
    mdxDir: 'src/mdx/blog',
    outputFile: 'index.mdx',
    metaFile: 'meta.json',
    iocSlug: 'ioc',
    prefix: 'blog'
  },
  output: {
    logDir: 'scripts',
    verbose: false
  }
} 