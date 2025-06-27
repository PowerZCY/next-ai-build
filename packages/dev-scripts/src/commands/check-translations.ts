import { DevScriptsConfig } from '../config/schema'
import { Logger } from '../utils/logger'
import { scanFiles, loadTranslations } from '../utils/file-scanner'
import { 
  extractTranslationsInfo, 
  getAllKeys, 
  checkKeyExists, 
  checkNamespaceExists 
} from '../utils/translation-parser'

interface TranslationReport {
  [key: string]: string[]
}

export async function checkTranslations(config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): Promise<number> {
  const logger = new Logger(config)
  
  try {
    logger.log('开始检查翻译...')

    // 扫描所有文件
    const scanResults = await scanFiles(config, cwd)
    logger.log(`找到 ${scanResults.length} 个文件需要扫描`)

    // 加载翻译文件
    const translations = loadTranslations(config, cwd)

    // 收集使用的翻译键和命名空间
    const foundTranslationKeys: Set<string> = new Set()
    const foundNamespaces: Set<string> = new Set()

    // 扫描所有文件，提取翻译信息
    for (const { filePath, content } of scanResults) {
      try {
        const { namespaces, keys } = extractTranslationsInfo(content, filePath)

        if (keys.length > 0 || namespaces.size > 0) {
          logger.log(`在文件 ${filePath} 中找到以下信息:`)

          if (namespaces.size > 0) {
            logger.log(`  翻译函数映射:`)
            namespaces.forEach((namespace, varName) => {
              logger.log(`    - ${varName} => ${namespace}`)
              foundNamespaces.add(namespace)
            })
          }

          if (keys.length > 0) {
            logger.log(`  翻译键:`)
            keys.forEach(key => {
              logger.log(`    - ${key}`)
              foundTranslationKeys.add(key)
            })
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`处理文件 ${filePath} 时出错: ${error.message}`)
        } else {
          logger.error(`处理文件 ${filePath} 时出错: 未知错误`)
        }
      }
    }

    logger.log('\n检查翻译文件中的键...')
    logger.log(`在代码中找到 ${foundNamespaces.size} 个使用的命名空间: ${Array.from(foundNamespaces).join(', ')}`)

    // 检查结果
    const report: TranslationReport = {}

    // 检查命名空间是否存在
    foundNamespaces.forEach(namespace => {
      config.i18n.locales.forEach(locale => {
        const missingNamespaceKey = `missingNamespacesIn${locale.toUpperCase()}`
        if (!checkNamespaceExists(namespace, translations[locale])) {
          report[missingNamespaceKey] = report[missingNamespaceKey] || []
          report[missingNamespaceKey].push(namespace)
        }
      })
    })

    // 检查翻译键是否存在
    foundTranslationKeys.forEach(key => {
      config.i18n.locales.forEach(locale => {
        const missingKey = `missingIn${locale.toUpperCase()}`
        if (!checkKeyExists(key, translations[locale])) {
          report[missingKey] = report[missingKey] || []
          report[missingKey].push(key)
        }
      })
    })

    // 检查翻译文件的键是否一致
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

    // 生成报告
    logger.log('\n=== 翻译检查报告 ===\n')

    // 首先报告缺失的命名空间，这通常是最严重的问题
    config.i18n.locales.forEach(locale => {
      const missingNamespaceKey = `missingNamespacesIn${locale.toUpperCase()}`
      if (report[missingNamespaceKey]?.length > 0) {
        logger.log(`🚨 ${locale} 翻译文件中缺失的命名空间:`)
        report[missingNamespaceKey].forEach(namespace => logger.log(`  - ${namespace}`))
      } else {
        logger.success(`${locale} 翻译文件中包含所有使用的命名空间`)
      }
    })

    // 然后报告缺失的翻译键
    config.i18n.locales.forEach(locale => {
      const missingKey = `missingIn${locale.toUpperCase()}`
      if (report[missingKey]?.length > 0) {
        logger.log(`\n🔴 ${locale} 翻译文件中缺失的键:`)
        report[missingKey].forEach(key => logger.log(`  - ${key}`))
      } else {
        logger.success(`${locale} 翻译文件中包含所有使用的键`)
      }
    })

    // 最后报告不一致的键
    config.i18n.locales.forEach(locale => {
      const onlyKeys = `${locale}OnlyKeys`
      if (report[onlyKeys]?.length > 0) {
        logger.log(`\n⚠️ 仅在 ${locale} 翻译文件中存在的键:`)
        report[onlyKeys].forEach(key => logger.log(`  - ${key}`))
      }
    })

    logger.log('\n=== 报告结束 ===\n')
    logger.log("⚠️⚠️⚠️脚本依赖正则匹配, 针对单文件存在多个翻译命名空间, 通过命名区分解决: t1 | t2 | t3 | ... ⚠️⚠️⚠️")

    // 保存日志文件
    logger.saveToFile('check.log', cwd)

    // 如果有任何问题，返回非零状态码
    return Object.values(report).some(keys => keys.length > 0) ? 1 : 0

  } catch (error) {
    logger.error(`检查翻译时发生错误: ${error}`)
    return 1
  }
} 