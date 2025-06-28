import fg from 'fast-glob'
import { readFileSync } from 'fs'
import { DevScriptsConfig } from '@dev-scripts/config/schema'

export interface ScanResult {
  filePath: string
  content: string
}

/**
 * scan matching files
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
 * read JSON file from given path
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
 * get translation file path
 */
export function getTranslationFilePath(locale: string, config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): string {
  return `${cwd}/${config.i18n.messageRoot}/${locale}.json`
}

/**
 * load all translation files
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