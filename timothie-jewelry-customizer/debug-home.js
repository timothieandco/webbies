// Debug script to check image loading on home page
// Run this in the browser console on http://localhost:3000/home.html

console.log('=== HOME PAGE IMAGE DEBUG ===');

// Check if homeImages module is loaded
if (typeof homeImages !== 'undefined') {
    console.log('✓ homeImages variable found globally');
} else {
    console.log('✗ homeImages not found globally');
}

// Check for nav logo
const navLogo = document.querySelector('.nav-logo');
console.log('Nav Logo:', navLogo ? navLogo.src || 'src is empty' : 'element not found');

// Check hero background CSS
const heroBackground = document.querySelector('.hero-background');
if (heroBackground) {
    const bgImage = window.getComputedStyle(heroBackground).backgroundImage;
    console.log('Hero Background CSS:', bgImage);
}

// Check CSS custom property
const rootStyles = window.getComputedStyle(document.documentElement);
const heroBgVar = rootStyles.getPropertyValue('--hero-bg-image');
console.log('CSS Variable --hero-bg-image:', heroBgVar || 'not set');

// Check step images
document.querySelectorAll('.step-image').forEach((img, i) => {
    console.log(`Step Image ${i + 1}:`, img.src || 'src is empty');
});

// Check product images
document.querySelectorAll('.product-image').forEach((img, i) => {
    console.log(`Product Image ${i + 1}:`, img.src || 'src is empty');
});

// Check about image
const aboutImage = document.querySelector('.about-image');
console.log('About Image:', aboutImage ? aboutImage.src || 'src is empty' : 'element not found');

// Try to access webpack modules
try {
    // This might work if webpack exposes modules
    const modules = __webpack_require__.m;
    console.log('Webpack modules available:', Object.keys(modules).length);
} catch (e) {
    console.log('Cannot access webpack modules directly');
}

console.log('=== END DEBUG ===');