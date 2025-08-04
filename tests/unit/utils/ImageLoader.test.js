/**
 * ImageLoader Unit Tests
 * Tests image loading, caching, error handling, and utility functions
 */

import ImageLoader from '../../../src/js/utils/ImageLoader.js';

// Mock Image constructor
class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.crossOrigin = null;
    this.src = '';
    this.width = 100;
    this.height = 100;
    
    // Simulate async loading
    setTimeout(() => {
      if (this.src.includes('error')) {
        this.onerror && this.onerror(new Error('Mock error'));
      } else if (this.src.includes('timeout')) {
        // Don't trigger onload or onerror for timeout testing
      } else {
        this.onload && this.onload();
      }
    }, 10);
  }
}

// Mock DOM elements
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
  })),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock-data')
};

const mockDocument = {
  createElement: jest.fn((tagName) => {
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          drawImage: jest.fn(),
        })),
        toDataURL: jest.fn(() => 'data:image/png;base64,mock-data')
      };
    }
    return {};
  })
};

// Mock window and location
const mockWindow = {
  location: {
    href: 'https://example.com/app',
    origin: 'https://example.com'
  }
};

describe('ImageLoader', () => {
  let imageLoader;
  let originalImage;
  let originalDocument;
  let originalWindow;

  beforeAll(() => {
    // Store originals
    originalImage = global.Image;
    originalDocument = global.document;
    originalWindow = global.window;
    
    // Set up mocks
    global.Image = MockImage;
    global.document = mockDocument;
    global.window = mockWindow;
  });

  afterAll(() => {
    // Restore originals
    global.Image = originalImage;
    global.document = originalDocument;
    global.window = originalWindow;
  });

  beforeEach(() => {
    imageLoader = new ImageLoader();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Constructor', () => {
    test('should initialize with empty cache and loading promises', () => {
      expect(imageLoader.cache).toBeInstanceOf(Map);
      expect(imageLoader.loadingPromises).toBeInstanceOf(Map);
      expect(imageLoader.cache.size).toBe(0);
      expect(imageLoader.loadingPromises.size).toBe(0);
    });
  });

  describe('Image Loading', () => {
    test('should load image successfully', async () => {
      const src = 'https://example.com/image.png';
      
      const promise = imageLoader.loadImage(src);
      jest.advanceTimersByTime(20);
      
      const image = await promise;
      
      expect(image).toBeInstanceOf(MockImage);
      expect(image.src).toBe(src);
      expect(imageLoader.cache.has(src)).toBe(true);
      expect(imageLoader.loadingPromises.has(src)).toBe(false);
    });

    test('should return cached image on subsequent loads', async () => {
      const src = 'https://example.com/image.png';
      
      // First load
      const promise1 = imageLoader.loadImage(src);
      jest.advanceTimersByTime(20);
      const image1 = await promise1;
      
      // Second load (should use cache)
      const image2 = await imageLoader.loadImage(src);
      
      expect(image1).toBe(image2);
      expect(imageLoader.cache.size).toBe(1);
    });

    test('should handle concurrent loading of same image', async () => {
      const src = 'https://example.com/image.png';
      
      // Start two concurrent loads
      const promise1 = imageLoader.loadImage(src);
      const promise2 = imageLoader.loadImage(src);
      
      jest.advanceTimersByTime(20);
      
      const [image1, image2] = await Promise.all([promise1, promise2]);
      
      expect(image1).toBe(image2);
      expect(imageLoader.cache.size).toBe(1);
      expect(imageLoader.loadingPromises.size).toBe(0);
    });

    test('should handle image loading errors', async () => {
      const src = 'https://example.com/error-image.png';
      
      const promise = imageLoader.loadImage(src);
      jest.advanceTimersByTime(20);
      
      await expect(promise).rejects.toThrow('Failed to load image: https://example.com/error-image.png');
      expect(imageLoader.cache.has(src)).toBe(false);
      expect(imageLoader.loadingPromises.has(src)).toBe(false);
    });

    test('should handle image loading timeout', async () => {
      const src = 'https://example.com/timeout-image.png';
      
      const promise = imageLoader.loadImage(src, { timeout: 5000 });
      jest.advanceTimersByTime(6000);
      
      await expect(promise).rejects.toThrow('Image load timeout: https://example.com/timeout-image.png');
      expect(imageLoader.loadingPromises.has(src)).toBe(false);
    });

    test('should set crossOrigin when needed', async () => {
      const src = 'https://other-domain.com/image.png';
      
      const promise = imageLoader.loadImage(src);
      jest.advanceTimersByTime(20);
      
      await promise;
      
      // The mock should have crossOrigin set for cross-origin URLs
      expect(imageLoader.needsCORS(src)).toBe(true);
    });

    test('should respect custom crossOrigin option', async () => {
      const src = 'https://example.com/image.png';
      
      const promise = imageLoader.loadImage(src, { crossOrigin: 'use-credentials' });
      jest.advanceTimersByTime(20);
      
      await promise;
      
      // Should work without errors
      expect(imageLoader.cache.has(src)).toBe(true);
    });
  });

  describe('Preloading', () => {
    test('should preload multiple images', async () => {
      const sources = [
        'https://example.com/image1.png',
        'https://example.com/image2.png',
        'https://example.com/image3.png'
      ];
      
      const promise = imageLoader.preloadImages(sources);
      jest.advanceTimersByTime(20);
      
      const images = await promise;
      
      expect(images).toHaveLength(3);
      expect(imageLoader.cache.size).toBe(3);
      sources.forEach(src => {
        expect(imageLoader.cache.has(src)).toBe(true);
      });
    });

    test('should handle partial failures with allowPartial option', async () => {
      const sources = [
        'https://example.com/image1.png',
        'https://example.com/error-image.png',
        'https://example.com/image3.png'
      ];
      
      const promise = imageLoader.preloadImages(sources, { allowPartial: true });
      jest.advanceTimersByTime(20);
      
      const images = await promise;
      
      expect(images).toHaveLength(2); // Only successful loads
      expect(imageLoader.cache.size).toBe(2);
    });

    test('should reject all if allowPartial is false and one fails', async () => {
      const sources = [
        'https://example.com/image1.png',
        'https://example.com/error-image.png',
        'https://example.com/image3.png'
      ];
      
      const promise = imageLoader.preloadImages(sources, { allowPartial: false });
      jest.advanceTimersByTime(20);
      
      await expect(promise).rejects.toThrow();
    });
  });

  describe('Retry Mechanism', () => {
    test('should retry failed image loads', async () => {
      const src = 'https://example.com/error-image.png';
      
      const promise = imageLoader.loadImageWithRetry(src, { maxRetries: 2, retryDelay: 10 });
      
      // Advance through all attempts quickly
      jest.advanceTimersByTime(5000);
      
      await expect(promise).rejects.toThrow();
    });

    test('should succeed on retry if image loads', async () => {
      // Mock a scenario where the image fails first but succeeds on retry
      let attemptCount = 0;
      const originalMockImage = global.Image;
      
      global.Image = class extends MockImage {
        constructor() {
          super();
          attemptCount++;
          setTimeout(() => {
            if (attemptCount === 1) {
              this.onerror && this.onerror(new Error('First attempt fails'));
            } else {
              this.onload && this.onload();
            }
          }, 10);
        }
      };
      
      const src = 'https://example.com/retry-image.png';
      
      const promise = imageLoader.loadImageWithRetry(src, { maxRetries: 2, retryDelay: 100 });
      jest.advanceTimersByTime(20);
      
      // First attempt fails, advance time for retry
      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(20);
      
      const image = await promise;
      
      expect(image).toBeInstanceOf(MockImage);
      expect(imageLoader.cache.has(src)).toBe(true);
      
      // Restore original mock
      global.Image = originalMockImage;
    });
  });

  describe('CORS Detection', () => {
    test('should detect when CORS is needed for cross-origin URLs', () => {
      expect(imageLoader.needsCORS('https://other-domain.com/image.png')).toBe(true);
      expect(imageLoader.needsCORS('https://example.com/')).toBe(false); // Same origin
      expect(imageLoader.needsCORS('/local/image.png')).toBe(false);
    });

    test('should handle invalid URLs gracefully', () => {
      expect(imageLoader.needsCORS('invalid-url')).toBe(false);
      expect(imageLoader.needsCORS('')).toBe(false);
    });
  });

  describe('Cache Management', () => {
    test('should get cache size', () => {
      expect(imageLoader.getCacheSize()).toBe(0);
      
      imageLoader.cache.set('image1', new MockImage());
      imageLoader.cache.set('image2', new MockImage());
      
      expect(imageLoader.getCacheSize()).toBe(2);
    });

    test('should check if image is cached', () => {
      const src = 'https://example.com/image.png';
      
      expect(imageLoader.isCached(src)).toBe(false);
      
      imageLoader.cache.set(src, new MockImage());
      
      expect(imageLoader.isCached(src)).toBe(true);
    });

    test('should get cached image', () => {
      const src = 'https://example.com/image.png';
      const mockImage = new MockImage();
      
      expect(imageLoader.getCachedImage(src)).toBeUndefined();
      
      imageLoader.cache.set(src, mockImage);
      
      expect(imageLoader.getCachedImage(src)).toBe(mockImage);
    });

    test('should remove image from cache', () => {
      const src = 'https://example.com/image.png';
      imageLoader.cache.set(src, new MockImage());
      
      expect(imageLoader.isCached(src)).toBe(true);
      
      const removed = imageLoader.removeFromCache(src);
      
      expect(removed).toBe(true);
      expect(imageLoader.isCached(src)).toBe(false);
    });

    test('should clear entire cache', () => {
      imageLoader.cache.set('image1', new MockImage());
      imageLoader.cache.set('image2', new MockImage());
      
      expect(imageLoader.getCacheSize()).toBe(2);
      
      imageLoader.clearCache();
      
      expect(imageLoader.getCacheSize()).toBe(0);
    });

    test('should cleanup old cache entries', () => {
      const now = Date.now();
      const oldImage = { timestamp: now - 7200000 }; // 2 hours old
      const newImage = { timestamp: now - 1800000 }; // 30 minutes old
      
      imageLoader.cache.set('old-image', oldImage);
      imageLoader.cache.set('new-image', newImage);
      
      imageLoader.cleanupCache(3600000); // 1 hour max age
      
      expect(imageLoader.cache.has('old-image')).toBe(false);
      expect(imageLoader.cache.has('new-image')).toBe(true);
    });
  });

  describe('Image Utilities', () => {
    test('should convert image to data URL', () => {
      const mockImage = new MockImage();
      mockImage.width = 200;
      mockImage.height = 150;
      
      const dataURL = imageLoader.imageToDataURL(mockImage);
      
      // Should return a data URL (mocked)
      expect(dataURL).toBe('data:image/png;base64,mock-data');
    });

    test('should convert image to data URL with custom format and quality', () => {
      const mockImage = new MockImage();
      
      const result = imageLoader.imageToDataURL(mockImage, 'image/jpeg', 0.8);
      
      // Should handle custom parameters and return data URL
      expect(result).toBe('data:image/png;base64,mock-data');
    });

    test('should create thumbnail from image', () => {
      const mockImage = new MockImage();
      mockImage.width = 400;
      mockImage.height = 300;
      
      const thumbnail = imageLoader.createThumbnail(mockImage, 100);
      
      // Should return a thumbnail data URL
      expect(thumbnail).toBe('data:image/png;base64,mock-data');
    });
  });

  describe('Image Validation', () => {
    test('should validate image dimensions successfully', () => {
      const mockImage = new MockImage();
      mockImage.width = 200;
      mockImage.height = 150;
      
      const result = imageLoader.validateImageDimensions(mockImage, {
        minWidth: 100,
        minHeight: 100,
        maxWidth: 300,
        maxHeight: 200
      });
      
      expect(result).toBe(true);
    });

    test('should throw error for image below minimum width', () => {
      const mockImage = new MockImage();
      mockImage.width = 50;
      mockImage.height = 150;
      
      expect(() => {
        imageLoader.validateImageDimensions(mockImage, { minWidth: 100 });
      }).toThrow('Image width 50 is less than minimum 100');
    });

    test('should throw error for image below minimum height', () => {
      const mockImage = new MockImage();
      mockImage.width = 200;
      mockImage.height = 50;
      
      expect(() => {
        imageLoader.validateImageDimensions(mockImage, { minHeight: 100 });
      }).toThrow('Image height 50 is less than minimum 100');
    });

    test('should throw error for image above maximum width', () => {
      const mockImage = new MockImage();
      mockImage.width = 400;
      mockImage.height = 150;
      
      expect(() => {
        imageLoader.validateImageDimensions(mockImage, { maxWidth: 300 });
      }).toThrow('Image width 400 exceeds maximum 300');
    });

    test('should throw error for image above maximum height', () => {
      const mockImage = new MockImage();
      mockImage.width = 200;
      mockImage.height = 300;
      
      expect(() => {
        imageLoader.validateImageDimensions(mockImage, { maxHeight: 200 });
      }).toThrow('Image height 300 exceeds maximum 200');
    });

    test('should validate aspect ratio', () => {
      const mockImage = new MockImage();
      mockImage.width = 400;
      mockImage.height = 300; // 4:3 aspect ratio (1.33)
      
      const result = imageLoader.validateImageDimensions(mockImage, {
        aspectRatio: { value: 1.33, tolerance: 0.1 }
      });
      
      expect(result).toBe(true);
    });

    test('should throw error for incorrect aspect ratio', () => {
      const mockImage = new MockImage();
      mockImage.width = 400;
      mockImage.height = 200; // 2:1 aspect ratio (2.0)
      
      expect(() => {
        imageLoader.validateImageDimensions(mockImage, {
          aspectRatio: { value: 1.33, tolerance: 0.1 }
        });
      }).toThrow('Image aspect ratio 2.00 does not match required 1.33');
    });
  });

  describe('Batch Loading', () => {
    test('should batch load images with progress callback', async () => {
      const sources = [
        'https://example.com/image1.png',
        'https://example.com/image2.png',
        'https://example.com/image3.png'
      ];
      
      const progressCallback = jest.fn();
      
      const promise = imageLoader.batchLoadImages(sources, {
        onProgress: progressCallback,
        batchSize: 2
      });
      
      jest.advanceTimersByTime(20);
      
      const results = await promise;
      
      expect(results).toHaveLength(3);
      expect(progressCallback).toHaveBeenCalled();
      
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.image).toBeInstanceOf(MockImage);
      });
    });

    test('should handle batch loading with some failures', async () => {
      const sources = [
        'https://example.com/image1.png',
        'https://example.com/error-image.png',
        'https://example.com/image3.png'
      ];
      
      const progressCallback = jest.fn();
      
      const promise = imageLoader.batchLoadImages(sources, {
        onProgress: progressCallback
      });
      
      jest.advanceTimersByTime(20);
      
      const results = await promise;
      
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      
      expect(progressCallback).toHaveBeenCalledWith(
        2,
        3,
        'https://example.com/error-image.png',
        expect.any(Error)
      );
    });
  });

  describe('Utility Functions', () => {
    test('should implement delay function', async () => {
      const start = Date.now();
      
      const promise = imageLoader.delay(100);
      jest.advanceTimersByTime(100);
      
      await promise;
      
      // The delay should have completed
      expect(Date.now() - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      global.Image = class extends MockImage {
        constructor() {
          super();
          setTimeout(() => {
            this.onerror && this.onerror(new Error('Network error'));
          }, 10);
        }
      };
      
      const src = 'https://example.com/network-error.png';
      
      const promise = imageLoader.loadImage(src);
      jest.advanceTimersByTime(20);
      
      await expect(promise).rejects.toThrow('Failed to load image: https://example.com/network-error.png');
    });

    test('should clean up failed loading promises', async () => {
      const src = 'https://example.com/error-image.png';
      
      const promise = imageLoader.loadImage(src);
      jest.advanceTimersByTime(20);
      
      try {
        await promise;
      } catch (error) {
        // Expected to throw
      }
      
      expect(imageLoader.loadingPromises.has(src)).toBe(false);
    });
  });

  describe('Performance Considerations', () => {
    test('should not load same image multiple times simultaneously', async () => {
      const src = 'https://example.com/image.png';
      
      // Start multiple loads of the same image
      const promises = [
        imageLoader.loadImage(src),
        imageLoader.loadImage(src),
        imageLoader.loadImage(src)
      ];
      
      expect(imageLoader.loadingPromises.size).toBe(1);
      
      jest.advanceTimersByTime(20);
      
      const images = await Promise.all(promises);
      
      // All should return the same image instance
      expect(images[0]).toBe(images[1]);
      expect(images[1]).toBe(images[2]);
      expect(imageLoader.cache.size).toBe(1);
    });

    test('should handle large batch sizes efficiently', async () => {
      const sources = Array.from({ length: 10 }, (_, i) => `https://example.com/image${i}.png`);
      
      const promise = imageLoader.batchLoadImages(sources, { batchSize: 5 });
      jest.advanceTimersByTime(20);
      
      const results = await promise;
      
      expect(results).toHaveLength(10);
      expect(imageLoader.cache.size).toBeGreaterThan(5);
    });
  });
});