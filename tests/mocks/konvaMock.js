/**
 * Konva Mock for Testing
 * Provides mock implementations of Konva objects and methods
 */

// Mock Konva Stage
class MockStage {
  constructor(config) {
    this.config = config;
    this.children = [];
    this._width = config.width || 800;
    this._height = config.height || 600;
    this._listening = config.listening !== false;
    
    // Make methods chainable and mockable
    this.add = jest.fn((child) => {
      this.children.push(child);
      child.parent = this;
      return this;
    });
    
    this.remove = jest.fn((child) => {
      const index = this.children.indexOf(child);
      if (index > -1) {
        this.children.splice(index, 1);
        child.parent = null;
      }
      return this;
    });
    
    this.destroy = jest.fn(() => {
      this.children = [];
      return this;
    });
    
    this.draw = jest.fn(() => this);
    this.batchDraw = jest.fn(() => this);
    
    // Add width and height methods that can be called as functions
    this.width = jest.fn(() => this._width);
    this.height = jest.fn(() => this._height);
    
    // Add container method
    this.container = jest.fn(() => config.container || document.createElement('div'));
    
    // Add event handling methods
    this.on = jest.fn(() => this);
    this.off = jest.fn(() => this);
    
    // Add listening method
    this.listening = jest.fn((val) => {
      if (val !== undefined) {
        this._listening = val;
        return this;
      }
      return this._listening !== false;
    });
    
    // Add pointer position methods
    this.setPointersPositions = jest.fn(() => this);
    this.getPointerPosition = jest.fn(() => ({ x: 0, y: 0 }));
    
    // Add toDataURL method for export functionality
    this.toDataURL = jest.fn((options = {}) => {
      const mimeType = options.mimeType || 'image/png';
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      return `data:${mimeType};base64,${base64Data}`;
    });
  }

  getStage() {
    return this;
  }

  getWidth() {
    return this._width;
  }

  getHeight() {
    return this._height;
  }
}

// Mock Konva Layer
class MockLayer {
  constructor(config = {}) {
    this.config = config;
    this.children = [];
    this._listening = config.listening !== false;
    this._visible = config.visible !== false;
    this._draggable = config.draggable || false;
    
    this.add = jest.fn((child) => {
      this.children.push(child);
      child.parent = this;
      return this;
    });
    
    this.remove = jest.fn((child) => {
      const index = this.children.indexOf(child);
      if (index > -1) {
        this.children.splice(index, 1);
        child.parent = null;
      }
      return this;
    });
    
    this.destroyChildren = jest.fn(() => {
      this.children = [];
      return this;
    });
    
    this.listening = jest.fn((val) => {
      if (val !== undefined) {
        this._listening = val;
        return this;
      }
      return this._listening;
    });
    
    this.visible = jest.fn((val) => {
      if (val !== undefined) {
        this._visible = val;
        return this;
      }
      return this._visible;
    });
    
    this.draggable = jest.fn((val) => {
      if (val !== undefined) {
        this._draggable = val;
        return this;
      }
      return this._draggable || false;
    });
    
    this.on = jest.fn(() => this);
    this.off = jest.fn(() => this);
    this.destroy = jest.fn(() => this);
    this.draw = jest.fn(() => this);
    this.batchDraw = jest.fn(() => this);
    
    // Add getStage method
    this.getStage = jest.fn(() => this.parent?.getStage?.() || null);
    this.getLayer = jest.fn(() => this.parent);
    this.getParent = jest.fn(() => this.parent);
    this.name = jest.fn(() => this.config.name || 'mock-layer');
    this.isDestroyed = jest.fn(() => false);
    this.destroy = jest.fn(() => {
      if (this.parent) {
        this.parent.remove(this);
      }
      return this;
    });
  }
}

// Mock Konva Image
class MockImage {
  constructor(config) {
    this.config = config;
    this._x = config.x || 0;
    this._y = config.y || 0;
    this._width = config.width || 100;
    this._height = config.height || 100;
    this._draggable = config.draggable || false;
    this._listening = config.listening !== false;
    this._id = config.id || `mock-image-${Math.random()}`;
    this._image = config.image || null;
    this._offsetX = config.offsetX || 0;
    this._offsetY = config.offsetY || 0;
    this._scaleX = config.scaleX || 1;
    this._scaleY = config.scaleY || 1;
    this._rotation = config.rotation || 0;
    this._opacity = config.opacity || 1;
    this._visible = config.visible !== false;
    
    // Make methods chainable and mockable
    this.x = jest.fn((val) => {
      if (val !== undefined) {
        this._x = val;
        return this;
      }
      return this._x;
    });
    
    this.y = jest.fn((val) => {
      if (val !== undefined) {
        this._y = val;
        return this;
      }
      return this._y;
    });
    
    this.width = jest.fn((val) => {
      if (val !== undefined) {
        this._width = val;
        return this;
      }
      return this._width;
    });
    
    this.height = jest.fn((val) => {
      if (val !== undefined) {
        this._height = val;
        return this;
      }
      return this._height;
    });
    
    this.draggable = jest.fn((val) => {
      if (val !== undefined) {
        this._draggable = val;
        return this;
      }
      return this._draggable;
    });
    
    this.listening = jest.fn((val) => {
      if (val !== undefined) {
        this._listening = val;
        return this;
      }
      return this._listening;
    });
    
    this.id = jest.fn(() => this._id);
    
    this.image = jest.fn((val) => {
      if (val !== undefined) {
        this._image = val;
        return this;
      }
      return this._image;
    });
    
    this.offsetX = jest.fn((val) => {
      if (val !== undefined) {
        this._offsetX = val;
        return this;
      }
      return this._offsetX;
    });
    
    this.offsetY = jest.fn((val) => {
      if (val !== undefined) {
        this._offsetY = val;
        return this;
      }
      return this._offsetY;
    });
    
    this.scaleX = jest.fn((val) => {
      if (val !== undefined) {
        this._scaleX = val;
        return this;
      }
      return this._scaleX;
    });
    
    this.scaleY = jest.fn((val) => {
      if (val !== undefined) {
        this._scaleY = val;
        return this;
      }
      return this._scaleY;
    });
    
    this.rotation = jest.fn((val) => {
      if (val !== undefined) {
        this._rotation = val;
        return this;
      }
      return this._rotation;
    });
    
    this.opacity = jest.fn((val) => {
      if (val !== undefined) {
        this._opacity = val;
        return this;
      }
      return this._opacity;
    });
    
    this.visible = jest.fn((val) => {
      if (val !== undefined) {
        this._visible = val;
        return this;
      }
      return this._visible;
    });
    
    // Event handling
    this.on = jest.fn(() => this);
    this.off = jest.fn(() => this);
    
    // Position and bounds
    this.position = jest.fn((pos) => {
      if (pos) {
        this._x = pos.x || this._x;
        this._y = pos.y || this._y;
        return this;
      }
      return { x: this._x, y: this._y };
    });
    
    this.getAbsolutePosition = jest.fn(() => ({ x: this._x, y: this._y }));
    
    this.getClientRect = jest.fn(() => ({
      x: this._x,
      y: this._y,
      width: this._width,
      height: this._height
    }));
    
    // Transform methods
    this.move = jest.fn((dx, dy) => {
      this._x += dx;
      this._y += dy;
      return this;
    });
    
    this.moveTo = jest.fn((x, y) => {
      this._x = x;
      this._y = y;
      return this;
    });
    
    // Utility methods
    this.destroy = jest.fn(() => this);
    this.remove = jest.fn(() => this);
    this.hide = jest.fn(() => {
      this._visible = false;
      return this;
    });
    this.show = jest.fn(() => {
      this._visible = true;
      return this;
    });
    this.getLayer = jest.fn(() => this.parent);
    this.getStage = jest.fn(() => this.parent?.getStage?.() || null);
    this.getParent = jest.fn(() => this.parent);
    this.isDestroyed = jest.fn(() => false);
    this.destroy = jest.fn(() => {
      if (this.parent) {
        this.parent.remove(this);
      }
      return this;
    });
  }
}

// Mock Konva Group
class MockGroup {
  constructor(config) {
    this.config = config;
    this.children = [];
    
    this.add = jest.fn((child) => {
      this.children.push(child);
      child.parent = this;
      return this;
    });
    
    this.remove = jest.fn((child) => {
      const index = this.children.indexOf(child);
      if (index > -1) {
        this.children.splice(index, 1);
        child.parent = null;
      }
      return this;
    });
    
    this.destroyChildren = jest.fn(() => {
      this.children = [];
      return this;
    });
    
    this.on = jest.fn(() => this);
    this.off = jest.fn(() => this);
    this.destroy = jest.fn(() => this);
  }
}

// Mock Konva Circle
class MockCircle {
  constructor(config) {
    this.config = config;
    this._x = config.x || 0;
    this._y = config.y || 0;
    this._radius = config.radius || 50;
    
    this.x = jest.fn((val) => {
      if (val !== undefined) {
        this._x = val;
        return this;
      }
      return this._x;
    });
    
    this.y = jest.fn((val) => {
      if (val !== undefined) {
        this._y = val;
        return this;
      }
      return this._y;
    });
    
    this.radius = jest.fn((val) => {
      if (val !== undefined) {
        this._radius = val;
        return this;
      }
      return this._radius;
    });
    
    this.on = jest.fn(() => this);
    this.off = jest.fn(() => this);
    this.destroy = jest.fn(() => this);
  }
}

// Mock Konva Rect
class MockRect {
  constructor(config) {
    this.config = config;
    this._x = config.x || 0;
    this._y = config.y || 0;
    this._width = config.width || 100;
    this._height = config.height || 100;
    this._visible = config.visible !== false;
    this._stroke = config.stroke || 'black';
    this._strokeWidth = config.strokeWidth || 1;
    this._fill = config.fill || 'transparent';
    
    this.x = jest.fn((val) => {
      if (val !== undefined) {
        this._x = val;
        return this;
      }
      return this._x;
    });
    
    this.y = jest.fn((val) => {
      if (val !== undefined) {
        this._y = val;
        return this;
      }
      return this._y;
    });
    
    this.width = jest.fn((val) => {
      if (val !== undefined) {
        this._width = val;
        return this;
      }
      return this._width;
    });
    
    this.height = jest.fn((val) => {
      if (val !== undefined) {
        this._height = val;
        return this;
      }
      return this._height;
    });
    
    this.visible = jest.fn((val) => {
      if (val !== undefined) {
        this._visible = val;
        return this;
      }
      return this._visible;
    });
    
    this.setAttrs = jest.fn((attrs) => {
      Object.assign(this, attrs);
      return this;
    });
    
    this.to = jest.fn(() => this);
    this.on = jest.fn(() => this);
    this.off = jest.fn(() => this);
    this.destroy = jest.fn(() => this);
    this.getLayer = jest.fn(() => this.parent);
    this.getStage = jest.fn(() => this.parent?.getStage?.() || null);
    this.getParent = jest.fn(() => this.parent);
    this.name = jest.fn(() => this.config.name || 'mock-rect');
    this.isDestroyed = jest.fn(() => false);
  }
}

// Mock other Konva classes (simplified versions)
class MockText { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockLine { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockEllipse { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockRegularPolygon { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockStar { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockRing { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockArc { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockWedge { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockLabel { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockTag { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockPath { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockSprite { constructor(config) { this.config = config; this.on = jest.fn(() => this); this.off = jest.fn(() => this); this.destroy = jest.fn(() => this); } }
class MockAnimation { constructor(config) { this.config = config; this.start = jest.fn(() => this); this.stop = jest.fn(() => this); } }
class MockTween { constructor(config) { this.config = config; this.play = jest.fn(() => this); this.pause = jest.fn(() => this); this.reverse = jest.fn(() => this); this.reset = jest.fn(() => this); } }
class MockEasing { static Linear = jest.fn(); static EaseIn = jest.fn(); static EaseOut = jest.fn(); static EaseInOut = jest.fn(); }
class MockEasings { static Linear = jest.fn(); static EaseIn = jest.fn(); static EaseOut = jest.fn(); static EaseInOut = jest.fn(); static BackEaseOut = jest.fn(); static BackEaseIn = jest.fn(); }
class MockUtil { static getRandomColor = jest.fn(() => '#000000'); static getRGB = jest.fn(() => ({ r: 0, g: 0, b: 0 })); }
class MockCollection { constructor() { this.length = 0; } push = jest.fn(); pop = jest.fn(); shift = jest.fn(); unshift = jest.fn(); }
class MockContext { constructor() { this.fillStyle = '#000000'; this.strokeStyle = '#000000'; } }
class MockFactory { static addGetterSetter = jest.fn(); static addComponentsGetterSetter = jest.fn(); }
class MockValidators { static getNumberValidator = jest.fn(); static getStringValidator = jest.fn(); }
class MockDD { static dragElement = jest.fn(); static dropElement = jest.fn(); }
class MockDraggable { constructor() { this.start = jest.fn(); this.stop = jest.fn(); } }
class MockDragAndDrop { constructor() { this.start = jest.fn(); this.stop = jest.fn(); } }
class MockHover { constructor() { this.start = jest.fn(); this.stop = jest.fn(); } }
class MockTransformer { constructor() { this.nodes = []; this.attachTo = jest.fn(() => this); this.detach = jest.fn(() => this); } }
class MockNode { constructor() { this.parent = null; this.children = []; } }
class MockContainer extends MockNode { 
  constructor() { 
    super(); 
    this.children = []; 
    this.add = jest.fn();
    this.remove = jest.fn();
  }
}
class MockShape extends MockNode { constructor() { super(); } }
class MockFastLayer { constructor() { this.canvas = { getContext: jest.fn(() => new MockContext()) }; } }
class MockCanvas { constructor() { this.getContext = jest.fn(() => new MockContext()); } }
class MockWebGL { constructor() { this.getContext = jest.fn(() => new MockContext()); } }
class MockFilters { static Blur = jest.fn(); static Brighten = jest.fn(); static Contrast = jest.fn(); static Emboss = jest.fn(); static Enhance = jest.fn(); static Grayscale = jest.fn(); static HSL = jest.fn(); static HSV = jest.fn(); static Invert = jest.fn(); static Kaleidoscope = jest.fn(); static Mask = jest.fn(); static Noise = jest.fn(); static Pixelate = jest.fn(); static Posterize = jest.fn(); static RGB = jest.fn(); static RGBA = jest.fn(); static Sepia = jest.fn(); static Solarize = jest.fn(); static Threshold = jest.fn(); }

// Export all Konva classes
module.exports = {
  Stage: MockStage,
  Layer: MockLayer,
  Image: MockImage,
  Group: MockGroup,
  Circle: MockCircle,
  Rect: MockRect,
  Text: MockText,
  Line: MockLine,
  Ellipse: MockEllipse,
  RegularPolygon: MockRegularPolygon,
  Star: MockStar,
  Ring: MockRing,
  Arc: MockArc,
  Wedge: MockWedge,
  Label: MockLabel,
  Tag: MockTag,
  Path: MockPath,
  Sprite: MockSprite,
  Animation: MockAnimation,
  Tween: MockTween,
  Easing: MockEasing,
  Easings: MockEasings,
  Util: MockUtil,
  Collection: MockCollection,
  Context: MockContext,
  Factory: MockFactory,
  Validators: MockValidators,
  DD: MockDD,
  Draggable: MockDraggable,
  DragAndDrop: MockDragAndDrop,
  Hover: MockHover,
  Transformer: MockTransformer,
  Node: MockNode,
  Container: MockContainer,
  Shape: MockShape,
  FastLayer: MockFastLayer,
  Canvas: MockCanvas,
  WebGL: MockWebGL,
  filters: MockFilters,
  Node: MockNode,
  Container: MockContainer,
  Shape: MockShape
};