/**
 * Playwright Global Teardown
 * Runs once after all tests across all projects
 */

async function globalTeardown() {
  console.log('🧹 Starting Playwright global teardown...');

  try {
    // Clean up any global resources
    console.log('🗑️ Cleaning up test artifacts...');
    
    // Clean up temporary files if any were created
    // This could include downloaded files, uploaded images, etc.
    
    // Log test completion statistics
    console.log('📊 Test execution completed');
    
    console.log('✅ Playwright global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown encountered an error:', error);
    // Don't throw here as it might mask test failures
  }
}

export default globalTeardown;