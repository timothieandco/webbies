# Comprehensive Testing Guide

## Overview

This guide covers the complete testing framework for the Timothie & Co Jewelry Customizer application. The testing strategy includes multiple layers of testing to ensure quality, performance, and reliability.

## Testing Architecture

```
Testing Framework
├── Unit Tests (Jest)
│   ├── Core Classes
│   ├── Utilities
│   └── Services
├── Integration Tests (Jest + Supabase)
│   ├── Backend Connectivity
│   ├── API Operations
│   └── Real-time Features
├── End-to-End Tests (Playwright)
│   ├── User Workflows
│   ├── Cross-browser Testing
│   └── Mobile/Responsive
├── Performance Tests (Jest + Playwright)
│   ├── Canvas Operations
│   ├── Memory Management
│   └── Load Testing
├── Visual Regression Tests (Playwright)
│   ├── UI Consistency
│   ├── Cross-browser Visual
│   └── Responsive Design
└── CI/CD Pipeline (GitHub Actions)
    ├── Automated Testing
    ├── Quality Gates
    └── Deployment Protection
```

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# All tests
npm run test:all

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Visual regression tests
npm run test:visual

# Performance tests
npm run test:performance

# Coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Testing Layers

### 1. Unit Tests

**Location**: `tests/unit/`
**Framework**: Jest with custom mocks
**Purpose**: Test individual components and functions in isolation

#### Key Features:
- Mock implementations for Konva.js, Supabase, and external dependencies
- Canvas operations testing with mock canvas context
- State management validation
- Error handling verification

#### Example:
```javascript
// tests/unit/core/JewelryCustomizer.test.js
describe('JewelryCustomizer', () => {
  test('should add charm successfully', async () => {
    const customizer = new JewelryCustomizer('test-container');
    const result = await customizer.addCharm(mockCharm, { x: 100, y: 100 });
    
    expect(result).toBeDefined();
    expect(customizer.charmManager.addCharm).toHaveBeenCalled();
  });
});
```

#### Coverage Targets:
- **Core Classes**: 80%+ coverage
- **Services**: 75%+ coverage
- **Utilities**: 70%+ coverage

### 2. Integration Tests

**Location**: `tests/integration/`
**Framework**: Jest with real Supabase connection
**Purpose**: Test backend connectivity and data operations

#### Features:
- Real database operations with test environment
- Authentication flow testing
- Real-time subscription validation
- API error handling

#### Setup:
```bash
# Set test environment variables
export TEST_SUPABASE_URL="your-test-supabase-url"
export TEST_SUPABASE_ANON_KEY="your-test-key"
```

#### Example:
```javascript
describe('Backend Connectivity', () => {
  test('should fetch inventory from database', async () => {
    const result = await api.getInventory();
    
    expect(result.data).toBeInstanceOf(Array);
    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});
```

### 3. End-to-End Tests

**Location**: `tests/e2e/`
**Framework**: Playwright
**Purpose**: Test complete user workflows across browsers

#### Browser Coverage:
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

#### Key Scenarios:
- Home page navigation
- Jewelry customizer workflow
- Drag-and-drop operations
- Responsive design functionality
- Error handling and recovery

#### Example:
```javascript
test('should drag charm from sidebar to canvas', async ({ page }) => {
  const firstCharm = page.locator('.charm-item').first();
  const canvas = page.locator('#jewelry-customizer canvas');
  
  await firstCharm.dragTo(canvas);
  
  const charmCount = await page.evaluate(() => 
    window.jewelryCustomizer.charmManager.getCharmCount()
  );
  expect(charmCount).toBeGreaterThan(0);
});
```

### 4. Performance Tests

**Location**: `tests/performance/`
**Framework**: Jest + Playwright
**Purpose**: Ensure optimal performance under various conditions

#### Test Categories:
- **Initialization Performance**: Canvas setup, library loading
- **Operation Performance**: Charm operations, state management
- **Memory Management**: Leak detection, cleanup verification
- **Load Testing**: Multiple users, stress conditions

#### Benchmarks:
- Canvas initialization: < 500ms
- Charm addition: < 50ms per charm
- State operations: < 20ms per undo/redo
- Memory growth: < 10MB for typical usage

### 5. Visual Regression Tests

**Location**: `tests/visual/`
**Framework**: Playwright with visual comparisons
**Purpose**: Maintain visual consistency across updates

#### Coverage:
- Full page screenshots
- Component-level comparisons
- Responsive breakpoints
- Cross-browser visual consistency
- Hover and interaction states

#### Configuration:
```javascript
// playwright.visual.config.js
expect.configure({
  threshold: 0.2, // 20% difference tolerance
  animations: 'disabled'
});
```

## Test Configuration

### Jest Configuration

**File**: `jest.config.js`

Key features:
- ES6 module support
- Canvas mocking for Konva.js
- Supabase mocking
- Coverage thresholds
- Custom test environment setup

### Playwright Configuration

**File**: `playwright.config.js`

Features:
- Multi-browser testing
- Mobile device emulation
- Visual regression settings
- Custom reporters
- Global setup/teardown

## Mocking Strategy

### Canvas Mocking
- Complete HTMLCanvasElement mock
- Konva.js compatible interface
- Performance-optimized for unit tests

### Supabase Mocking
- Authentication flow mocking
- Database operation mocking
- Real-time subscription mocking
- Error scenario simulation

### File and Asset Mocking
- Image loading simulation
- Font loading mocking
- Network request interception

## Continuous Integration

### GitHub Actions Workflows

#### Main Test Pipeline (`test.yml`)
- Runs on every push and PR
- Multi-node version testing
- Parallel test execution
- Artifact collection and reporting

#### Nightly Tests (`nightly-tests.yml`)
- Extended test suite
- Performance benchmarking
- Security audits
- Stress testing

### Quality Gates
- All tests must pass for deployment
- Coverage thresholds must be met
- Visual regressions block releases
- Performance regressions trigger alerts

## Test Data Management

### Fixtures and Factories

**Location**: `tests/fixtures/testData.js`

Provides:
- Mock charm data
- Mock user accounts
- Mock design configurations
- Test utility functions

### Test Environment Setup
- Isolated test database
- Consistent test data
- Cleanup procedures
- Environment variable management

## Development Workflow

### Pre-commit Testing
```bash
# Run before committing changes
npm run lint:fix
npm run test:unit
npm run test:integration
```

### Feature Development Testing
1. Write unit tests for new functionality
2. Add integration tests for backend features
3. Create E2E tests for user-facing features
4. Update visual regression tests if UI changes

### Bug Fix Testing
1. Create failing test that reproduces the bug
2. Fix the bug
3. Verify all tests pass
4. Add regression tests to prevent reoccurrence

## Testing Best Practices

### Unit Tests
- Test behavior, not implementation
- Use descriptive test names
- Mock external dependencies
- Test both success and error scenarios
- Maintain fast execution (< 10ms per test)

### Integration Tests
- Use realistic test data
- Test actual API calls
- Verify database state changes
- Test error handling and retries
- Clean up test data after each test

### E2E Tests
- Focus on critical user journeys
- Use page object pattern
- Wait for elements properly
- Handle flaky tests with retries
- Test across different viewports

### Visual Tests
- Disable animations for consistency
- Use stable test data
- Account for font loading
- Test critical UI components
- Maintain baseline images

## Debugging Tests

### Common Issues and Solutions

#### Test Timeouts
```javascript
// Increase timeout for slow operations
test('slow operation', async () => {
  // ... test code
}, 30000); // 30 second timeout
```

#### Flaky E2E Tests
```javascript
// Use proper waits
await page.waitForLoadState('networkidle');
await page.waitForSelector('.element', { state: 'visible' });
```

#### Canvas Testing Issues
```javascript
// Ensure canvas mock is properly initialized
beforeEach(() => {
  global.canvasTestUtils.resetCanvasMocks();
});
```

### Debug Commands
```bash
# Run tests in debug mode
npm run test:debug

# Run specific test file
npm test -- tests/unit/core/JewelryCustomizer.test.js

# Run E2E tests in headed mode
npx playwright test --headed

# Debug specific E2E test
npx playwright test --debug tests/e2e/jewelry-customizer.spec.js
```

## Performance Monitoring

### Metrics Tracked
- Test execution time
- Memory usage during tests
- Canvas operation performance
- Bundle size impact
- Code coverage trends

### Performance Alerts
- Test suite execution > 10 minutes
- Individual test > 30 seconds
- Memory usage > 1GB during testing
- Coverage drop > 5%

## Accessibility Testing

### Automated Testing
- axe-core integration
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation

### Manual Testing Checklist
- [ ] Keyboard navigation works
- [ ] Screen reader announces content
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators are visible
- [ ] Alt text for images

## Security Testing

### Automated Security Checks
- Dependency vulnerability scanning
- Code security analysis
- Input validation testing
- XSS prevention verification

### Security Test Categories
- Authentication and authorization
- Input sanitization
- API security
- Client-side security
- Data protection

## Reporting and Analytics

### Test Reports
- Coverage reports (HTML, LCOV)
- Performance benchmarks
- Visual regression reports
- Security audit reports
- Accessibility compliance reports

### Metrics Dashboard
- Test pass/fail rates
- Coverage trends
- Performance benchmarks
- Error frequency
- Browser compatibility status

## Troubleshooting

### Common Problems

#### Tests Not Finding Elements
- Check selectors are correct
- Ensure elements are rendered
- Wait for asynchronous operations
- Verify test data is loaded

#### Mock Not Working
- Check import paths
- Verify mock is applied before test
- Ensure mock covers all used methods
- Reset mocks between tests

#### Visual Tests Failing
- Check for animation differences
- Verify font loading
- Compare baseline images
- Account for browser differences

#### Performance Tests Unstable
- Run on consistent hardware
- Isolate from other processes
- Use appropriate timeouts
- Account for garbage collection

### Getting Help

1. Check this documentation first
2. Review test logs and error messages
3. Search existing issues in the repository
4. Ask team members for assistance
5. Create detailed bug reports with reproduction steps

## Maintenance

### Regular Tasks
- Update test dependencies monthly
- Review and update baseline images
- Clean up obsolete tests
- Update documentation
- Review performance benchmarks

### Annual Reviews
- Evaluate testing strategy effectiveness
- Update browser support matrix
- Review accessibility standards compliance
- Assess security testing coverage
- Plan testing infrastructure improvements

---

This testing framework ensures high-quality, reliable software through comprehensive automation, clear processes, and continuous monitoring. Regular maintenance and updates keep the testing suite effective and relevant.