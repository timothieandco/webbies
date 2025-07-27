/**
 * ImageLoader - Handles async image loading with caching and error handling
 * Includes CORS support and performance optimization
 */

export default class ImageLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Load an image with caching and error handling
     */
    async loadImage(src, options = {}) {
        // Check cache first
        if (this.cache.has(src)) {
            return this.cache.get(src);
        }

        // Check if already loading
        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src);
        }

        // Create loading promise
        const loadingPromise = this.createLoadingPromise(src, options);
        this.loadingPromises.set(src, loadingPromise);

        try {
            const image = await loadingPromise;
            
            // Cache the loaded image
            this.cache.set(src, image);
            
            // Remove from loading promises
            this.loadingPromises.delete(src);
            
            return image;
        } catch (error) {
            // Remove failed promise
            this.loadingPromises.delete(src);
            throw error;
        }
    }

    /**
     * Create the actual loading promise
     */
    createLoadingPromise(src, options = {}) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // Set up event handlers
            img.onload = () => {
                console.log(`Image loaded successfully: ${src}`);
                resolve(img);
            };

            img.onerror = (error) => {
                console.error(`Failed to load image: ${src}`, error);
                reject(new Error(`Failed to load image: ${src}`));
            };

            // Handle CORS if needed
            if (options.crossOrigin || this.needsCORS(src)) {
                img.crossOrigin = options.crossOrigin || 'anonymous';
            }

            // Set timeout for loading
            const timeout = options.timeout || 10000; // 10 seconds default
            const timeoutId = setTimeout(() => {
                reject(new Error(`Image load timeout: ${src}`));
            }, timeout);

            // Clear timeout on load/error
            const clearTimeoutAndResolve = (result) => {
                clearTimeout(timeoutId);
                resolve(result);
            };

            const clearTimeoutAndReject = (error) => {
                clearTimeout(timeoutId);
                reject(error);
            };

            img.onload = () => clearTimeoutAndResolve(img);
            img.onerror = (error) => clearTimeoutAndReject(new Error(`Failed to load image: ${src}`));

            // Start loading
            img.src = src;
        });
    }

    /**
     * Preload multiple images
     */
    async preloadImages(sources, options = {}) {
        const promises = sources.map(src => this.loadImage(src, options));
        
        try {
            return await Promise.all(promises);
        } catch (error) {
            console.warn('Some images failed to preload:', error);
            
            // Return successful loads only if allowPartial is true
            if (options.allowPartial) {
                const results = await Promise.allSettled(promises);
                return results
                    .filter(result => result.status === 'fulfilled')
                    .map(result => result.value);
            }
            
            throw error;
        }
    }

    /**
     * Load image with retry mechanism
     */
    async loadImageWithRetry(src, options = {}) {
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.loadImage(src, options);
            } catch (error) {
                console.warn(`Image load attempt ${attempt} failed for ${src}:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retry
                await this.delay(retryDelay * attempt);
            }
        }
    }

    /**
     * Check if URL needs CORS handling
     */
    needsCORS(src) {
        try {
            const url = new URL(src, window.location.href);
            return url.origin !== window.location.origin;
        } catch {
            return false; // Invalid URL, assume no CORS needed
        }
    }

    /**
     * Create a data URL from an image for caching
     */
    imageToDataURL(image, format = 'image/png', quality = 1.0) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = image.width;
        canvas.height = image.height;
        
        ctx.drawImage(image, 0, 0);
        
        return canvas.toDataURL(format, quality);
    }

    /**
     * Clear image cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Image cache cleared');
    }

    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }

    /**
     * Get cached image if exists
     */
    getCachedImage(src) {
        return this.cache.get(src);
    }

    /**
     * Check if image is cached
     */
    isCached(src) {
        return this.cache.has(src);
    }

    /**
     * Remove specific image from cache
     */
    removeFromCache(src) {
        return this.cache.delete(src);
    }

    /**
     * Utility: Delay function for retries
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validate image dimensions
     */
    validateImageDimensions(image, options = {}) {
        const { minWidth, minHeight, maxWidth, maxHeight, aspectRatio } = options;
        
        if (minWidth && image.width < minWidth) {
            throw new Error(`Image width ${image.width} is less than minimum ${minWidth}`);
        }
        
        if (minHeight && image.height < minHeight) {
            throw new Error(`Image height ${image.height} is less than minimum ${minHeight}`);
        }
        
        if (maxWidth && image.width > maxWidth) {
            throw new Error(`Image width ${image.width} exceeds maximum ${maxWidth}`);
        }
        
        if (maxHeight && image.height > maxHeight) {
            throw new Error(`Image height ${image.height} exceeds maximum ${maxHeight}`);
        }
        
        if (aspectRatio) {
            const imageAspectRatio = image.width / image.height;
            const tolerance = aspectRatio.tolerance || 0.1;
            
            if (Math.abs(imageAspectRatio - aspectRatio.value) > tolerance) {
                throw new Error(`Image aspect ratio ${imageAspectRatio.toFixed(2)} does not match required ${aspectRatio.value}`);
            }
        }
        
        return true;
    }

    /**
     * Create thumbnail from image
     */
    createThumbnail(image, maxSize = 100) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate thumbnail dimensions
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        
        // Draw scaled image
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    /**
     * Batch load images with progress callback
     */
    async batchLoadImages(sources, options = {}) {
        const { onProgress, batchSize = 5 } = options;
        const results = [];
        const total = sources.length;
        let loaded = 0;

        // Process in batches to avoid overwhelming the browser
        for (let i = 0; i < sources.length; i += batchSize) {
            const batch = sources.slice(i, i + batchSize);
            const batchPromises = batch.map(async (src) => {
                try {
                    const image = await this.loadImage(src, options);
                    loaded++;
                    
                    if (onProgress) {
                        onProgress(loaded, total, src);
                    }
                    
                    return { src, image, success: true };
                } catch (error) {
                    loaded++;
                    
                    if (onProgress) {
                        onProgress(loaded, total, src, error);
                    }
                    
                    return { src, error, success: false };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Memory management - clean up old cache entries
     */
    cleanupCache(maxAge = 3600000) { // 1 hour default
        const now = Date.now();
        const keysToDelete = [];

        for (const [src, data] of this.cache) {
            if (data.timestamp && (now - data.timestamp) > maxAge) {
                keysToDelete.push(src);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
        
        if (keysToDelete.length > 0) {
            console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
        }
    }
}