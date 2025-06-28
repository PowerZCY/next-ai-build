import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'
import { scanFiles, loadTranslations } from '@dev-scripts/utils/file-scanner'
import { 
  extractTranslationsInfo, 
  getAllKeys, 
  checkKeyExists, 
  checkNamespaceExists 
} from '@dev-scripts/utils/translation-parser'

interface TranslationReport {
  [key: string]: string[]
}

export async function checkTranslations(config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): Promise<number> {
  const logger = new Logger(config)
  
  try {
    logger.log('start checking translations...')

    // scan all files
    const scanResults = await scanFiles(config, cwd)
    logger.log(`found ${scanResults.length} files to scan`)

    // load translation files
    const translations = loadTranslations(config, cwd)

    // collect used translation keys and namespaces
    const foundTranslationKeys: Set<string> = new Set()
    const foundNamespaces: Set<string> = new Set()

    // scan all files, extract translation information
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

    logger.log(`\nfound ${foundNamespaces.size} used namespaces in the code: ${Array.from(foundNamespaces).join(', ')}`)

    // check results
    const report: TranslationReport = {}

    // check if the namespace exists
    foundNamespaces.forEach(namespace => {
      config.i18n.locales.forEach(locale => {
        const missingNamespaceKey = `missingNamespacesIn${locale.toUpperCase()}`
        if (!checkNamespaceExists(namespace, translations[locale])) {
          report[missingNamespaceKey] = report[missingNamespaceKey] || []
          report[missingNamespaceKey].push(namespace)
        }
      })
    })

    // check if the translation key exists
    foundTranslationKeys.forEach(key => {
      config.i18n.locales.forEach(locale => {
        const missingKey = `missingIn${locale.toUpperCase()}`
        if (!checkKeyExists(key, translations[locale])) {
          report[missingKey] = report[missingKey] || []
          report[missingKey].push(key)
        }
      })
    })

    // check if the translation keys are consistent
    config.i18n.locales.forEach(locale => {
      const allKeys = getAllKeys(translations[locale])
      config.i18n.locales.forEach(otherLocale => {
        if (locale !== otherLocale) {
          const otherKeys = getAllKeys(translations[otherLocale])
          const onlyKeys = `${locale}OnlyKeys`
          report[onlyKeys] = allKeys.filter(key => !otherKeys.includes(key))
        }
      })
    })

    // generate report
    logger.log('\n=== translation check report ===\n')

    // first report missing namespaces, which is usually the most serious problem
    config.i18n.locales.forEach(locale => {
      const missingNamespaceKey = `missingNamespacesIn${locale.toUpperCase()}`
      if (report[missingNamespaceKey]?.length > 0) {
        logger.log(`🚨 missing namespaces in the ${locale} translation file:`)
        report[missingNamespaceKey].forEach(namespace => logger.log(`  - ${namespace}`))
      } else {
        logger.success(`${locale} translation file has all used namespaces`)
      }
    })

    // then report missing translation keys
    config.i18n.locales.forEach(locale => {
      const missingKey = `missingIn${locale.toUpperCase()}`
      if (report[missingKey]?.length > 0) {
        logger.log(`\n🔴 missing keys in the ${locale} translation file:`)
        report[missingKey].forEach(key => logger.log(`  - ${key}`))
      } else {
        logger.success(`${locale} translation file has all used keys`)
      }
    })

    // finally report inconsistent keys
    config.i18n.locales.forEach(locale => {
      const onlyKeys = `${locale}OnlyKeys`
      if (report[onlyKeys]?.length > 0) {
        logger.log(`\n⚠️ keys only exist in the ${locale} translation file:`)
        report[onlyKeys].forEach(key => logger.log(`  - ${key}`))
      }
    })

    logger.log('\n=== report end ===\n')
    logger.log("⚠️⚠️⚠️script depends on regular matching, for multiple translation namespaces in a single file, use naming to distinguish: t1 | t2 | t3 | ... ⚠️⚠️⚠️")

    // save log file
    logger.saveToFile('check.log', cwd)

    // if there are any problems, return non-zero status code
    return Object.values(report).some(keys => keys.length > 0) ? 1 : 0

  } catch (error) {  
    logger.error(`error checking translations: ${error}`)
    return 1
  }
} 