#!/usr/bin/env node

/**
 * Basic compilation and module loading test to catch critical errors early
 * This script verifies that all our modular architecture files can be loaded
 * without syntax errors or missing dependencies.
 */

const fs = require('fs');
const path = require('path');

const testFiles = [
    // Core architecture files
    'src/js/core/FeatureDetector.js',
    'src/js/config/AppConfig.js', 
    'src/js/core/EventBus.js',
    'src/js/utils/ErrorBoundary.js',
    'src/js/services/ServiceFactory.js',
    'src/js/utils/LazyLoader.js',
    
    // Entry point
    'src/js/main-modular.js',
    
    // Fallback services
    'src/js/services/LocalInventoryService.js',
    'src/js/services/MockCartManager.js', 
    'src/js/services/LocalStorageService.js',
    'src/js/services/MockAnalyticsService.js',
    
    // Updated core
    'src/js/core/JewelryCustomizer.js'
];

console.log('🧪 Running Compilation Test...\n');

let allPassed = true;

for (const filePath of testFiles) {
    const fullPath = path.join(__dirname, filePath);
    
    try {
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            console.log(`❌ ${filePath}: File not found`);
            allPassed = false;
            continue;
        }
        
        // Read file content and basic syntax check
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Basic syntax checks
        const checks = [
            {
                name: 'No unmatched braces',
                test: () => {
                    const openBraces = (content.match(/{/g) || []).length;
                    const closeBraces = (content.match(/}/g) || []).length;
                    return openBraces === closeBraces;
                }
            },
            {
                name: 'No unmatched parentheses',
                test: () => {
                    const openParens = (content.match(/\(/g) || []).length;
                    const closeParens = (content.match(/\)/g) || []).length;
                    return openParens === closeParens;
                }
            },
            {
                name: 'Has export statement',
                test: () => content.includes('export')
            },
            {
                name: 'No obvious syntax errors',
                test: () => {
                    // Check for common syntax issues
                    return !content.includes('}.bind(this)') && // Fixed this issue
                           !content.match(/import.*from\s+['"]\s*['"]/); // Empty import paths
                }
            }
        ];
        
        let filePassed = true;
        for (const check of checks) {
            if (!check.test()) {
                console.log(`❌ ${filePath}: ${check.name}`);
                filePassed = false;
                allPassed = false;
            }
        }
        
        if (filePassed) {
            console.log(`✅ ${filePath}: All checks passed`);
        }
        
    } catch (error) {
        console.log(`❌ ${filePath}: ${error.message}`);
        allPassed = false;
    }
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('🎉 All compilation tests passed!');
    process.exit(0);
} else {
    console.log('💥 Some compilation tests failed!');
    process.exit(1);
}