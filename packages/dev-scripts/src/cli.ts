#!/usr/bin/env node

import { program } from 'commander'
import { loadConfig, validateConfig } from './config'
import { checkTranslations } from './commands/check-translations'
import { cleanTranslations } from './commands/clean-translations'
import { generateBlogIndex } from './commands/generate-blog-index'

// 获取当前工作目录，确保Node.js环境下正常运行
const cwd = typeof process !== 'undefined' ? process.cwd() : '.'

program
  .name('dev-scripts')
  .description('开发脚本工具集 - 用于多语言项目的翻译检查、博客索引生成等')
  .version('1.0.0')

program
  .command('check-translations')
  .description('检查翻译文件的完整性和一致性')
  .option('-v, --verbose', '显示详细日志', false)
  .option('--config <path>', '指定配置文件路径')
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {
        output: { 
          verbose: options.verbose,
          logDir: 'scripts'
        }
      })
      
      validateConfig(config)
      
      const exitCode = await checkTranslations(config, cwd)
      
      if (typeof process !== 'undefined') {
        process.exit(exitCode)
      }
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

program
  .command('clean-translations')
  .description('清理未使用的翻译键')
  .option('-v, --verbose', '显示详细日志', false)
  .option('--remove', '实际删除未使用的键（默认只显示）', false)
  .option('--config <path>', '指定配置文件路径')
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {
        output: { 
          verbose: options.verbose,
          logDir: 'scripts'
        }
      })
      
      validateConfig(config)
      
      const exitCode = await cleanTranslations(config, options.remove, cwd)
      
      if (typeof process !== 'undefined') {
        process.exit(exitCode)
      }
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

program
  .command('generate-blog-index')
  .description('生成博客索引文件')
  .option('-v, --verbose', '显示详细日志', false)
  .option('--config <path>', '指定配置文件路径')
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {
        output: { 
          verbose: options.verbose,
          logDir: 'scripts'
        }
      })
      
      validateConfig(config)
      
      const exitCode = await generateBlogIndex(config, cwd)
      
      if (typeof process !== 'undefined') {
        process.exit(exitCode)
      }
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

// 解析命令行参数
if (typeof process !== 'undefined') {
  program.parse(process.argv)
} 