/**
 * Jest Global Teardown
 * Runs once after all tests
 */

module.exports = async () => {
    // Calculate test run duration
    const endTime = Date.now();
    const duration = endTime - (global.__TEST_STATE__?.startTime || endTime);
    
    // Clean up any global resources
    if (global.__TEST_STATE__) {
        console.log(`🏁 Test suite completed in ${duration}ms`);
        console.log(`📊 Total tests: ${global.__TEST_STATE__.testCount || 'unknown'}`);
        
        // Clean up test state
        delete global.__TEST_STATE__;
    }
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
    
    console.log('🧹 Jest Global Teardown Complete');
};