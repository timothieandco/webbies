/**
 * Jest Setup File
 * Configures the testing environment for the Timothie Jewelry Customizer
 */

// Import testing utilities
import '@testing-library/jest-dom';

// Mock Konva.js for testing
global.Konva = {
    Stage: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        draw: jest.fn(),
        destroy: jest.fn(),
        getPointerPosition: jest.fn(() => ({ x: 0, y: 0 })),
        getClientRect: jest.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
        width: jest.fn(() => 800),
        height: jest.fn(() => 600),
        container: jest.fn(() => document.createElement('div'))
    })),
    Layer: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        draw: jest.fn(),
        destroy: jest.fn(),
        removeChildren: jest.fn(),
        getChildren: jest.fn(() => [])
    })),
    Rect: jest.fn().mockImplementation(() => ({
        x: jest.fn(),
        y: jest.fn(),
        width: jest.fn(),
        height: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        strokeWidth: jest.fn(),
        draggable: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        destroy: jest.fn()
    })),
    Circle: jest.fn().mockImplementation(() => ({
        x: jest.fn(),
        y: jest.fn(),
        radius: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        strokeWidth: jest.fn(),
        draggable: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        destroy: jest.fn()
    })),
    Group: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        removeChildren: jest.fn(),
        getChildren: jest.fn(() => []),
        x: jest.fn(),
        y: jest.fn(),
        draggable: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        destroy: jest.fn()
    })),
    Image: jest.fn().mockImplementation(() => ({
        image: jest.fn(),
        x: jest.fn(),
        y: jest.fn(),
        width: jest.fn(),
        height: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        destroy: jest.fn()
    }))
};

// Mock Supabase
global.supabase = {
    from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
    }),
    auth: {
        user: jest.fn(() => null),
        session: jest.fn(() => null),
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn()
    },
    storage: {
        from: jest.fn().mockReturnValue({
            upload: jest.fn(),
            download: jest.fn(),
            getPublicUrl: jest.fn()
        })
    }
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }))
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock getComputedStyle
global.getComputedStyle = jest.fn(() => ({
    getPropertyValue: jest.fn()
}));

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Custom test utilities
global.createMockElement = (tagName = 'div', attributes = {}) => {
    const element = document.createElement(tagName);
    Object.assign(element, attributes);
    return element;
};

global.createMockEvent = (type, properties = {}) => {
    const event = new Event(type);
    Object.assign(event, properties);
    return event;
};

// Setup DOM testing environment
beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Reset localStorage and sessionStorage
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();
    
    // Clear document body
    document.body.innerHTML = '';
    
    // Reset fetch mock
    fetch.mockClear();
});

// Global teardown
afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Clear any timers
    jest.clearAllTimers();
});

// Custom matchers
expect.extend({
    toBeInTheDocument(received) {
        const pass = document.body.contains(received);
        return {
            message: () => `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
            pass
        };
    },
    
    toHaveBeenCalledWithMatch(received, expected) {
        const pass = received.mock.calls.some(call => 
            call.some(arg => 
                typeof expected === 'function' ? expected(arg) : arg === expected
            )
        );
        return {
            message: () => `expected ${received} ${pass ? 'not ' : ''}to have been called with matching argument`,
            pass
        };
    }
});

// Export for potential use in other test files
export {
    localStorageMock,
    sessionStorageMock
};