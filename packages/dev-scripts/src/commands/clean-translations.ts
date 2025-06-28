import { writeFileSync } from 'fs'
import { join } from 'path'
import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'
import { scanFiles, loadTranslations, getTranslationFilePath } from '@dev-scripts/utils/file-scanner'
import { 
  extractTranslationsInfo, 
  getAllKeys, 
  removeKeyFromTranslations,
  cleanEmptyObjects
} from '@dev-scripts/utils/translation-parser'

interface CleanReport {
  [key: string]: string[]
}

export async function cleanTranslations(
  config: DevScriptsConfig, 
  shouldRemove: boolean = false,
  cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'
): Promise<number> {
  const logger = new Logger(config)
  const logFileName = shouldRemove ? 'remove.log' : 'clean.log'
  
  try {
    logger.log('start checking unused translation keys...')

    // scan all files
    const scanResults = await scanFiles(config, cwd)
    logger.log(`找到 ${scanResults.length} 个文件需要扫描`)

    // load translation files
    const translations = loadTranslations(config, cwd)

    // collect used translation keys and namespaces
    const foundTranslationKeys: Set<string> = new Set()
    const foundNamespaces: Set<string> = new Set()

    // scan all files, collect used translation keys and namespaces
    for (const { filePath, content } of scanResults) {
      try {
        const { namespaces, keys } = extractTranslationsInfo(content, filePath)

        if (keys.length > 0 || namespaces.size > 0) {
          logger.log(`found the following information in the file ${filePath}:`)

          if (namespaces.size > 0) {
            logger.log(`  translation function mapping:`)
            namespaces.forEach((namespace, varName) => {
              logger.log(`    - ${varName} => ${namespace}`)
              foundNamespaces.add(namespace)
            })
          }

          if (keys.length > 0) {
            logger.log(`  translation keys:`)
            keys.forEach(key => {
              logger.log(`    - ${key}`)
              foundTranslationKeys.add(key)
            })
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`error processing file ${filePath}: ${error.message}`)
        } else {
          logger.error(`error processing file ${filePath}: unknown error`)
        }
      }
    }

    logger.log(`\nfound ${foundTranslationKeys.size} used translation keys in the code`)
    logger.log(`found ${foundNamespaces.size} used namespaces in the code: ${Array.from(foundNamespaces).join(', ')}`)

    // check unused keys in each language file
    const unusedKeys: Record<string, string[]> = {}
    const removedKeys: Record<string, string[]> = {}
    const unusedNamespaces: Record<string, string[]> = {}

    config.i18n.locales.forEach(locale => {
      unusedKeys[locale] = []
      removedKeys[locale] = []
      unusedNamespaces[locale] = []

      // get all keys in the translation file
      const allTranslationKeys = getAllKeys(translations[locale])

      // get all namespaces (top-level keys) in the translation file
      const allNamespaces = Object.keys(translations[locale] || {})

      // find unused namespaces
      allNamespaces.forEach(namespace => {
        if (!foundNamespaces.has(namespace)) {
          unusedNamespaces[locale].push(namespace)
        }
      })

      // find unused keys
      allTranslationKeys.forEach(key => {
        if (!foundTranslationKeys.has(key)) {
          unusedKeys[locale].push(key)
        }
      })

      logger.log(`\nfound ${unusedKeys[locale].length} unused keys in the ${locale} translation file`)
      logger.log(`found ${unusedNamespaces[locale].length} unused namespaces in the ${locale} translation file`)
    })

    if (shouldRemove) {
      logger.log('\nstart deleting unused translation keys...')

      // delete unused keys in each language file
      config.i18n.locales.forEach(locale => {
        const translationsCopy = { ...translations[locale] }

        unusedKeys[locale].forEach(key => {
          if (removeKeyFromTranslations(key, translationsCopy)) {
            removedKeys[locale].push(key)
          }
        })

        // delete unused namespaces
        unusedNamespaces[locale].forEach(namespace => {
          if (translationsCopy[namespace] !== undefined) {
            delete translationsCopy[namespace]
            logger.log(`deleted unused namespace ${namespace} from the ${locale} translation file`)
          }
        })

        // clean empty objects
        const cleanedTranslations = cleanEmptyObjects(translationsCopy)

        // save updated translation file
        const filePath = getTranslationFilePath(locale, config, cwd)
        writeFileSync(filePath, JSON.stringify(cleanedTranslations, null, 2), 'utf8')

        logger.log(`deleted ${removedKeys[locale].length} unused keys from the ${locale} translation file`)
      })
    } else {
      logger.log('\nTo delete unused keys, please run the script with the --remove parameter')
    }

    // generate report
    logger.log('\n=== unused translation keys report ===\n')

    config.i18n.locales.forEach(locale => {
      if (unusedNamespaces[locale].length > 0) {
        logger.log(`🔍 unused namespaces in the ${locale} translation file:`)
        unusedNamespaces[locale].forEach(namespace => logger.log(`  - ${namespace}`))
      } else {
        logger.success(`${locale} translation file has no unused namespaces`)
      }

      if (unusedKeys[locale].length > 0) {
        logger.log(`\n🔍 unused keys in the ${locale} translation file:`)
        unusedKeys[locale].forEach(key => logger.log(`  - ${key}`))
      } else {
        logger.success(`${locale} translation file has no unused keys`)
      }

      if (shouldRemove && removedKeys[locale].length > 0) {
        logger.log(`\n🗑️ deleted keys from the ${locale} translation file:`)
        removedKeys[locale].forEach(key => logger.log(`  - ${key}`))
      }
    })

    logger.log('\n=== report end ===\n')
    logger.log("⚠️⚠️⚠️script depends on regular matching, for multiple translation namespaces in a single file, use naming to distinguish: t1 | t2 | t3 | ... ⚠️⚠️⚠️")

    // save log file
    logger.saveToFile(logFileName, cwd)

    // if there are any unused keys or namespaces, return non-zero status code
    return (Object.values(unusedKeys).some(keys => keys.length > 0) ||
      Object.values(unusedNamespaces).some(namespaces => namespaces.length > 0)) ? 1 : 0

  } catch (error) {
    logger.error(`error cleaning translations: ${error}`)
    return 1
  }
} 