/**
 * Simple Test - Verify testing framework is working
 */

describe('Testing Framework', () => {
  test('Jest is working', () => {
    expect(1 + 1).toBe(2);
  });

  test('Canvas mock is available', () => {
    const canvas = document.createElement('canvas');
    expect(canvas).toBeTruthy();
    expect(typeof canvas.getContext).toBe('function');
  });

  test('Global mocks are setup', () => {
    expect(global.Image).toBeDefined();
    expect(global.localStorage).toBeDefined();
    expect(global.fetch).toBeDefined();
    expect(global.requestAnimationFrame).toBeDefined();
  });
});