# Web UI E2E Test Plan with mcp-chrome

## Overview
This test plan outlines the end-to-end testing strategy for the Claude Grep web interface using the mcp-chrome MCP server for browser automation.

## Prerequisites
- Chrome browser installed
- mcp-chrome extension installed in Chrome
- mcp-chrome-bridge installed globally (`npm install -g mcp-chrome-bridge`)
- Web server running (`npm run web:dev`)

## Test Environment Setup

### 1. Start the Web Application
```bash
# Terminal 1: Start the web server
npm run web:dev
# Server runs on http://localhost:3000
# Vite dev server runs on http://localhost:5173
```

### 2. Configure MCP Chrome
The mcp-chrome server is already configured in `.mcp.json`:
```json
{
  "mcp-chrome": {
    "command": "node",
    "args": [
      "/usr/local/lib/node_modules/mcp-chrome-bridge/dist/mcp/mcp-server-stdio.js"
    ]
  }
}
```

## Test Scenarios

### 1. Basic Navigation and UI Elements

#### Test 1.1: Homepage Load
- **Objective**: Verify the application loads correctly
- **Steps**:
  1. Navigate to http://localhost:3000
  2. Verify page title is "Claude Grep"
  3. Check that main components are visible:
     - Header with title
     - Project selector
     - Search bar
     - Results area
- **Expected**: All elements load without errors

#### Test 1.2: Responsive Design
- **Objective**: Verify responsive behavior
- **Steps**:
  1. Test at different viewport sizes:
     - Desktop: 1920x1080
     - Tablet: 768x1024
     - Mobile: 375x667
  2. Check layout adjustments
  3. Verify all features remain accessible
- **Expected**: UI adapts appropriately to each screen size

### 2. Project Management

#### Test 2.1: Project List Loading
- **Objective**: Verify projects load correctly
- **Steps**:
  1. Click on project selector dropdown
  2. Verify list of available projects appears
  3. Check current project is highlighted
- **Expected**: Projects load from file system

#### Test 2.2: Project Switching
- **Objective**: Test project switching functionality
- **Steps**:
  1. Select a different project from dropdown
  2. Verify UI updates to show new project
  3. Check that search results are cleared
  4. Perform a search in the new project context
- **Expected**: Smooth project transition

### 3. Search Functionality

#### Test 3.1: Basic Search
- **Objective**: Test simple search queries
- **Steps**:
  1. Enter "test" in search bar
  2. Wait for results to appear
  3. Verify results display correctly
  4. Check result count and metadata
- **Expected**: Real-time search results

#### Test 3.2: Advanced Search Options
- **Objective**: Test search filters
- **Steps**:
  1. Click settings icon in search bar
  2. Enable "Exhaustive search"
  3. Set time range to "Last 7 days"
  4. Enable "Only show conversations with errors"
  5. Perform search
  6. Verify filters are applied
- **Expected**: Filtered results match criteria

#### Test 3.3: Real-time Search
- **Objective**: Test debounced search
- **Steps**:
  1. Type slowly in search bar
  2. Verify search triggers after 300ms pause
  3. Type quickly
  4. Verify only one search executes
- **Expected**: Efficient search behavior

### 4. Results Display

#### Test 4.1: Table View
- **Objective**: Test table format display
- **Steps**:
  1. Ensure "Table" format is selected
  2. Perform a search
  3. Verify table columns:
     - Time
     - Project
     - Preview
     - Messages
     - Score
     - Actions
  4. Check sorting functionality
- **Expected**: Properly formatted table

#### Test 4.2: List View
- **Objective**: Test list format display
- **Steps**:
  1. Switch to "List" format
  2. Verify layout changes
  3. Check all information is displayed
  4. Test hover effects
- **Expected**: Clean list layout

#### Test 4.3: Format Switching
- **Objective**: Test all output formats
- **Steps**:
  1. Test each format:
     - Table
     - List
     - CSV
     - Markdown
     - JSON
  2. Verify correct rendering
- **Expected**: Each format displays appropriately

### 5. Conversation Details

#### Test 5.1: View Full Conversation
- **Objective**: Test conversation modal
- **Steps**:
  1. Click "View" button on a result
  2. Verify modal opens
  3. Check conversation details:
     - Session ID
     - Timestamps
     - All messages
     - File references
  4. Test scrolling in long conversations
- **Expected**: Full conversation visible

#### Test 5.2: Modal Interactions
- **Objective**: Test modal behavior
- **Steps**:
  1. Click outside modal to close
  2. Click X button to close
  3. Press ESC key to close
  4. Verify modal closes properly
- **Expected**: Multiple close methods work

### 6. Export Functionality

#### Test 6.1: Export Results
- **Objective**: Test export feature
- **Steps**:
  1. Perform a search with results
  2. Click "Export" button
  3. Verify file downloads
  4. Check file format (JSON)
  5. Validate exported data
- **Expected**: Correct data export

### 7. Performance Testing

#### Test 7.1: Search Performance
- **Objective**: Measure search speed
- **Steps**:
  1. Search in a large project
  2. Measure time to first result
  3. Measure time to complete
  4. Test with 1000+ results
- **Expected**: <100ms first result

#### Test 7.2: UI Responsiveness
- **Objective**: Test UI under load
- **Steps**:
  1. Perform rapid searches
  2. Switch projects quickly
  3. Open/close modals repeatedly
  4. Monitor for UI freezes
- **Expected**: Smooth performance

### 8. Error Handling

#### Test 8.1: Network Errors
- **Objective**: Test offline behavior
- **Steps**:
  1. Disconnect network
  2. Try various operations
  3. Verify error messages
  4. Reconnect and retry
- **Expected**: Graceful error handling

#### Test 8.2: Invalid Inputs
- **Objective**: Test input validation
- **Steps**:
  1. Enter special characters in search
  2. Try XSS payloads
  3. Test extremely long queries
  4. Submit empty searches
- **Expected**: Proper validation

### 9. Accessibility Testing

#### Test 9.1: Keyboard Navigation
- **Objective**: Test keyboard accessibility
- **Steps**:
  1. Navigate using Tab key
  2. Test Enter/Space activation
  3. Use arrow keys in dropdowns
  4. Test focus indicators
- **Expected**: Full keyboard access

#### Test 9.2: Screen Reader
- **Objective**: Test screen reader support
- **Steps**:
  1. Enable screen reader
  2. Navigate all elements
  3. Verify ARIA labels
  4. Test dynamic content announcements
- **Expected**: Proper announcements

## Automated Test Implementation

### Using mcp-chrome for Automation

```javascript
// Example test structure using mcp-chrome
async function testSearchWorkflow() {
  // Navigate to the application
  await chrome.navigate('http://localhost:3000');
  
  // Wait for page load
  await chrome.waitForSelector('.search-input');
  
  // Perform search
  await chrome.type('.search-input', 'test query');
  
  // Wait for results
  await chrome.waitForSelector('.results-table');
  
  // Verify results
  const resultCount = await chrome.evaluate(() => {
    return document.querySelectorAll('.results-table tbody tr').length;
  });
  
  assert(resultCount > 0, 'Should have search results');
}
```

## Test Data Requirements

### Sample Conversation Files
- Create test JSONL files in `~/.claude/projects/test-project/`
- Include various scenarios:
  - Normal conversations
  - Conversations with errors
  - Conversations with tool calls
  - Long conversations (1000+ messages)
  - Recent and old conversations

### Test Projects
1. `test-project-small`: 10 conversations
2. `test-project-medium`: 100 conversations
3. `test-project-large`: 1000+ conversations
4. `test-project-empty`: No conversations

## Success Metrics

- **Coverage**: All user workflows tested
- **Performance**: All operations < 2s
- **Reliability**: 0% test flakiness
- **Accessibility**: WCAG 2.1 AA compliance
- **Cross-browser**: Chrome, Firefox, Safari support

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Web UI E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run web:test:e2e
```

## Reporting

### Test Results Format
- Screenshots on failure
- Performance metrics
- Accessibility audit results
- Browser console logs
- Network request logs

## Maintenance

- Review and update tests monthly
- Add tests for new features
- Remove obsolete tests
- Update test data regularly
- Monitor test execution time