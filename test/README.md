# Claude Grep Test Suite

This directory contains the comprehensive test suite for claude-grep, organized following the testing pyramid approach.

## Test Structure

```
test/
├── unit/               # Unit tests for individual components
│   ├── core/          # Core engine tests
│   ├── mcp/           # MCP server tests
│   └── formatters/    # Output formatter tests
├── integration/       # Integration tests
│   ├── search/        # Search workflow tests
│   └── project/       # Project management tests
├── e2e/              # End-to-end tests
│   ├── cli/          # CLI command tests
│   └── web/          # Web UI tests
├── fixtures/         # Test data and fixtures
└── utils/           # Test utilities and helpers
```

## Running Tests

### All Tests
```bash
npm test
```

### Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only (builds first)
npm run test:e2e

# Watch mode for development
npm run test:watch

# With coverage report
npm run test:coverage

# CI mode (optimized for CI/CD)
npm run test:ci
```

## Test Coverage

We maintain strict coverage thresholds:
- **Global**: 80% minimum for all metrics
- **Core components**: 85% minimum
- **Formatters**: 90% minimum

View coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

## Writing Tests

### Unit Tests
Test individual functions and classes in isolation:

```typescript
import { ConversationParser } from '@/core/parser';
import { conversationFixtures } from '../../fixtures/conversations';

describe('ConversationParser', () => {
  let parser: ConversationParser;

  beforeEach(() => {
    parser = new ConversationParser();
  });

  it('should parse valid JSONL files', async () => {
    // Test implementation
  });
});
```

### Integration Tests
Test interactions between multiple components:

```typescript
describe('Search Pipeline Integration', () => {
  it('should search across multiple projects', async () => {
    const results = await searchEngine.search('query', {
      baseDir: tempDir,
      searchAllProjects: true
    });
    
    expect(results.length).toBeGreaterThan(0);
  });
});
```

### E2E Tests
Test complete user workflows:

```typescript
describe('CLI End-to-End Tests', () => {
  it('should search with default options', () => {
    const result = execSync(`node ${cliPath} search "Hello"`);
    expect(result).toContain('Hello');
  });
});
```

## Test Fixtures

Use the provided fixtures for consistent test data:

```typescript
import { conversationFixtures, createJsonlContent } from '../fixtures/conversations';

// Use pre-defined conversation fixtures
const testConv = conversationFixtures.simple;

// Create JSONL content for file-based tests
const jsonl = createJsonlContent([testConv]);
```

## Test Utilities

Helper functions for common test operations:

```typescript
import { createTempDir, cleanupTempDir, writeJsonlFile } from '../utils/test-helpers';

// Create temporary directory for tests
const tempDir = await createTempDir('test-prefix');

// Write test data
await writeJsonlFile(path.join(tempDir, 'test.jsonl'), conversations);

// Clean up
await cleanupTempDir(tempDir);
```

## Performance Testing

Performance benchmarks are included in integration tests:

```typescript
it('should handle large conversations efficiently', async () => {
  const startTime = Date.now();
  const results = await searchEngine.search('query', options);
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(1000); // Under 1 second
});
```

## Debugging Tests

### Run specific test file
```bash
npm test -- path/to/test.ts
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should parse"
```

### Debug in VS Code
Add breakpoints and use the Jest debug configuration.

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Release tags

The CI pipeline:
1. Runs linting
2. Builds the project
3. Runs all tests with coverage
4. Uploads coverage reports

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should describe what they test
3. **Speed**: Keep unit tests fast (<100ms)
4. **Coverage**: Aim for meaningful coverage, not just numbers
5. **Fixtures**: Use consistent test data from fixtures
6. **Cleanup**: Always clean up resources (files, directories)
7. **Mocking**: Mock external dependencies appropriately

## Troubleshooting

### Tests failing locally but not in CI
- Check environment variables
- Ensure clean build: `rm -rf dist && npm run build`
- Clear Jest cache: `jest --clearCache`

### Timeout errors
- Increase timeout for slow operations
- Check for missing async/await
- Ensure proper cleanup in afterEach/afterAll

### Coverage not meeting threshold
- Run `npm run test:coverage` to see uncovered lines
- Focus on testing critical paths first
- Consider if threshold is appropriate for the component