#!/usr/bin/env node

/**
 * Performance Audit Script
 * Analyzes build output and provides performance recommendations
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class PerformanceAuditor {
    constructor() {
        this.distPath = path.resolve(__dirname, '../dist');
        this.results = {
            bundles: [],
            totalSize: 0,
            gzippedSize: 0,
            recommendations: [],
            performance: {
                score: 0,
                metrics: {}
            }
        };
    }

    async audit() {
        console.log('🔍 Starting Performance Audit...\n');

        try {
            // Check if dist folder exists
            if (!fs.existsSync(this.distPath)) {
                throw new Error('Dist folder not found. Please run "npm run build" first.');
            }

            // Analyze bundles
            await this.analyzeBundles();
            
            // Calculate performance score
            this.calculatePerformanceScore();
            
            // Generate recommendations
            this.generateRecommendations();
            
            // Display results
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Performance audit failed:', error.message);
            process.exit(1);
        }
    }

    async analyzeBundles() {
        const files = fs.readdirSync(this.distPath, { withFileTypes: true });
        
        for (const file of files) {
            if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.css'))) {
                const filePath = path.join(this.distPath, file.name);
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath);
                
                // Calculate gzipped size
                const gzippedSize = await this.getGzippedSize(content);
                
                const bundleInfo = {
                    name: file.name,
                    type: path.extname(file.name).slice(1),
                    size: stats.size,
                    sizeFormatted: this.formatBytes(stats.size),
                    gzippedSize: gzippedSize,
                    gzippedSizeFormatted: this.formatBytes(gzippedSize),
                    compressionRatio: ((stats.size - gzippedSize) / stats.size * 100).toFixed(1)
                };
                
                this.results.bundles.push(bundleInfo);
                this.results.totalSize += stats.size;
                this.results.gzippedSize += gzippedSize;
            }
        }
        
        // Sort bundles by size (largest first)
        this.results.bundles.sort((a, b) => b.size - a.size);
    }

    async getGzippedSize(content) {
        return new Promise((resolve, reject) => {
            zlib.gzip(content, (err, compressed) => {
                if (err) reject(err);
                else resolve(compressed.length);
            });
        });
    }

    calculatePerformanceScore() {
        let score = 100;
        const metrics = {};
        
        // Analyze main bundle size
        const mainBundle = this.results.bundles.find(b => b.name.includes('main'));
        if (mainBundle) {
            metrics.mainBundleSize = mainBundle.gzippedSize;
            if (mainBundle.gzippedSize > 150 * 1024) { // 150KB
                score -= 20;
            } else if (mainBundle.gzippedSize > 100 * 1024) { // 100KB
                score -= 10;
            }
        }
        
        // Analyze vendor bundle size
        const vendorBundle = this.results.bundles.find(b => b.name.includes('vendor'));
        if (vendorBundle) {
            metrics.vendorBundleSize = vendorBundle.gzippedSize;
            if (vendorBundle.gzippedSize > 300 * 1024) { // 300KB
                score -= 15;
            } else if (vendorBundle.gzippedSize > 200 * 1024) { // 200KB
                score -= 8;
            }
        }
        
        // Analyze total size
        metrics.totalGzippedSize = this.results.gzippedSize;
        if (this.results.gzippedSize > 500 * 1024) { // 500KB
            score -= 15;
        } else if (this.results.gzippedSize > 350 * 1024) { // 350KB
            score -= 8;
        }
        
        // Analyze number of bundles (fewer is better for HTTP/1.1)
        const jsBundles = this.results.bundles.filter(b => b.type === 'js');
        metrics.numberOfJSBundles = jsBundles.length;
        if (jsBundles.length > 8) {
            score -= 10;
        }
        
        // Analyze compression ratios
        const avgCompressionRatio = this.results.bundles.reduce((sum, b) => sum + parseFloat(b.compressionRatio), 0) / this.results.bundles.length;
        metrics.averageCompressionRatio = avgCompressionRatio;
        if (avgCompressionRatio < 60) { // Less than 60% compression
            score -= 5;
        }
        
        this.results.performance.score = Math.max(0, Math.round(score));
        this.results.performance.metrics = metrics;
    }

    generateRecommendations() {
        const recommendations = [];
        const { metrics } = this.results.performance;
        
        // Bundle size recommendations
        if (metrics.mainBundleSize > 150 * 1024) {
            recommendations.push({
                priority: 'high',
                category: 'Bundle Size',
                issue: 'Main bundle is too large',
                recommendation: 'Consider code splitting, lazy loading, or removing unused dependencies',
                impact: 'Slower initial page load'
            });
        }
        
        if (metrics.vendorBundleSize > 300 * 1024) {
            recommendations.push({
                priority: 'high',
                category: 'Bundle Size',
                issue: 'Vendor bundle is too large',
                recommendation: 'Audit dependencies, use tree shaking, or split large libraries',
                impact: 'Increased cache invalidation and slower downloads'
            });
        }
        
        if (metrics.totalGzippedSize > 500 * 1024) {
            recommendations.push({
                priority: 'medium',
                category: 'Total Size',
                issue: 'Total bundle size is large',
                recommendation: 'Implement aggressive code splitting and lazy loading',
                impact: 'Slower page loads, especially on slow connections'
            });
        }
        
        // Bundle count recommendations
        if (metrics.numberOfJSBundles > 8) {
            recommendations.push({
                priority: 'medium',
                category: 'Bundle Count',
                issue: 'Too many JavaScript bundles',
                recommendation: 'Consolidate smaller bundles or use HTTP/2 push',
                impact: 'Increased request overhead on HTTP/1.1'
            });
        }
        
        // Compression recommendations
        if (metrics.averageCompressionRatio < 60) {
            recommendations.push({
                priority: 'low',
                category: 'Compression',
                issue: 'Low compression ratio',
                recommendation: 'Enable better compression algorithms or minification',
                impact: 'Larger file sizes than necessary'
            });
        }
        
        // Check for common performance anti-patterns
        const largestBundles = this.results.bundles.slice(0, 3);
        largestBundles.forEach(bundle => {
            if (bundle.type === 'js' && bundle.gzippedSize > 200 * 1024) {
                recommendations.push({
                    priority: 'medium',
                    category: 'Large Bundle',
                    issue: `${bundle.name} is unusually large`,
                    recommendation: 'Investigate bundle contents and split if necessary',
                    impact: 'Delayed execution and parsing'
                });
            }
        });
        
        this.results.recommendations = recommendations;
    }

    displayResults() {
        console.log('📊 Performance Audit Results\n');
        
        // Performance Score
        const score = this.results.performance.score;
        const scoreEmoji = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';
        console.log(`${scoreEmoji} Performance Score: ${score}/100\n`);
        
        // Bundle Analysis
        console.log('📦 Bundle Analysis:');
        console.log('─'.repeat(80));
        console.log('File Name'.padEnd(30) + 'Original'.padEnd(12) + 'Gzipped'.padEnd(12) + 'Compression'.padEnd(12) + 'Type');
        console.log('─'.repeat(80));
        
        this.results.bundles.forEach(bundle => {
            console.log(
                bundle.name.padEnd(30) +
                bundle.sizeFormatted.padEnd(12) +
                bundle.gzippedSizeFormatted.padEnd(12) +
                `${bundle.compressionRatio}%`.padEnd(12) +
                bundle.type.toUpperCase()
            );
        });
        
        console.log('─'.repeat(80));
        console.log(
            'TOTAL'.padEnd(30) +
            this.formatBytes(this.results.totalSize).padEnd(12) +
            this.formatBytes(this.results.gzippedSize).padEnd(12) +
            `${((this.results.totalSize - this.results.gzippedSize) / this.results.totalSize * 100).toFixed(1)}%`.padEnd(12)
        );
        console.log('\n');
        
        // Recommendations
        if (this.results.recommendations.length > 0) {
            console.log('💡 Recommendations:');
            console.log('─'.repeat(80));
            
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            const sortedRecommendations = this.results.recommendations.sort((a, b) => 
                priorityOrder[a.priority] - priorityOrder[b.priority]
            );
            
            sortedRecommendations.forEach((rec, index) => {
                const priorityEmoji = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
                console.log(`${index + 1}. ${priorityEmoji} [${rec.category}] ${rec.issue}`);
                console.log(`   ${rec.recommendation}`);
                console.log(`   Impact: ${rec.impact}\n`);
            });
        } else {
            console.log('✅ No performance issues found!\n');
        }
        
        // Summary
        console.log('📈 Performance Summary:');
        console.log(`• Total bundles: ${this.results.bundles.length}`);
        console.log(`• JavaScript bundles: ${this.results.bundles.filter(b => b.type === 'js').length}`);
        console.log(`• CSS bundles: ${this.results.bundles.filter(b => b.type === 'css').length}`);
        console.log(`• Total size (gzipped): ${this.formatBytes(this.results.gzippedSize)}`);
        console.log(`• Average compression: ${this.results.performance.metrics.averageCompressionRatio?.toFixed(1)}%`);
        
        // Performance recommendations summary
        const highPriorityCount = this.results.recommendations.filter(r => r.priority === 'high').length;
        if (highPriorityCount > 0) {
            console.log(`\n⚠️  ${highPriorityCount} high-priority issue(s) found. Address these first for best performance gains.`);
        }
        
        console.log('\n🎯 Target Metrics:');
        console.log('• Main bundle: < 150KB (gzipped)');
        console.log('• Vendor bundle: < 300KB (gzipped)');
        console.log('• Total size: < 500KB (gzipped)');
        console.log('• Compression ratio: > 60%');
        console.log('\n✨ Audit complete!\n');
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Run the audit
const auditor = new PerformanceAuditor();
auditor.audit().catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
});