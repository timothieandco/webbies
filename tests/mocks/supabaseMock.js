/**
 * Supabase Mock for Testing
 * Provides mock implementations of Supabase client methods
 */

// Mock Supabase Client
const createMockSupabaseClient = () => {
  const mockClient = {
    // Authentication
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn()
    },

    // Database operations
    from: jest.fn((table) => {
      const mockQueryBuilder = {
        select: jest.fn(() => mockQueryBuilder),
        insert: jest.fn(() => mockQueryBuilder),
        update: jest.fn(() => mockQueryBuilder),
        delete: jest.fn(() => mockQueryBuilder),
        eq: jest.fn(() => mockQueryBuilder),
        neq: jest.fn(() => mockQueryBuilder),
        gt: jest.fn(() => mockQueryBuilder),
        gte: jest.fn(() => mockQueryBuilder),
        lt: jest.fn(() => mockQueryBuilder),
        lte: jest.fn(() => mockQueryBuilder),
        like: jest.fn(() => mockQueryBuilder),
        ilike: jest.fn(() => mockQueryBuilder),
        in: jest.fn(() => mockQueryBuilder),
        contains: jest.fn(() => mockQueryBuilder),
        or: jest.fn(() => mockQueryBuilder),
        and: jest.fn(() => mockQueryBuilder),
        order: jest.fn(() => mockQueryBuilder),
        limit: jest.fn(() => mockQueryBuilder),
        range: jest.fn(() => mockQueryBuilder),
        single: jest.fn(() => mockQueryBuilder),
        maybeSingle: jest.fn(() => mockQueryBuilder),
        
        // Execute methods - return promises
        then: jest.fn((resolve) => {
          const mockResponse = {
            data: [],
            error: null,
            count: 0
          };
          resolve(mockResponse);
          return Promise.resolve(mockResponse);
        })
      };
      return mockQueryBuilder;
    }),

    // RPC (stored procedures)
    rpc: jest.fn((fnName, params) => ({
      then: jest.fn((resolve) => {
        const mockResponse = {
          data: [],
          error: null
        };
        resolve(mockResponse);
        return Promise.resolve(mockResponse);
      })
    })),

    // Storage
    storage: {
      from: jest.fn((bucket) => ({
        upload: jest.fn(() => Promise.resolve({
          data: { path: 'mock-path' },
          error: null
        })),
        download: jest.fn(() => Promise.resolve({
          data: new Blob(['mock data']),
          error: null
        })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://mock-url.com/file.jpg' }
        })),
        remove: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        })),
        list: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    },

    // Real-time subscriptions
    channel: jest.fn((name) => ({
      on: jest.fn(() => mockSubscription),
      subscribe: jest.fn(() => mockSubscription),
      unsubscribe: jest.fn()
    })),

    // Remove channels
    removeAllChannels: jest.fn(),
    removeChannel: jest.fn()
  };

  return mockClient;
};

// Mock subscription object
const mockSubscription = {
  unsubscribe: jest.fn()
};

// Mock inventory data for testing
const mockInventoryItems = [
  {
    id: 'test-item-1',
    title: 'Test Charm 1',
    description: 'A test charm for unit testing',
    category: 'Charms',
    price: 15.99,
    image_url: 'https://mock-url.com/charm1.jpg',
    quantity_available: 10,
    status: 'active',
    tags: ['test', 'charm'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'test-item-2',
    title: 'Test Necklace 1',
    description: 'A test necklace for unit testing',
    category: 'Necklaces',
    price: 25.99,
    image_url: 'https://mock-url.com/necklace1.jpg',
    quantity_available: 5,
    status: 'active',
    tags: ['test', 'necklace'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock design data
const mockDesigns = [
  {
    id: 'test-design-1',
    user_id: 'test-user-1',
    title: 'Test Design 1',
    description: 'A test jewelry design',
    design_data: {
      necklace: { id: 'classic-chain', name: 'Classic Chain' },
      charms: [
        { id: 'test-item-1', x: 100, y: 100 }
      ]
    },
    image_url: 'https://mock-url.com/design1.jpg',
    is_public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Export factory function
const createClient = jest.fn(() => createMockSupabaseClient());

// Mock response helpers
const mockSupabaseHelpers = {
  // Helper to create successful response
  mockSuccess: (data, count = null) => ({
    data,
    error: null,
    count
  }),

  // Helper to create error response
  mockError: (message, code = null) => ({
    data: null,
    error: {
      message,
      code,
      details: null,
      hint: null
    },
    count: null
  }),

  // Helper to create auth response
  mockAuthSuccess: (user) => ({
    data: {
      user,
      session: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        user
      }
    },
    error: null
  }),

  // Mock inventory data
  mockInventoryItems,
  mockDesigns,

  // Create mock client
  createMockClient: createMockSupabaseClient
};

// Export the mock
module.exports = {
  createClient,
  ...mockSupabaseHelpers
};

// Also export as default
module.exports.default = {
  createClient,
  ...mockSupabaseHelpers
};