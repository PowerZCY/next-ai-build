#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 🛡️ Only for development
function checkEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    console.log('❌ Production environment prohibits deep clean operations');
    console.log('    If you need to clean, please set: NODE_ENV=development');
    process.exit(1);
  }
}

// 🧹 Safe delete function
async function safeRemove(pattern, description) {
  try {
    const matches = await glob(pattern);
    let deletedCount = 0;
    
    for (const dirPath of matches) {
      if (fs.existsSync(dirPath)) {
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
          try {
            // Try to delete the directory completely
            fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
            
            // Verify if the deletion was successful
            if (fs.existsSync(dirPath)) {
              console.log(`⚠️  ${dirPath}: directory still exists, trying force delete...`);
              // Second attempt: empty the content first, then delete the directory
              const files = fs.readdirSync(dirPath);
              for (const file of files) {
                const filePath = path.join(dirPath, file);
                fs.rmSync(filePath, { recursive: true, force: true });
              }
              fs.rmdirSync(dirPath);
            }
            
            // Final verification
            if (!fs.existsSync(dirPath)) {
              console.log(`✅ Deleted: ${dirPath}`);
              deletedCount++;
            } else {
              console.log(`❌ Deletion failed: ${dirPath} (directory still exists)`);
            }
          } catch (deleteError) {
            console.log(`❌ Deletion failed: ${dirPath} (${deleteError.message})`);
          }
        }
      }
    }
    
    if (deletedCount === 0) {
      console.log(`⚪ ${description}: no need to clean`);
    } else {
      console.log(`🎯 ${description}: cleaned ${deletedCount} directories`);
    }
  } catch (error) {
    console.log(`⚠️  ${description}: skipped (${error.message})`);
  }
}

// 🚀 Main cleanup function
async function deepClean() {
  console.log('🧹 Starting deep clean...\n');
  
  // Define cleanup targets
  const cleanTargets = [
    { pattern: 'node_modules', description: 'Root directory dependencies' },
    { pattern: 'packages/*/node_modules', description: 'Package dependencies' },
    { pattern: 'apps/*/node_modules', description: 'Application dependencies' },
    { pattern: 'apps/*/.next', description: 'Next.js cache' },
    { pattern: 'packages/*/dist', description: 'Package build artifacts' },
    { pattern: 'apps/*/dist', description: 'Application build artifacts' },
    { pattern: '.turbo', description: 'Root directory Turbo cache' },
    { pattern: 'packages/*/.turbo', description: 'Package Turbo cache' },
    { pattern: 'apps/*/.turbo', description: 'Application Turbo cache' }
  ];
  
  // Execute cleanup
  for (const target of cleanTargets) {
    await safeRemove(target.pattern, target.description);
  }
  
  console.log('\n🎉 Deep clean completed!');
  console.log('💡 Next: pnpm install');
}

// 🔧 Main program
async function main() {
  try {
    checkEnvironment();
    await deepClean();
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

main(); 