/**
 * Test environment configuration
 * Sets up environment variables for testing
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Set test-specific environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.SESSION_SECRET = 'test-session-secret-key';

// Disable console.log during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
}

// Mock external services if needed
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
      close: jest.fn().mockResolvedValue()
    }),
    close: jest.fn().mockResolvedValue()
  })
}));

module.exports = {
  testTimeout: 30000,
  maxConcurrency: 1, // Run tests sequentially to avoid database conflicts
};