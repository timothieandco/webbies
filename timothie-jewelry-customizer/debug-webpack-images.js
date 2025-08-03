// Debug script to analyze webpack image bundling
// Run this after npm run build to see what webpack generated

const fs = require('fs');
const path = require('path');

console.log('=== WEBPACK IMAGE BUNDLING DEBUG ===\n');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.error('❌ No dist directory found. Run "npm run build" first.');
    process.exit(1);
}

// Find all image files in dist
const imagesPath = path.join(distPath, 'images');
if (fs.existsSync(imagesPath)) {
    console.log('✅ Images directory found in dist/images\n');
    
    const imageFiles = fs.readdirSync(imagesPath);
    console.log(`Found ${imageFiles.length} bundled images:\n`);
    
    // Group by original name pattern
    const imageGroups = {};
    
    imageFiles.forEach(file => {
        // Extract original name from hash
        const match = file.match(/^(.+?)\.([a-f0-9]+)\.(jpg|jpeg|png|gif|webp)$/);
        if (match) {
            const originalName = match[1];
            const hash = match[2];
            const ext = match[3];
            
            if (!imageGroups[originalName]) {
                imageGroups[originalName] = [];
            }
            
            imageGroups[originalName].push({
                bundledName: file,
                hash,
                ext,
                size: fs.statSync(path.join(imagesPath, file)).size
            });
        }
    });
    
    // Display grouped results
    Object.entries(imageGroups).forEach(([originalName, files]) => {
        console.log(`📷 ${originalName}:`);
        files.forEach(file => {
            const sizeKB = (file.size / 1024).toFixed(1);
            console.log(`   → ${file.bundledName} (${sizeKB} KB)`);
        });
        console.log('');
    });
} else {
    console.error('❌ No images directory found in dist/');
}

// Check HTML files for image references
console.log('\n=== CHECKING HTML FILES ===\n');

const htmlFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.html'));

htmlFiles.forEach(htmlFile => {
    console.log(`📄 ${htmlFile}:`);
    const content = fs.readFileSync(path.join(distPath, htmlFile), 'utf8');
    
    // Find script tags
    const scriptMatches = content.match(/<script[^>]*src="([^"]+)"/g);
    if (scriptMatches) {
        console.log(`   Scripts: ${scriptMatches.length} found`);
    }
    
    // Find image references
    const imgMatches = content.match(/<img[^>]*src="([^"]*)"[^>]*>/g);
    if (imgMatches) {
        console.log(`   Images: ${imgMatches.length} <img> tags`);
        imgMatches.forEach(img => {
            const srcMatch = img.match(/src="([^"]*)"/);
            if (srcMatch && srcMatch[1]) {
                console.log(`     - src="${srcMatch[1] || '[empty]'}"`);
            }
        });
    }
    console.log('');
});

// Check for JavaScript bundles
console.log('\n=== JAVASCRIPT BUNDLES ===\n');

const jsFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.js'));
console.log(`Found ${jsFiles.length} JavaScript bundles:\n`);

jsFiles.forEach(file => {
    const stats = fs.statSync(path.join(distPath, file));
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`📦 ${file} (${sizeKB} KB)`);
});

console.log('\n=== END DEBUG ===');