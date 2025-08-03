module.exports = {
    // Test environment
    testEnvironment: 'jsdom',
    
    // Setup files
    setupFilesAfterEnv: [
        '<rootDir>/src/js/utils/__tests__/setup.js'
    ],
    
    // Module paths
    roots: ['<rootDir>/src'],
    modulePaths: ['<rootDir>/src'],
    moduleDirectories: ['node_modules', 'src'],
    
    // File patterns
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
        '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
    ],
    
    // Transform files
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
    },
    
    // Module name mapping
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@components/(.*)$': '<rootDir>/src/js/components/$1',
        '^@services/(.*)$': '<rootDir>/src/js/services/$1',
        '^@utils/(.*)$': '<rootDir>/src/js/utils/$1',
        '^@core/(.*)$': '<rootDir>/src/js/core/$1',
        '^@config/(.*)$': '<rootDir>/src/js/config/$1'
    },
    
    // File extensions
    moduleFileExtensions: ['js', 'jsx', 'json'],
    
    // Test path ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/build/'
    ],
    
    // Coverage configuration
    collectCoverage: false, // Enable with --coverage flag
    collectCoverageFrom: [
        'src/js/**/*.{js,jsx}',
        '!src/js/**/*.{test,spec}.{js,jsx}',
        '!src/js/utils/__tests__/**',
        '!src/js/debug/**',
        '!src/js/config/**',
        '!src/js/polyfills/**',
        '!**/node_modules/**',
        '!**/vendor/**'
    ],
    
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        },
        // Component-specific thresholds
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
    
    // Coverage reporting
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov',
        'json-summary'
    ],
    
    // Coverage directory
    coverageDirectory: '<rootDir>/coverage',
    
    // Clear mocks between tests
    clearMocks: true,
    
    // Restore mocks after each test
    restoreMocks: true,
    
    // Verbose output
    verbose: true,
    
    // Test timeout
    testTimeout: 10000,
    
    // Error handling
    errorOnDeprecated: true,
    
    // Global setup/teardown
    globalSetup: '<rootDir>/src/js/utils/__tests__/globalSetup.js',
    globalTeardown: '<rootDir>/src/js/utils/__tests__/globalTeardown.js',
    
    // Mock patterns
    modulePathIgnorePatterns: [
        '<rootDir>/dist/'
    ],
    
    // Transform ignore patterns
    transformIgnorePatterns: [
        'node_modules/(?!(konva|@supabase)/)'
    ],
    
    // Watch plugins
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname'
    ],
    
    // Notify mode
    notify: false,
    
    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0,
    
    // Cache directory
    cacheDirectory: '<rootDir>/.jest-cache'
};