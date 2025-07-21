import { copy, readJson, writeJson, remove, ensureDir } from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

export async function createDiaomaoApp(targetDir: string) {
  if (!targetDir) {
    console.error('Usage: create-diaomao-app <project-name>');
    process.exit(1);
  }
  
  const destDir = path.resolve(process.cwd(), targetDir);
  const tempDir = path.join(os.tmpdir(), `diaomao-template-${Date.now()}`);

  console.log(`Creating project: ${targetDir}...`);
  
  try {
    // create temp dir
    await ensureDir(tempDir);
    
    // download diaomao package from npm
    console.log('Downloading diaomao template from npm...');
    execSync(`npm pack @windrun-huaiin/diaomao`, { cwd: tempDir, stdio: 'inherit' });
    
    // unzip npm package
    const packageFiles = execSync('ls *.tgz', { cwd: tempDir, encoding: 'utf8' }).trim().split('\n');
    const packageFile = packageFiles[0];
    execSync(`tar -xzf ${packageFile}`, { cwd: tempDir });
    
    // copy template content (npm package unzip in package/ directory)
    const templateDir = path.join(tempDir, 'package');
    await copy(templateDir, destDir, { overwrite: true });
    
    // read and modify package.json
    const pkgPath = path.join(destDir, 'package.json');
    const pkg = await readJson(pkgPath);
    pkg.name = path.basename(targetDir);
    pkg.private = true;
    // remove publish related config
    delete pkg.publishConfig;
    delete pkg.files;
    await writeJson(pkgPath, pkg, { spaces: 2 });

    console.log('Installing dependencies...');
    
    // auto install dependencies
    try {
      execSync('pnpm install', { cwd: destDir, stdio: 'inherit' });
    } catch (error) {
      console.warn('pnpm failed, trying npm...');
      try {
        execSync('npm install', { cwd: destDir, stdio: 'inherit' });
      } catch (npmError) {
        console.error('Failed to install dependencies. Please run npm install or pnpm install manually.');
      }
    }

    console.log('Initializing Git repository...');
    
    // initialize git
    try {
      execSync('git init', { cwd: destDir, stdio: 'inherit' });
      execSync('git add .', { cwd: destDir, stdio: 'inherit' });
      execSync('git commit -m "feat: initial commit from diaomao template"', { cwd: destDir, stdio: 'inherit' });
    } catch (error) {
      console.warn('Failed to initialize Git repository. Please initialize manually.');
    }

    console.log(`\n✅ Project created: ${destDir}`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${targetDir}`);
    console.log(`  pnpm dev`);
    
  } catch (error) {
    console.error('Failed to create project:', error);
    process.exit(1);
  } finally {
    // clean up temp dir
    try {
      await remove(tempDir);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary directory:', tempDir);
    }
  }
} 