import fs from 'fs'
import path from 'path'
import { DEFAULT_CONFIG, DevScriptsConfig, PackageJsonDevScripts } from './schema'

/**
 * 从 package.json 加载配置
 */
function loadPackageJsonConfig(cwd: string): Partial<DevScriptsConfig> | null {
  try {
    const packageJsonPath = path.join(cwd, 'package.json')
    if (!fs.existsSync(packageJsonPath)) return null
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const devScripts: PackageJsonDevScripts = packageJson.devScripts || {}
    
    // 转换为标准配置格式
    return {
      i18n: {
        locales: devScripts.locales || DEFAULT_CONFIG.i18n.locales,
        defaultLocale: devScripts.defaultLocale || DEFAULT_CONFIG.i18n.defaultLocale,
        messageRoot: devScripts.messageRoot || DEFAULT_CONFIG.i18n.messageRoot
      },
      scan: {
        include: devScripts.scanDirs || DEFAULT_CONFIG.scan.include,
        exclude: DEFAULT_CONFIG.scan.exclude
      },
      blog: devScripts.blogDir ? {
        mdxDir: devScripts.blogDir,
        ...DEFAULT_CONFIG.blog
      } : undefined,
      output: {
        logDir: devScripts.logDir || DEFAULT_CONFIG.output.logDir,
        verbose: DEFAULT_CONFIG.output.verbose
      }
    }
  } catch (error) {
    console.warn(`Warning: Failed to load package.json config: ${error}`)
    return null
  }
}

/**
 * 从专用配置文件加载配置
 */
function loadConfigFile(cwd: string): Partial<DevScriptsConfig> | null {
  const configFiles = [
    'dev-scripts.config.js',
    'dev-scripts.config.json',
    '.dev-scriptsrc.json'
  ]
  
  for (const configFile of configFiles) {
    try {
      const configPath = path.join(cwd, configFile)
      if (!fs.existsSync(configPath)) continue
      
      if (configFile.endsWith('.json')) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'))
      } else if (configFile.endsWith('.js')) {
        // 简单的 require，实际项目中可能需要更复杂的加载逻辑
        delete require.cache[configPath]
        return require(configPath)
      }
    } catch (error) {
      console.warn(`Warning: Failed to load ${configFile}: ${error}`)
    }
  }
  
  return null
}

/**
 * 深度合并配置对象
 */
function mergeConfig(base: DevScriptsConfig, override: Partial<DevScriptsConfig>): DevScriptsConfig {
  const result = { ...base }
  
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value) && typeof result[key as keyof DevScriptsConfig] === 'object') {
        ;(result as any)[key] = { ...(result as any)[key], ...value }
      } else {
        ;(result as any)[key] = value
      }
    }
  }
  
  return result
}

/**
 * 加载完整配置
 */
export function loadConfig(cwd: string = typeof process !== 'undefined' ? process.cwd() : '.', override: Partial<DevScriptsConfig> = {}): DevScriptsConfig {
  let config = { ...DEFAULT_CONFIG }
  
  // 1. 加载配置文件
  const fileConfig = loadConfigFile(cwd)
  if (fileConfig) {
    config = mergeConfig(config, fileConfig)
  }
  
  // 2. 加载 package.json 配置
  const packageConfig = loadPackageJsonConfig(cwd)
  if (packageConfig) {
    config = mergeConfig(config, packageConfig)
  }
  
  // 3. 应用命令行传入的覆盖配置
  config = mergeConfig(config, override)
  
  return config
}

/**
 * 验证配置有效性
 */
export function validateConfig(config: DevScriptsConfig): void {
  if (!config.i18n.locales || config.i18n.locales.length === 0) {
    throw new Error('至少需要配置一种语言')
  }
  
  if (!config.i18n.locales.includes(config.i18n.defaultLocale)) {
    throw new Error('默认语言必须在支持的语言列表中')
  }
  
  if (config.scan.include.length === 0) {
    throw new Error('必须配置至少一个扫描路径')
  }
} 