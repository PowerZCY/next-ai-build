import fg from 'fast-glob'
import { readFileSync } from 'fs'
import { DevScriptsConfig } from '../config/schema'

export interface ScanResult {
  filePath: string
  content: string
}

/**
 * 扫描匹配的文件
 */
export async function scanFiles(config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): Promise<ScanResult[]> {
  const files: string[] = await fg(config.scan.include, {
    ignore: config.scan.exclude || [],
    cwd,
    absolute: false
  })

  const results: ScanResult[] = []
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8')
      results.push({
        filePath: file,
        content
      })
    } catch (error) {
      console.warn(`Warning: Failed to read file ${file}: ${error}`)
    }
  }

  return results
}

/**
 * 从给定路径读取JSON文件
 */
export function readJsonFile<T = any>(filePath: string): T | null {
  try {
    const content = readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    return null
  }
}

/**
 * 获取翻译文件路径
 */
export function getTranslationFilePath(locale: string, config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): string {
  return `${cwd}/${config.i18n.messageRoot}/${locale}.json`
}

/**
 * 批量读取所有语言的翻译文件
 */
export function loadTranslations(config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): Record<string, Record<string, any>> {
  const translations: Record<string, Record<string, any>> = {}
  
  for (const locale of config.i18n.locales) {
    const filePath = getTranslationFilePath(locale, config, cwd)
    const translation = readJsonFile(filePath)
    
    if (translation) {
      translations[locale] = translation
    } else {
      console.warn(`Warning: Failed to load translation file for locale: ${locale}`)
      translations[locale] = {}
    }
  }
  
  return translations
} 