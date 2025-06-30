import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export async function easyChangeset(cwd: string = typeof process !== 'undefined' ? process.cwd() : '.') {
  // Environment check, DO NOT EXECUTE IN PRODUCTION ENVIRONMENT
  if (process.env.NODE_ENV === 'production') {
    console.log('❌ Production environment prohibits deep clean operations')
    console.log('    If you need to clean, please set: NODE_ENV=development')
    return 1
  }

  console.log('==============================')
  console.log(`‼️  Current working directory: ⭕  ${cwd}  ⭕`)
  console.log('==============================')
  
  const changesetDir = join(cwd, '.changeset')
  const mdxFile = join(changesetDir, 'd8-template.mdx')
  const mdFile = join(changesetDir, 'd8-template.md')

  if (!existsSync(changesetDir)) {
    console.log('❌ No .changeset directory found, skipping.')
    return 1
  }
  if (!existsSync(mdxFile)) {
    console.log('❌ No .changeset/d8-template.mdx file found, skipping.')
    return 1
  }
  try {
    const content = readFileSync(mdxFile, 'utf-8')
    writeFileSync(mdFile, content, 'utf-8')
    console.log('✅ Copied d8-template.mdx content to d8-template.md')
    return 0
  } catch (e: any) {
    console.log('❌ Copy failed:', e.message)
    return 1
  }
} 