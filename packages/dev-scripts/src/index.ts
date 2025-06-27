// 配置相关
export { loadConfig, validateConfig } from './config'
export type { DevScriptsConfig, PackageJsonDevScripts } from './config/schema'
export { DEFAULT_CONFIG } from './config/schema'

// 命令相关
export { checkTranslations } from './commands/check-translations'
export { cleanTranslations } from './commands/clean-translations'
export { generateBlogIndex } from './commands/generate-blog-index'

// 工具相关
export { Logger } from './utils/logger'
export { scanFiles, readJsonFile, loadTranslations } from './utils/file-scanner'
export { 
  extractTranslationsInfo, 
  getAllKeys, 
  checkKeyExists, 
  checkNamespaceExists,
  removeKeyFromTranslations,
  cleanEmptyObjects
} from './utils/translation-parser'
export type { TranslationInfo } from './utils/translation-parser' 