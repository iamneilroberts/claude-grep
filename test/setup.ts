// Test setup file for Jest
const fs = require('fs');
const path = require('path');

// Set up test environment variables
process.env.NODE_ENV = 'test';

// Create a mock home directory for tests
const mockHome = path.join(__dirname, '.test-home');
process.env.HOME = mockHome;

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Ensure test directories exist
beforeAll(async () => {
  await fs.promises.mkdir(mockHome, { recursive: true });
});

// Clean up after all tests
afterAll(async () => {
  try {
    await fs.promises.rm(mockHome, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});