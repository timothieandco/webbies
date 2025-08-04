/**
 * Jest Canvas Setup - Runs before test environment setup
 * Configures canvas mocking and Konva.js compatibility
 */

// Mock canvas context for Konva.js
const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    canvas: {
      width: 1000,
      height: 750,
      style: {},
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({
        left: 0,
        top: 0,
        right: 1000,
        bottom: 750,
        width: 1000,
        height: 750,
        x: 0,
        y: 0
      }))
    },
    // Additional context properties
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0
  })),
  width: 1000,
  height: 750,
  style: {},
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    right: 1000,
    bottom: 750,
    width: 1000,
    height: 750,
    x: 0,
    y: 0
  })),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock-canvas-data'),
  toBlob: jest.fn((callback) => {
    const mockBlob = new Blob(['mock canvas data'], { type: 'image/png' });
    callback(mockBlob);
  })
};

// Mock HTMLCanvasElement
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: class HTMLCanvasElement {
    constructor() {
      return mockCanvas;
    }
    
    getContext() {
      return mockCanvas.getContext();
    }
    
    toDataURL() {
      return mockCanvas.toDataURL();
    }
    
    toBlob(callback) {
      return mockCanvas.toBlob(callback);
    }
    
    get width() { return 1000; }
    set width(val) { this._width = val; }
    
    get height() { return 750; }
    set height(val) { this._height = val; }
    
    addEventListener() { return mockCanvas.addEventListener(); }
    removeEventListener() { return mockCanvas.removeEventListener(); }
    getBoundingClientRect() { return mockCanvas.getBoundingClientRect(); }
  },
  writable: true
});

// Store original createElement to maintain functionality for other elements
const originalCreateElement = document.createElement;

// Mock canvas creation
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    // Fall back to original createElement for other elements
    return originalCreateElement.call(document, tagName);
  }),
  writable: true
});

// Mock OffscreenCanvas for advanced canvas operations
if (typeof global.OffscreenCanvas === 'undefined') {
  global.OffscreenCanvas = class OffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
    
    getContext() {
      return mockCanvas.getContext();
    }
    
    convertToBlob() {
      return Promise.resolve(new Blob(['mock data'], { type: 'image/png' }));
    }
  };
}

// Mock Path2D for advanced drawing operations
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {
    constructor(path) {
      this.path = path;
    }
    
    addPath() {}
    arc() {}
    arcTo() {}
    bezierCurveTo() {}
    closePath() {}
    ellipse() {}
    lineTo() {}
    moveTo() {}
    quadraticCurveTo() {}
    rect() {}
  };
}

// Mock ImageData
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {
    constructor(dataOrWidth, heightOrWidth, height) {
      if (typeof dataOrWidth === 'object') {
        this.data = dataOrWidth;
        this.width = heightOrWidth;
        this.height = height;
      } else {
        this.width = dataOrWidth;
        this.height = heightOrWidth;
        this.data = new Uint8ClampedArray(dataOrWidth * heightOrWidth * 4);
      }
    }
  };
}

// Mock createImageBitmap
if (typeof global.createImageBitmap === 'undefined') {
  global.createImageBitmap = jest.fn(() => 
    Promise.resolve({
      width: 100,
      height: 100,
      close: jest.fn()
    })
  );
}

// Enhanced canvas debugging utilities
global.canvasTestUtils = {
  // Get mock canvas for testing
  getMockCanvas: () => mockCanvas,
  
  // Get context calls for testing
  getContextCalls: () => {
    const context = mockCanvas.getContext();
    return Object.keys(context).reduce((calls, method) => {
      if (jest.isMockFunction(context[method])) {
        calls[method] = context[method].mock.calls;
      }
      return calls;
    }, {});
  },
  
  // Reset all canvas mocks
  resetCanvasMocks: () => {
    const context = mockCanvas.getContext();
    Object.keys(context).forEach(method => {
      if (jest.isMockFunction(context[method])) {
        context[method].mockClear();
      }
    });
  },
  
  // Create mock image data
  createMockImageData: (width = 100, height = 100) => {
    return new ImageData(width, height);
  }
};