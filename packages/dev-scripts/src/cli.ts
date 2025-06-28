#!/usr/bin/env node

import { program } from 'commander'
import { loadConfig, validateConfig } from '@dev-scripts/config'
import { checkTranslations } from '@dev-scripts/commands/check-translations'
import { cleanTranslations } from '@dev-scripts/commands/clean-translations'
import { generateBlogIndex } from '@dev-scripts/commands/generate-blog-index'

// get current working directory, ensure it works in Node.js environment
const cwd = typeof process !== 'undefined' ? process.cwd() : '.'

program
  .name('dev-scripts')
  .description('development scripts for multi-language projects')
  .version('1.0.0')

program
  .command('check-translations')
  .description('check the completeness and consistency of translation files')
  .option('-v, --verbose', 'show detailed logs', false)
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {}, options.verbose)
      
      // apply verbose option after loading
      if (options.verbose) {
        config.output.verbose = true
      }
      
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
  .description('clean unused translation keys')
  .option('-v, --verbose', 'show detailed logs', false)
  .option('--remove', 'actually delete unused keys (default only show)', false)
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {}, options.verbose)
      
      // apply verbose option after loading
      if (options.verbose) {
        config.output.verbose = true
      }
      
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
  .description('generate blog index file')
  .option('-v, --verbose', 'show detailed logs', false)
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {}, options.verbose)
      
      // apply verbose option after loading
      if (options.verbose) {
        config.output.verbose = true
      }
      
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

// parse command line arguments
if (typeof process !== 'undefined') {
  program.parse(process.argv)
} 