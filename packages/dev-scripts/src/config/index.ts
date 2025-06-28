import fs from 'fs'
import path from 'path'
import { DEFAULT_CONFIG, DevScriptsConfig, PackageJsonDevScripts } from '@dev-scripts/config/schema'

/**
 * load config from package.json
 */
function loadPackageJsonConfig(cwd: string): Partial<DevScriptsConfig> | null {
  try {
    const packageJsonPath = path.join(cwd, 'package.json')
    if (!fs.existsSync(packageJsonPath)) return null
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const devScripts: PackageJsonDevScripts = packageJson.devScripts || {}
    
    // convert to standard config format
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
 * load config from special config file
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
        // simple require, in actual project, may need more complex loading logic
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
 * deep merge config object
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
 * load full config
 */
export function loadConfig(cwd: string = typeof process !== 'undefined' ? process.cwd() : '.', override: Partial<DevScriptsConfig> = {}): DevScriptsConfig {
  let config = { ...DEFAULT_CONFIG }
  
  // 1. load config file
  const fileConfig = loadConfigFile(cwd)
  if (fileConfig) {
    config = mergeConfig(config, fileConfig)
  }
  
  // 2. load package.json config
  const packageConfig = loadPackageJsonConfig(cwd)
  if (packageConfig) {
    config = mergeConfig(config, packageConfig)
  }
  
  // 3. apply override config from command line
  config = mergeConfig(config, override)
  
  return config
}

/**
 * validate config
 */
export function validateConfig(config: DevScriptsConfig): void {
  if (!config.i18n.locales || config.i18n.locales.length === 0) {
    throw new Error('at least one language is required')
  }
  
  if (!config.i18n.locales.includes(config.i18n.defaultLocale)) {
    throw new Error('default language must be in the supported language list')
  }
  
  if (config.scan.include.length === 0) {
    throw new Error('at least one scan path is required')
  }
} 