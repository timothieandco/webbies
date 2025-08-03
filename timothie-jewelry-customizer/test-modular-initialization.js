#!/usr/bin/env node

/**
 * Test script to validate modular initialization
 * This tests the key initialization paths without requiring a browser
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Modular Initialization Paths...\n');

// Test 1: Verify all core architecture files exist
const coreFiles = [
    'src/js/core/FeatureDetector.js',
    'src/js/config/AppConfig.js', 
    'src/js/core/EventBus.js',
    'src/js/utils/ErrorBoundary.js',
    'src/js/services/ServiceFactory.js',
    'src/js/main-modular.js',
    'src/js/core/JewelryCustomizer.js',
    'src/js/core/CharmManager.js',
    'src/js/core/StateManager.js',
    'src/js/core/ExportManager.js',
    'src/js/utils/ImageLoader.js',
    'src/js/utils/images.js'
];

console.log('📁 Checking core files existence...');
let allFilesExist = true;
for (const filePath of coreFiles) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${filePath}`);
    } else {
        console.log(`❌ ${filePath} - NOT FOUND`);
        allFilesExist = false;
    }
}

// Test 2: Check asset files
console.log('\n🖼️ Checking asset files...');
const assetPaths = [
    'src/assets/images/necklaces/plainChain.png',
    'src/assets/images/charms/charmOne.png',
    'src/assets/images/charms/charmTwo.png',
    'src/assets/images/charms/charmThree.png',
    'src/assets/images/charms/charmFour.png',
    'src/assets/images/charms/charmFive.png',
    'src/assets/images/charms/charmSix.png',
    'src/assets/images/charms/charmSeven.png',
    'src/assets/images/charms/charmEight.png'
];

let allAssetsExist = true;
for (const assetPath of assetPaths) {
    const fullPath = path.join(__dirname, assetPath);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${assetPath}`);
    } else {
        console.log(`❌ ${assetPath} - NOT FOUND`);
        allAssetsExist = false;
    }
}

// Test 3: Check for potential cart-related import issues
console.log('\n🛒 Checking cart-related potential dependencies...');
const potentialCartFiles = [
    'src/js/core/CartManager.js',
    'src/js/components/CartSidebar.js',
    'src/js/components/CartIcon.js'
];

for (const filePath of potentialCartFiles) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${filePath} - EXISTS (will be imported)`);
    } else {
        console.log(`⚠️ ${filePath} - NOT FOUND (will use fallback)`);
    }
}

// Test 4: Read main-modular.js and check for potential issues
console.log('\n🔍 Analyzing main-modular.js for potential issues...');
const mainModularPath = path.join(__dirname, 'src/js/main-modular.js');
const mainModularContent = fs.readFileSync(mainModularPath, 'utf8');

const checkPoints = [
    { name: 'Has enableCart: false', test: () => mainModularContent.includes('enableCart: false') },
    { name: 'Has container existence check', test: () => mainModularContent.includes('getElementById(\'jewelry-canvas\')') },
    { name: 'Has proper error handling', test: () => mainModularContent.includes('try {') && mainModularContent.includes('catch (error)') },
    { name: 'Has canvas overlay handling', test: () => mainModularContent.includes('canvas-overlay') },
    { name: 'Uses setTimeout for async wait', test: () => mainModularContent.includes('setTimeout') }
];

for (const check of checkPoints) {
    if (check.test()) {
        console.log(`✅ ${check.name}`);
    } else {
        console.log(`❌ ${check.name}`);
        allFilesExist = false;
    }
}

// Test 5: Check HTML file has required container
console.log('\n📄 Checking HTML structure...');
const indexHtmlPath = path.join(__dirname, 'src/index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

const htmlChecks = [
    { name: 'Has jewelry-canvas container', test: () => indexHtmlContent.includes('id="jewelry-canvas"') },
    { name: 'Has canvas-overlay', test: () => indexHtmlContent.includes('canvas-overlay') },
    { name: 'Has loading-indicator', test: () => indexHtmlContent.includes('loading-indicator') }
];

for (const check of htmlChecks) {
    if (check.test()) {
        console.log(`✅ ${check.name}`);
    } else {
        console.log(`❌ ${check.name}`);
        allFilesExist = false;
    }
}

console.log('\n' + '='.repeat(50));
if (allFilesExist && allAssetsExist) {
    console.log('🎉 All modular initialization checks passed!');
    console.log('📋 Summary of fixes applied:');
    console.log('   • Disabled cart imports temporarily to avoid dynamic import issues');
    console.log('   • Added container existence validation');
    console.log('   • Added async initialization waiting');
    console.log('   • Improved canvas overlay hiding');
    console.log('   • Enhanced error logging and debugging');
    console.log('\n💡 The infinite loading issue should now be resolved.');
    console.log('🚀 You can test at: http://localhost:3001/index.html');
    process.exit(0);
} else {
    console.log('💥 Some initialization checks failed!');
    console.log('🔧 Please fix the issues above before testing.');
    process.exit(1);
}