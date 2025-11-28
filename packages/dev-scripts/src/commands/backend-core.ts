import { Command } from 'commander'
import { promises as fs } from 'fs'
import { createRequire } from 'module'
import path from 'path'

type RouteDef = {
  path: string
  importPath: string
  methods: string[]
  runtime?: 'nodejs' | 'edge' | 'experimental-edge'
}

type RouteSyncResult = {
  file: string
  status: string
}

const PACKAGE_NAME = '@windrun-huaiin/backend-core'

const ROUTES: RouteDef[] = [
  {
    path: 'webhook/stripe',
    importPath: `${PACKAGE_NAME}/app/api/webhook/stripe/route`,
    methods: ['POST'],
    runtime: 'nodejs'
  },
  {
    path: 'webhook/clerk/user',
    importPath: `${PACKAGE_NAME}/app/api/webhook/clerk/user/route`,
    methods: ['POST']
  },
  {
    path: 'user/anonymous/init',
    importPath: `${PACKAGE_NAME}/app/api/user/anonymous/init/route`,
    methods: ['POST']
  },
  {
    path: 'stripe/checkout',
    importPath: `${PACKAGE_NAME}/app/api/stripe/checkout/route`,
    methods: ['POST']
  },
  {
    path: 'stripe/customer-portal',
    importPath: `${PACKAGE_NAME}/app/api/stripe/customer-portal/route`,
    methods: ['POST']
  }
]

export function registerBackendCoreCommands(program: Command) {
  const backendCore = program
    .command('backend-core')
    .usage('backend-core <subcommand> [options]')
    .description('Integration @windrun-huaiin/backend-core, use "dev-scripts backend-core -h" for more msg')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  dev-scripts backend-core routes:list',
        '  dev-scripts backend-core routes:sync --app-dir src/app --force',
        '  dev-scripts backend-core prisma:sync --schema prisma/schema.prisma',
        '  dev-scripts backend-core migrations:sync --dest prisma --force',
        '',
        'Defaults:',
        '  routes:sync    --app-dir src/app (generates under <app-dir>/api)',
        '  prisma:sync    --schema prisma/schema.prisma',
        '  migrations:sync --dest prisma (copies migrations/*.sql into dest)',
      ].join('\n')
    )

  backendCore
    .command('routes:sync')
    .description('Generate Next.js route proxy files that re-export backend-core handlers')
    .option('--app-dir <dir>', 'App directory containing api folder', 'src/app')
    .option('--force', 'Overwrite existing files', false)
    .action(async (opts) => {
      const cwd = process.cwd()
      try {
        const results = await syncBackendCoreRoutes(opts.appDir, opts.force, cwd)
        console.log('Routes sync results:')
        for (const r of results) {
          console.log(`- ${r.status} :: ${r.file}`)
        }
      } catch (error) {
        console.error('routes:sync failed:', (error as Error).message)
        process.exitCode = 1
      }
    })

  backendCore
    .command('routes:list')
    .description('List available backend-core routes')
    .action(() => {
      listBackendCoreRoutes()
    })

  backendCore
    .command('prisma:sync')
    .description('Append backend-core models into host prisma/schema.prisma (datasource/generator stay from host)')
    .option('--schema <file>', 'Host schema.prisma path', 'prisma/schema.prisma')
    .action(async (opts) => {
      const cwd = process.cwd()
      try {
        const message = await syncBackendCorePrisma(opts.schema, cwd)
        console.log(message)
      } catch (error) {
        console.error('prisma:sync failed:', (error as Error).message)
        process.exitCode = 1
      }
    })

  backendCore
    .command('migrations:sync')
    .description('Copy backend-core SQL migrations into the host directory')
    .option('--dest <dir>', 'Target migrations directory', 'prisma')
    .option('--schema <name>', 'Database schema name (replaces "nextai" in SQL files)', 'nextai')
    .option('--force', 'Overwrite existing files', false)
    .action(async (opts) => {
      const cwd = process.cwd()
      try {
        const results = await syncBackendCoreMigrations(opts.dest, opts.schema, opts.force, cwd)
        console.log('Migrations sync results:')
        for (const r of results) {
          console.log(`- ${r.status} :: ${r.file}`)
        }
      } catch (error) {
        console.error('migrations:sync failed:', (error as Error).message)
        process.exitCode = 1
      }
    })
}

export async function syncBackendCoreRoutes(
  appDirInput: string,
  force: boolean = false,
  cwd: string = process.cwd()
): Promise<RouteSyncResult[]> {
  const appDir = path.resolve(cwd, appDirInput)
  const results: RouteSyncResult[] = []

  for (const route of ROUTES) {
    const targetDir = path.join(appDir, 'api', route.path)
    const targetFile = path.join(targetDir, 'route.ts')
    try {
      await fs.mkdir(targetDir, { recursive: true })
      const exists = await fileExists(targetFile)
      if (exists && !force) {
        results.push({ file: targetFile, status: 'skip (exists)' })
        continue
      }
      const content = buildProxy(route)
      await fs.writeFile(targetFile, content, 'utf8')
      results.push({ file: targetFile, status: exists ? 'overwritten' : 'created' })
    } catch (error) {
      results.push({ file: targetFile, status: `error: ${(error as Error).message}` })
    }
  }

  return results
}

export function listBackendCoreRoutes() {
  console.log('Available backend-core routes (relative to app/api):')
  ROUTES.forEach((route) => {
    console.log(`- ${route.path} [${route.methods.join(', ')}]`)
  })
}

export async function syncBackendCorePrisma(
  schemaPathInput: string,
  cwd: string = process.cwd()
): Promise<string> {
  const hostSchemaPath = path.resolve(cwd, schemaPathInput)
  const pkgSchemaPath = path.resolve(getBackendPackageRoot(cwd), 'prisma', 'schema.prisma')

  // Validate required files exist inside the installed backend-core package so third parties get a clear hint.
  await assertExists(
    pkgSchemaPath,
    `backend-core prisma/schema.prisma not found at ${pkgSchemaPath}. Ensure @windrun-huaiin/backend-core is installed and publishes prisma/ to npm.`
  )

  const [hostRaw, pkgRaw] = await Promise.all([
    fs.readFile(hostSchemaPath, 'utf8'),
    fs.readFile(pkgSchemaPath, 'utf8')
  ])

  const hostSchemaName = extractSchemaName(hostRaw)
  const pkgModels = extractModels(pkgRaw, hostSchemaName)

  if (!pkgModels.trim()) {
    return 'No models extracted from package schema, nothing to append.'
  }

  if (hostRaw.includes('=== backend-core models ===')) {
    return 'Marker already found in host schema, skipping append to avoid duplicates.'
  }

  const appended = [
    hostRaw.trimEnd(),
    '',
    '// === backend-core models ===',
    pkgModels.trim(),
    ''
  ].join('\n')

  await fs.writeFile(hostSchemaPath, appended, 'utf8')

  const schemaNote =
    hostSchemaName && hostSchemaName !== 'nextai'
      ? `Replaced @@schema("nextai") with @@schema("${hostSchemaName}")`
      : ''

  return ['Appended backend-core models to', hostSchemaPath, schemaNote].filter(Boolean).join(' ')
}

export async function syncBackendCoreMigrations(
  destDirInput: string,
  schemaName: string = 'nextai',
  force: boolean = false,
  cwd: string = process.cwd()
): Promise<RouteSyncResult[]> {
  const pkgRoot = getBackendPackageRoot(cwd)
  const sourceDir = path.join(pkgRoot, 'migrations')
  const destDir = path.resolve(cwd, destDirInput)

  await assertExists(
    sourceDir,
    `backend-core migrations folder not found at ${sourceDir}. Ensure the package publishes migrations/.`
  )
  await fs.mkdir(destDir, { recursive: true })

  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  const sqlFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.sql'))

  const results: RouteSyncResult[] = []
  for (const file of sqlFiles) {
    const from = path.join(sourceDir, file.name)
    const to = path.join(destDir, file.name)
    const exists = await fileExists(to)
    if (exists && !force) {
      results.push({ file: to, status: 'skip (exists)' })
      continue
    }

    // Read SQL content and replace schema name
    const sqlContent = await fs.readFile(from, 'utf8')
    const updatedContent = sqlContent.replace(/nextai\./g, `${schemaName}.`)

    await fs.writeFile(to, updatedContent, 'utf8')
    results.push({ file: to, status: exists ? 'overwritten' : 'copied' })
  }

  if (sqlFiles.length === 0) {
    results.push({ file: destDir, status: 'no migrations found in package' })
  }

  return results
}

function buildProxy(route: RouteDef): string {
  const exports = [
    ...route.methods.map((method) => `export { ${method} } from '${route.importPath}';`)
  ]
  const runtimeLine = route.runtime ? `export const runtime = '${route.runtime}';` : null
  return [
    '// Auto-generated by dev-scripts backend-core routes:sync',
    '// Do not edit manually unless you want to override the default handler.',
    ...exports,
    ...(runtimeLine ? [runtimeLine] : []),
    ''
  ].join('\n')
}

async function fileExists(file: string) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function assertExists(file: string, message: string) {
  const exists = await fileExists(file)
  if (!exists) {
    throw new Error(message)
  }
}

function getBackendPackageRoot(cwd: string): string {
  const resolver = createRequire(path.join(cwd, 'package.json'))
  try {
    const pkgJsonPath = resolver.resolve(`${PACKAGE_NAME}/package.json`)
    return path.dirname(pkgJsonPath)
  } catch (error) {
    const message =
      `Cannot resolve ${PACKAGE_NAME} from ${cwd}. ` +
      'Install the package or check your workspace configuration.'
    throw new Error(message)
  }
}

function extractSchemaName(schema: string): string {
  const schemaMatch = schema.match(/schema\s*=\s*"([^"]+)"/)
  if (schemaMatch) return schemaMatch[1]
  const schemasMatch = schema.match(/schemas\s*=\s*\[\s*"([^"]+)"/)
  if (schemasMatch) return schemasMatch[1]
  return 'nextai'
}

function extractModels(schema: string, targetSchemaName: string): string {
  const idx = schema.indexOf('model ')
  if (idx === -1) return ''
  const models = schema.slice(idx)
  return models.replace(/@@schema\("nextai"\)/g, `@@schema("${targetSchemaName}")`)
}
