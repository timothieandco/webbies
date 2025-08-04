/**
 * Jest Configuration for Timothie & Co Jewelry Customizer
 * Comprehensive testing setup for frontend and backend integration
 */

module.exports = {
  // Test environment setup
  testEnvironment: 'jsdom',
  
  // Setup files to run before tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ],
  
  // Setup files to run once before all tests
  setupFiles: [
    '<rootDir>/tests/setup/jest.canvas.setup.js'
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],

  // Files to ignore during testing
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/visual/',
    '<rootDir>/node_modules/'
  ],

  // Module path mapping for ES6 imports and static assets
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@utils/(.*)$': '<rootDir>/tests/utils/$1',
    '^@fixtures/(.*)$': '<rootDir>/tests/fixtures/$1',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/mocks/fileMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Fix for supabase import
    '^@supabase/supabase-js$': '<rootDir>/tests/mocks/supabaseMock.js'
  },

  // Transform files with Babel
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Files to ignore during transformation
  transformIgnorePatterns: [
    'node_modules/(?!(konva|@supabase)/)'
  ],

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json'],

  // Coverage configuration
  collectCoverage: false, // Enable with --coverage flag
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/**/*.test.js',
    '!src/js/**/*.spec.js',
    '!src/js/debug/**',
    '!src/js/main.js',
    '!src/js/home.js',
    '!src/js/main-integrated.js'
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/js/core/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/js/services/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Test result processor for better output
  reporters: [
    'default'
  ],

  // Global variables available in tests
  globals: {
    'process.env': {
      NODE_ENV: 'test'
    }
  },

  // Test environment options
  testEnvironmentOptions: {
    resources: 'usable',
    runScripts: 'dangerously'
  },

  // Inject global mocks
  injectGlobals: true
};