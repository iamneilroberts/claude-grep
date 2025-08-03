# TASK-007: Set Up Test Framework

## Status: TODO
## Priority: MEDIUM
## Assignee: Unassigned
## Created: 2025-08-02

## Description
Establish a comprehensive testing framework that ensures reliability and correctness across all components. Tests should use real conversation data structures and cover edge cases thoroughly.

## Acceptance Criteria
- [ ] Jest configuration for TypeScript
- [ ] Unit tests for core components
- [ ] Integration tests for search functionality
- [ ] E2E tests for CLI commands
- [ ] Test data generation utilities
- [ ] CI/CD ready test suite
- [ ] Coverage reporting >80%

## Implementation Checklist

### 1. Test Setup (`test/setup.ts`)
- [ ] Configure Jest for TypeScript
- [ ] Set up test environment variables
- [ ] Create test data fixtures
- [ ] Mock file system for tests
- [ ] Configure coverage thresholds

### 2. Test Utilities (`test/utils/`)
- [ ] Conversation data generators
- [ ] Mock project structures
- [ ] Assertion helpers
- [ ] Performance measurement tools
- [ ] File system mocks

### 3. Core Engine Tests (`test/core/`)

#### Parser Tests (`test/core/parser.test.ts`)
```typescript
describe('JSONL Parser', () => {
  it('should parse valid JSONL files');
  it('should handle corrupted JSON lines');
  it('should stream large files efficiently');
  it('should extract metadata correctly');
  it('should handle empty files');
  it('should handle files with only corrupted data');
});
```

#### Search Tests (`test/core/search.test.ts`)
```typescript
describe('Search Engine', () => {
  it('should find exact keyword matches');
  it('should rank results by relevance');
  it('should filter by time range');
  it('should match file patterns');
  it('should handle regex patterns');
  it('should respect project boundaries');
  it('should handle exhaustive mode');
});
```

#### Project Context Tests (`test/core/project-context.test.ts`)
```typescript
describe('Project Context', () => {
  it('should detect Claude Code environment');
  it('should map CWD to project name');
  it('should list all available projects');
  it('should handle missing projects');
  it('should persist project selection');
  it('should validate project paths');
});
```

### 4. Formatter Tests (`test/formatters/`)
- [ ] Test each formatter with various inputs
- [ ] Test edge cases (empty results, special chars)
- [ ] Test format validity (JSON, CSV)
- [ ] Test truncation and pagination
- [ ] Test streaming capabilities

### 5. CLI Tests (`test/cli/`)
```typescript
describe('CLI Commands', () => {
  describe('search command', () => {
    it('should search with basic query');
    it('should support all format options');
    it('should handle missing arguments');
    it('should respect project context');
  });
  
  describe('project commands', () => {
    it('should list projects');
    it('should switch projects');
    it('should show current project');
  });
});
```

### 6. MCP Server Tests (`test/mcp/`)
- [ ] Test tool definitions
- [ ] Test request/response handling
- [ ] Test error scenarios
- [ ] Test project context integration
- [ ] Test preference persistence

### 7. Integration Tests (`test/integration/`)
```typescript
describe('End-to-End Search', () => {
  it('should search across multiple conversation files');
  it('should handle concurrent searches');
  it('should cancel long-running searches');
  it('should export results in all formats');
  it('should maintain project isolation');
});
```

## Test Data Structure

### Sample Conversation Files
```
test/fixtures/conversations/
├── project-a/
│   ├── valid_conversation.jsonl
│   ├── corrupted_conversation.jsonl
│   └── large_conversation.jsonl (1000+ lines)
├── project-b/
│   └── test_conversation.jsonl
└── empty-project/
```

### Test Data Generator
```typescript
interface TestDataOptions {
  projectName: string;
  conversationCount: number;
  messagesPerConversation: number;
  includeErrors?: boolean;
  includeFiles?: string[];
}

function generateTestData(options: TestDataOptions): void {
  // Generate realistic conversation data
}
```

## Performance Testing

### Benchmarks to Track
- Search speed vs. number of conversations
- Memory usage during search
- Streaming performance
- Parser throughput
- Formatter speed

### Performance Test Example
```typescript
describe('Performance', () => {
  it('should search 1000 conversations in < 5 seconds', async () => {
    const start = Date.now();
    const results = await search('test', { exhaustive: true });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
  
  it('should use < 200MB memory for large datasets', async () => {
    const memBefore = process.memoryUsage().heapUsed;
    await searchLargeDataset();
    const memAfter = process.memoryUsage().heapUsed;
    expect(memAfter - memBefore).toBeLessThan(200 * 1024 * 1024);
  });
});
```

## CI/CD Configuration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

## Coverage Requirements
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

## Testing Best Practices
- Use descriptive test names
- Test one thing per test
- Use beforeEach/afterEach for setup/cleanup
- Mock external dependencies
- Test error paths thoroughly
- Use realistic test data
- Keep tests fast and isolated

## Mock Strategies

### File System Mocking
```typescript
jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
  access: jest.fn(),
}));
```

### Time Mocking
```typescript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-08-02'));
});

afterEach(() => {
  jest.useRealTimers();
});
```

## Documentation
- [ ] Add testing section to README
- [ ] Document how to run specific tests
- [ ] Explain test data structure
- [ ] Include coverage badge
- [ ] Document performance benchmarks