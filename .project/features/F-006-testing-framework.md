# Feature: Testing Framework

## Status: Completed
## Priority: Medium
## Owner: TBD

## Description
Establish a comprehensive testing framework that ensures reliability and correctness across all components of claude-grep. The framework should support unit, integration, and end-to-end testing with realistic test data.

## Requirements

### Functional
- Unit tests for all core components
- Integration tests for feature interactions
- End-to-end tests for user workflows
- Performance benchmarks
- Test data generation utilities
- Coverage reporting
- CI/CD integration

### Non-Functional
- Tests run in <2 minutes (unit tests)
- Test coverage >80% for core components
- Deterministic test results
- Minimal test flakiness
- Easy to add new tests

## User Stories

### As a developer
- I want tests to catch bugs before deployment
- I want to refactor code with confidence
- I want clear test failures when something breaks
- I want to easily add tests for new features

### As a contributor
- I want to run tests locally before submitting
- I want to understand what tests cover
- I want examples of how to test new features
- I want fast feedback on my changes

## Tasks
- TASK-F006-001: Set Up Test Framework
  - Jest configuration for TypeScript
  - Test utilities and helpers
  - Mock data generators
  - Coverage configuration
  - CI/CD integration

## Technical Design

### Test Structure
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
│   └── web-ui-e2e/   # Web UI tests with mcp-chrome
├── fixtures/         # Test data
└── utils/           # Test utilities
```

### Test Categories

#### Unit Tests
- Parser: JSONL parsing, error handling
- Scanner: File discovery, filtering
- Search: Query matching, relevance scoring
- Formatters: Output generation
- Project: Detection and switching

#### Integration Tests
- Search pipeline: Parser → Scanner → Search
- MCP integration: Server → Core → Results
- CLI integration: Commands → Core → Output

#### E2E Tests
- CLI workflows: Search, export, configure
- Web UI workflows: Search, drill-down, export (using mcp-chrome)
- Cross-platform: Windows, macOS, Linux

#### Web UI E2E Testing with mcp-chrome
- Automated browser testing using Chrome MCP server
- Real user interaction simulation
- Visual regression testing
- Performance testing
- Accessibility testing
- Cross-browser compatibility

### Test Data
```typescript
// Realistic conversation structures
const testConversation = {
  messages: [
    { role: 'user', content: 'How do I implement auth?' },
    { role: 'assistant', content: 'Here\'s how...' }
  ],
  metadata: {
    sessionId: 'test-session-123',
    timestamp: '2024-01-15T10:30:00Z',
    project: 'test-project'
  }
};
```

### Web UI E2E Testing Integration

#### mcp-chrome Setup
The project now includes mcp-chrome for automated browser testing:

```json
// .mcp.json
{
  "mcp-chrome": {
    "command": "node",
    "args": [
      "/usr/local/lib/node_modules/mcp-chrome-bridge/dist/mcp/mcp-server-stdio.js"
    ]
  }
}
```

#### Test Files Structure
```
test/web-ui-e2e/
├── WEB-UI-TEST-PLAN.md     # Comprehensive test plan
├── test-scenarios.md       # Specific test scenarios for mcp-chrome
├── quick-test-guide.md     # Quick testing instructions
└── results/               # Test execution results
```

#### Key Testing Scenarios
1. **Smoke Tests**: Basic functionality verification
2. **Search Workflows**: Real-time search, filtering, formatting
3. **Project Management**: Switching between projects
4. **UI Interactions**: Modals, dropdowns, forms
5. **Responsive Design**: Mobile, tablet, desktop layouts
6. **Performance**: Load times, search speed, memory usage
7. **Accessibility**: Keyboard navigation, screen readers
8. **Error Handling**: Network failures, invalid inputs

#### Test Execution with Claude
Tests are designed to be executed by asking Claude to use mcp-chrome:

```
Using mcp-chrome, please test the web UI:
1. Navigate to http://localhost:3000
2. Search for "error"
3. Switch to List view
4. Take screenshots and report results
```

## Success Criteria
- [x] All tests pass reliably
- [x] Coverage >80% for core components
- [x] Tests run quickly (<2 min for unit tests)
- [x] Clear test documentation
- [x] Easy to debug failures
- [x] Web UI E2E testing with mcp-chrome
- [ ] CI/CD pipeline configured