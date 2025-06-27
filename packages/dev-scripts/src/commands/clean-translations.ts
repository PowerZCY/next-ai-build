import { writeFileSync } from 'fs'
import { join } from 'path'
import { DevScriptsConfig } from '../config/schema'
import { Logger } from '../utils/logger'
import { scanFiles, loadTranslations, getTranslationFilePath } from '../utils/file-scanner'
import { 
  extractTranslationsInfo, 
  getAllKeys, 
  removeKeyFromTranslations,
  cleanEmptyObjects
} from '../utils/translation-parser'

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
    logger.log('开始检查未使用的翻译键...')

    // 扫描所有文件
    const scanResults = await scanFiles(config, cwd)
    logger.log(`找到 ${scanResults.length} 个文件需要扫描`)

    // 加载翻译文件
    const translations = loadTranslations(config, cwd)

    // 收集使用的翻译键和命名空间
    const foundTranslationKeys: Set<string> = new Set()
    const foundNamespaces: Set<string> = new Set()

    // 扫描所有文件，收集使用的翻译键和命名空间
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

    logger.log(`\n在代码中找到 ${foundTranslationKeys.size} 个使用的翻译键`)
    logger.log(`在代码中找到 ${foundNamespaces.size} 个使用的命名空间: ${Array.from(foundNamespaces).join(', ')}`)

    // 检查每个语言文件中未使用的键
    const unusedKeys: Record<string, string[]> = {}
    const removedKeys: Record<string, string[]> = {}
    const unusedNamespaces: Record<string, string[]> = {}

    config.i18n.locales.forEach(locale => {
      unusedKeys[locale] = []
      removedKeys[locale] = []
      unusedNamespaces[locale] = []

      // 获取翻译文件中的所有键
      const allTranslationKeys = getAllKeys(translations[locale])

      // 获取翻译文件中的所有命名空间（顶级键）
      const allNamespaces = Object.keys(translations[locale] || {})

      // 找出未使用的命名空间
      allNamespaces.forEach(namespace => {
        if (!foundNamespaces.has(namespace)) {
          unusedNamespaces[locale].push(namespace)
        }
      })

      // 找出未使用的键
      allTranslationKeys.forEach(key => {
        if (!foundTranslationKeys.has(key)) {
          unusedKeys[locale].push(key)
        }
      })

      logger.log(`\n在 ${locale} 翻译文件中找到 ${unusedKeys[locale].length} 个未使用的键`)
      logger.log(`在 ${locale} 翻译文件中找到 ${unusedNamespaces[locale].length} 个未使用的命名空间`)
    })

    if (shouldRemove) {
      logger.log('\n开始删除未使用的翻译键...')

      // 删除每个语言文件中未使用的键
      config.i18n.locales.forEach(locale => {
        const translationsCopy = { ...translations[locale] }

        unusedKeys[locale].forEach(key => {
          if (removeKeyFromTranslations(key, translationsCopy)) {
            removedKeys[locale].push(key)
          }
        })

        // 删除未使用的命名空间
        unusedNamespaces[locale].forEach(namespace => {
          if (translationsCopy[namespace] !== undefined) {
            delete translationsCopy[namespace]
            logger.log(`从 ${locale} 翻译文件中删除了未使用的命名空间: ${namespace}`)
          }
        })

        // 清理空对象
        const cleanedTranslations = cleanEmptyObjects(translationsCopy)

        // 保存更新后的翻译文件
        const filePath = getTranslationFilePath(locale, config, cwd)
        writeFileSync(filePath, JSON.stringify(cleanedTranslations, null, 2), 'utf8')

        logger.log(`从 ${locale} 翻译文件中删除了 ${removedKeys[locale].length} 个未使用的键`)
      })
    } else {
      logger.log('\n要删除未使用的键，请使用 --remove 参数运行脚本')
    }

    // 生成报告
    logger.log('\n=== 未使用的翻译键报告 ===\n')

    config.i18n.locales.forEach(locale => {
      if (unusedNamespaces[locale].length > 0) {
        logger.log(`🔍 ${locale} 翻译文件中未使用的命名空间:`)
        unusedNamespaces[locale].forEach(namespace => logger.log(`  - ${namespace}`))
      } else {
        logger.success(`${locale} 翻译文件中没有未使用的命名空间`)
      }

      if (unusedKeys[locale].length > 0) {
        logger.log(`\n🔍 ${locale} 翻译文件中未使用的键:`)
        unusedKeys[locale].forEach(key => logger.log(`  - ${key}`))
      } else {
        logger.success(`${locale} 翻译文件中没有未使用的键`)
      }

      if (shouldRemove && removedKeys[locale].length > 0) {
        logger.log(`\n🗑️ 从 ${locale} 翻译文件中删除的键:`)
        removedKeys[locale].forEach(key => logger.log(`  - ${key}`))
      }
    })

    logger.log('\n=== 报告结束 ===\n')
    logger.log("⚠️⚠️⚠️脚本依赖正则匹配, 针对单文件存在多个翻译命名空间, 通过命名区分解决: t1 | t2 | t3 | ... ⚠️⚠️⚠️")

    // 保存日志文件
    logger.saveToFile(logFileName, cwd)

    // 如果有任何未使用的键或命名空间，返回非零状态码
    return (Object.values(unusedKeys).some(keys => keys.length > 0) ||
      Object.values(unusedNamespaces).some(namespaces => namespaces.length > 0)) ? 1 : 0

  } catch (error) {
    logger.error(`清理翻译时发生错误: ${error}`)
    return 1
  }
} 