/**
 * Jest Global Setup
 * Runs once before all tests
 */

module.exports = async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.TZ = 'UTC';
    
    // Suppress console warnings for known test environment issues
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
        // Suppress specific warnings that are expected in test environment
        if (
            args[0] && 
            typeof args[0] === 'string' && 
            (
                args[0].includes('ReactDOM.render is no longer supported') ||
                args[0].includes('Warning: Failed prop type') ||
                args[0].includes('componentWillReceiveProps has been renamed')
            )
        ) {
            return;
        }
        originalConsoleWarn(...args);
    };
    
    // Set up global test state
    global.__TEST_STATE__ = {
        startTime: Date.now(),
        testCount: 0
    };
    
    console.log('🧪 Jest Global Setup Complete');
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Timezone: ${process.env.TZ}`);
};