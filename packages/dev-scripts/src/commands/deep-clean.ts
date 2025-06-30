import { existsSync, statSync, rmSync, readdirSync, unlinkSync } from 'fs'
import { join, resolve } from 'path'
import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'

interface CleanTarget {
  pattern: string
  description: string
  isFile?: boolean
}

const MONOREPO_CLEAN_TARGETS: CleanTarget[] = [
  { pattern: 'node_modules', description: 'Root directory dependencies' },
  { pattern: 'packages/*/node_modules', description: 'Package dependencies' },
  { pattern: 'apps/*/node_modules', description: 'Application dependencies' },
  { pattern: 'apps/*/.next', description: 'Next.js cache' },
  { pattern: 'packages/*/dist', description: 'Package build artifacts' },
  { pattern: 'apps/*/dist', description: 'Application build artifacts' },
  { pattern: '.turbo', description: 'Root directory Turbo cache' },
  { pattern: 'packages/*/.turbo', description: 'Package Turbo cache' },
  { pattern: 'apps/*/.turbo', description: 'Application Turbo cache' },
  { pattern: 'pnpm-lock.yaml', description: 'pnpm lock file', isFile: true }
]

const SINGLE_CLEAN_TARGETS: CleanTarget[] = [
  { pattern: 'node_modules', description: 'Root directory dependencies' },
  { pattern: '.next', description: 'Next.js cache' },
  { pattern: 'pnpm-lock.yaml', description: 'pnpm lock file', isFile: true }
]

function globDirsOrFiles(pattern: string, cwd: string, isFile?: boolean): string[] {
  if (!pattern.includes('*')) {
    const abs = resolve(cwd, pattern)
    if (isFile) {
      return existsSync(abs) ? [abs] : []
    }
    return existsSync(abs) && statSync(abs).isDirectory() ? [abs] : []
  }
  const [base, rest] = pattern.split('/*')
  const absBase = resolve(cwd, base)
  if (!existsSync(absBase) || !statSync(absBase).isDirectory()) return []
  const subdirs = readdirSync(absBase)
  return subdirs.map(d => join(absBase, d, rest.replace(/^[\/]/, '')))
    .filter(p => existsSync(p) && (isFile ? true : statSync(p).isDirectory()))
}

export async function deepClean(
  config: DevScriptsConfig,
  yes: boolean = false,
  cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'
): Promise<number> {
  const logger = new Logger(config)
  // Environment check, DO NOT EXECUTE IN PRODUCTION ENVIRONMENT
  if (process.env.NODE_ENV === 'production') {
    logger.error('❌ Production environment prohibits deep clean operations')
    logger.log('    If you need to clean, please set: NODE_ENV=development')
    logger.saveToFile('deep-clean.log', cwd)
    return 1
  }

  logger.warn('==============================')
  logger.warn(`‼️  Current working directory: ⭕  ${cwd}  ⭕`)
  logger.warn('==============================')

  // Auto detect project type
  const isMonorepo = existsSync(resolve(cwd, 'pnpm-workspace.yaml'))
  const cleanTargets: CleanTarget[] = isMonorepo ? MONOREPO_CLEAN_TARGETS : SINGLE_CLEAN_TARGETS

  let totalToDelete: string[] = []
  let groupDeleteMap: Record<string, string[]> = {}

  for (const target of cleanTargets) {
    const found = globDirsOrFiles(target.pattern, cwd, target.isFile)
    groupDeleteMap[target.description] = found
    if (found.length === 0) {
      logger.info(`💯   ${target.description}: No need to clean`)
    } else {
      logger.log(`\n[${target.description}]`)
      found.forEach(p => logger.warn(`👙  [Preview] ${p}`))
      totalToDelete.push(...found)
    }
  }

  if (totalToDelete.length === 0) {
    logger.success('No directories or files to clean.')
    logger.saveToFile('deep-clean.log', cwd)
    return 0
  }

  if (!yes) {
    logger.log('\nIf you need to actually delete, please add --yes parameter.')
    logger.saveToFile('deep-clean.log', cwd)
    return 0
  }

  // Execute deletion, grouped print
  let deleted = 0
  for (const target of cleanTargets) {
    const items = groupDeleteMap[target.description] || []
    if (items.length > 0) {
      logger.log(`\n[${target.description}]`)
      for (const p of items) {
        try {
          if (target.isFile) {
            unlinkSync(p)
            if (!existsSync(p)) {
              logger.success(`🍻 Deleted: ${p}`)
              deleted++
            } else {
              logger.error(`❌ Delete failed: ${p} (file still exists)`)
            }
          } else {
            rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
            if (!existsSync(p)) {
              logger.success(`🍻 Deleted: ${p}`)
              deleted++
            } else {
              logger.error(`❌ Delete failed: ${p} (directory still exists)`)
            }
          }
        } catch (e: any) {
          logger.error(`❌ Delete failed: ${p} (${e.message})`)
        }
      }
    }
  }
  logger.log(`\n🍺 Total cleaned: ${deleted} directories or files.`)
  logger.saveToFile('deep-clean.log', cwd)
  return 0
} 