/**
 * Test Data Fixtures
 * Centralized test data for consistent testing across all test suites
 */

// Mock charm data
export const mockCharms = {
  charmOne: {
    id: 'charm-1',
    title: 'Heart Charm',
    description: 'Beautiful heart-shaped charm',
    category: 'Charms',
    price: 15.99,
    image_url: 'mock-heart-charm.png',
    quantity_available: 10,
    status: 'active',
    tags: ['heart', 'love', 'romantic'],
    dimensions: { width: 50, height: 50 }
  },
  
  charmTwo: {
    id: 'charm-2',
    title: 'Star Charm',
    description: 'Sparkling star charm',
    category: 'Charms',
    price: 18.99,
    image_url: 'mock-star-charm.png',
    quantity_available: 15,
    status: 'active',
    tags: ['star', 'celestial', 'sparkle'],
    dimensions: { width: 45, height: 45 }
  },
  
  charmThree: {
    id: 'charm-3',
    title: 'Flower Charm',
    description: 'Delicate flower charm',
    category: 'Charms',
    price: 22.50,
    image_url: 'mock-flower-charm.png',
    quantity_available: 8,
    status: 'active',
    tags: ['flower', 'nature', 'delicate'],
    dimensions: { width: 55, height: 50 }
  }
};

// Mock necklace data
export const mockNecklaces = {
  classicChain: {
    id: 'classic-chain',
    title: 'Classic Chain Necklace',
    description: 'Timeless chain necklace base',
    category: 'Necklaces',
    price: 35.00,
    imageUrl: 'mock-classic-chain.png',
    quantity_available: 20,
    status: 'active',
    tags: ['chain', 'classic', 'base'],
    attachmentZones: [
      { x: 500, y: 250, radius: 30, occupied: false },
      { x: 450, y: 300, radius: 30, occupied: false },
      { x: 550, y: 300, radius: 30, occupied: false },
      { x: 400, y: 350, radius: 30, occupied: false },
      { x: 600, y: 350, radius: 30, occupied: false }
    ]
  }
};

// Mock design data
export const mockDesigns = {
  simpleDesign: {
    id: 'design-1',
    user_id: 'user-1',
    title: 'Simple Heart Design',
    description: 'A simple design with a heart charm',
    design_data: {
      necklace: mockNecklaces.classicChain,
      charms: [
        {
          ...mockCharms.charmOne,
          x: 500,
          y: 250,
          rotation: 0,
          scale: 1
        }
      ]
    },
    image_url: 'mock-design-1.png',
    is_public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  
  complexDesign: {
    id: 'design-2',
    user_id: 'user-1',
    title: 'Multi-Charm Design',
    description: 'Complex design with multiple charms',
    design_data: {
      necklace: mockNecklaces.classicChain,
      charms: [
        { ...mockCharms.charmOne, x: 450, y: 250 },
        { ...mockCharms.charmTwo, x: 550, y: 250 },
        { ...mockCharms.charmThree, x: 500, y: 300 }
      ]
    },
    image_url: 'mock-design-2.png',
    is_public: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
};

// Mock user data
export const mockUsers = {
  testUser: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2024-01-01T00:00:00Z'
  },
  
  adminUser: {
    id: 'admin-1',
    email: 'admin@timothieandco.com',
    name: 'Admin User',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  }
};

// Mock canvas configuration
export const mockCanvasConfig = {
  width: 1000,
  height: 750,
  backgroundColor: '#ffffff',
  maxCharms: 12,
  minCharmSpacing: 30,
  enableAnimation: false // Disabled for testing
};

// Mock DOM elements
export const createMockDOM = () => {
  // Create container element
  const container = document.createElement('div');
  container.id = 'jewelry-customizer';
  container.style.width = '1000px';
  container.style.height = '750px';
  document.body.appendChild(container);
  
  // Create sidebar elements
  const sidebar = document.createElement('div');
  sidebar.id = 'charm-library';
  sidebar.className = 'sidebar';
  document.body.appendChild(sidebar);
  
  // Create controls
  const controls = document.createElement('div');
  controls.id = 'customizer-controls';
  controls.innerHTML = `
    <button id="undo-btn">Undo</button>
    <button id="redo-btn">Redo</button>
    <button id="clear-btn">Clear All</button>
    <button id="export-btn">Export</button>
  `;
  document.body.appendChild(controls);
  
  return { container, sidebar, controls };
};

// Mock API responses
export const mockAPIResponses = {
  inventorySuccess: {
    data: Object.values(mockCharms),
    count: Object.keys(mockCharms).length,
    page: 1,
    total_pages: 1
  },
  
  inventoryError: {
    data: null,
    error: {
      message: 'Failed to fetch inventory',
      code: 'FETCH_ERROR'
    },
    count: 0
  },
  
  authSuccess: {
    data: {
      user: mockUsers.testUser,
      session: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        user: mockUsers.testUser
      }
    },
    error: null
  },
  
  authError: {
    data: null,
    error: {
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    }
  }
};

// Performance test data
export const performanceTestData = {
  largeCharmSet: Array.from({ length: 100 }, (_, i) => ({
    id: `perf-charm-${i}`,
    title: `Performance Test Charm ${i}`,
    description: `Test charm for performance testing`,
    category: 'Charms',
    price: 15.99,
    image_url: `mock-perf-charm-${i}.png`,
    quantity_available: 10,
    status: 'active',
    tags: ['performance', 'test'],
    dimensions: { width: 50, height: 50 }
  })),
  
  heavyCanvasOperations: {
    dragOperations: 50,
    charmPlacements: 20,
    undoRedoOperations: 30
  }
};

// Export utilities for creating test data
export const testDataFactory = {
  // Create a charm with custom properties
  createCharm: (overrides = {}) => ({
    ...mockCharms.charmOne,
    id: `charm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides
  }),
  
  // Create a design with custom properties
  createDesign: (overrides = {}) => ({
    ...mockDesigns.simpleDesign,
    id: `design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides
  }),
  
  // Create a user with custom properties
  createUser: (overrides = {}) => ({
    ...mockUsers.testUser,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Date.now()}@example.com`,
    ...overrides
  }),
  
  // Create multiple charms
  createCharms: (count, overrides = {}) => {
    return Array.from({ length: count }, (_, i) => 
      testDataFactory.createCharm({
        title: `Test Charm ${i + 1}`,
        ...overrides
      })
    );
  }
};

// Export all test data
export default {
  mockCharms,
  mockNecklaces,
  mockDesigns,
  mockUsers,
  mockCanvasConfig,
  mockAPIResponses,
  performanceTestData,
  testDataFactory,
  createMockDOM
};