import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../');
const sharedAssetsPath = path.resolve(__dirname, '../public');

/**
 * Common target detection: does not depend on specific application names
 */
function detectTargetApps(): string[] {
  // Method 1: Specify target via environment variable
  const targetApp = process.env.TARGET_APP;
  if (targetApp) {
    console.log(`📍 Environment variable specifies target: ${targetApp}`);
    return [`apps/${targetApp}`];
  }
  
  // Method 2: Detect via current working directory (most reliable)
  const cwd = process.cwd();
  const appMatch = cwd.match(/\/apps\/([^\/]+)/);
  if (appMatch) {
    const appName = appMatch[1];
    console.log(`📍 Detected application directory: ${appName}`);
    return [`apps/${appName}`];
  }
  
  // Method 3: Check INIT_CWD (pnpm's initial directory)
  const initCwd = process.env.INIT_CWD;
  if (initCwd) {
    const initAppMatch = initCwd.match(/\/apps\/([^\/]+)/);
    if (initAppMatch) {
      const appName = initAppMatch[1];
      console.log(`📍 Detected initial directory: ${appName}`);
      return [`apps/${appName}`];
    }
  }
  
  // Default case: scan all apps directories (generic solution)
  const allApps = glob.sync('apps/*', { cwd: repoRoot }).filter(dir => {
    // Ensure it's a valid application with package.json
    const packageJsonPath = path.join(repoRoot, dir, 'package.json');
    return fs.existsSync(packageJsonPath);
  });
  
  console.log(`📍 Full build mode: ${allApps.length} applications`);
  console.log(`🎯 Detected applications: ${allApps.join(', ')}`);
  return allApps;
}

async function copySharedAssets(): Promise<void> {
  // Smartly get target application list
  const appDirs = detectTargetApps();
  
  console.log(`🕒 Current time: ${new Date().toLocaleTimeString()}`);
  console.log('🚀 Start copying shared static assets...');
  console.log(`🎯 Target applications: ${appDirs.join(', ')}`);
  
  for (const appDir of appDirs) {
    const appPath = path.join(repoRoot, appDir);
    const publicPath = path.join(appPath, 'public');
    const sharedPublicPath = path.join(publicPath, 'shared');
    
    try {
      // Ensure public directory exists
      await fs.ensureDir(publicPath);
      
      // Ensure shared directory exists
      await fs.ensureDir(sharedPublicPath);
      
      // Empty and copy shared resources
      if (await fs.pathExists(sharedAssetsPath)) {
        // Empty target directory
        await fs.emptyDir(sharedPublicPath);
        console.log(`🗑️  Clearing ${appDir}/public/shared`);
        
        // Copy shared resources to shared directory
        await fs.copy(sharedAssetsPath, sharedPublicPath, { overwrite: true });
        console.log(`✅ Copied to ${appDir}/public/shared`);
      }
      
    } catch (error) {
      console.error(`❌ Copying to ${appDir} failed:`, error);
    }
  }
  
  console.log('🎉 Shared assets copied successfully!');
}

async function watchMode(): Promise<void> {
  console.log('👀 Starting watch mode...');
  
  // Initial copy
  await copySharedAssets();
  
  // Watch for shared assets changes
  const watcher = chokidar.watch(sharedAssetsPath, {
    ignored: /node_modules/,
    persistent: true
  });
  
  watcher.on('change', async (filePath) => {
    console.log(`📝 Detected file change: ${path.relative(sharedAssetsPath, filePath)}`);
    await copySharedAssets();
  });
  
  watcher.on('add', async (filePath) => {
    console.log(`➕ Detected new file: ${path.relative(sharedAssetsPath, filePath)}`);
    await copySharedAssets();
  });
  
  watcher.on('unlink', async (filePath) => {
    console.log(`➖ Detected file deletion: ${path.relative(sharedAssetsPath, filePath)}`);
    await copySharedAssets();
  });
  
  console.log('✨ Watch mode started, press Ctrl+C to exit');
}

// Main execution logic
const isWatchMode = process.argv.includes('--watch');

if (isWatchMode) {
  watchMode().catch(console.error);
} else {
  copySharedAssets().catch(console.error);
}

export { copySharedAssets }; 