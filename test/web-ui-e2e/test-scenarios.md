# Web UI Test Scenarios for mcp-chrome

## How to Execute Tests with mcp-chrome

These test scenarios are designed to be executed using Claude with the mcp-chrome MCP server. Each scenario provides step-by-step instructions that can be given to Claude to perform automated browser testing.

## Prerequisites Check

```
Please verify:
1. Chrome browser is open
2. mcp-chrome extension is active
3. Web server is running on http://localhost:3000
```

## Test Execution Template

When executing tests with Claude + mcp-chrome, use this format:

```
Using mcp-chrome, please:
1. Navigate to http://localhost:3000
2. [Specific test steps]
3. Take a screenshot and report results
```

## Scenario 1: Initial Load Test

### Prompt for Claude:
```
Using mcp-chrome, please test the initial load of Claude Grep:

1. Navigate to http://localhost:3000
2. Wait for the page to fully load
3. Check for the presence of these elements:
   - Header with "Claude Grep" title
   - Search input field
   - Project selector dropdown
   - Results area
4. Take a screenshot of the loaded page
5. Report any console errors or missing elements
```

### Expected Results:
- Page loads within 2 seconds
- All main UI components are visible
- No console errors
- Clean, functional layout

## Scenario 2: Search Functionality Test

### Prompt for Claude:
```
Using mcp-chrome, please test the search functionality:

1. Navigate to http://localhost:3000
2. Click on the search input field
3. Type "error" slowly (to test real-time search)
4. Wait for search results to appear
5. Count the number of results displayed
6. Take a screenshot of the search results
7. Click on the format dropdown and change to "List" view
8. Take another screenshot
9. Report the search performance and any issues
```

### Expected Results:
- Search triggers after 300ms pause in typing
- Results appear within 1 second
- Results display correctly in both table and list views
- Smooth format switching

## Scenario 3: Project Switching Test

### Prompt for Claude:
```
Using mcp-chrome, please test project switching:

1. Navigate to http://localhost:3000
2. Click on the project selector dropdown
3. Take a screenshot of available projects
4. Select a different project (if available)
5. Verify the search results are cleared
6. Perform a search in the new project
7. Take a screenshot of results
8. Report the project switching behavior
```

### Expected Results:
- Project list loads correctly
- Switching projects clears previous results
- Search works in the new project context
- UI updates to reflect current project

## Scenario 4: Advanced Search Options Test

### Prompt for Claude:
```
Using mcp-chrome, please test advanced search options:

1. Navigate to http://localhost:3000
2. Click the settings/gear icon next to the search bar
3. Take a screenshot of the search options panel
4. Enable "Exhaustive search"
5. Set time range to "Last 7 days"
6. Enable "Only show conversations with errors"
7. Type "test" in the search field
8. Wait for filtered results
9. Take a screenshot of the results
10. Verify the filters are applied correctly
```

### Expected Results:
- Options panel opens smoothly
- All filter options are functional
- Search respects all applied filters
- Results show appropriate badges (error, tool calls)

## Scenario 5: Conversation Detail View Test

### Prompt for Claude:
```
Using mcp-chrome, please test viewing full conversations:

1. Navigate to http://localhost:3000
2. Perform a search for "Claude"
3. Wait for results to load
4. Click the "View" button on the first result
5. Wait for the modal to open
6. Take a screenshot of the conversation modal
7. Scroll through the conversation (if long)
8. Try to close the modal by:
   - Clicking the X button
   - Clicking outside the modal
9. Report the modal behavior and any issues
```

### Expected Results:
- Modal opens smoothly
- Full conversation is displayed
- Messages show correct formatting
- Modal closes properly using both methods
- Scrolling works for long conversations

## Scenario 6: Export Functionality Test

### Prompt for Claude:
```
Using mcp-chrome, please test the export feature:

1. Navigate to http://localhost:3000
2. Perform a search with at least 5 results
3. Click the "Export" button
4. Check if a download is triggered
5. Take a screenshot before clicking export
6. Report what happens when export is clicked
7. If possible, check the Downloads folder for the exported file
```

### Expected Results:
- Export button is visible when results exist
- Clicking triggers a file download
- File is named with timestamp
- Downloaded file contains valid JSON

## Scenario 7: Responsive Design Test

### Prompt for Claude:
```
Using mcp-chrome, please test responsive design:

1. Navigate to http://localhost:3000
2. Set viewport to desktop size (1920x1080)
3. Take a screenshot
4. Resize to tablet view (768x1024)
5. Take a screenshot and note layout changes
6. Resize to mobile view (375x667)
7. Take a screenshot
8. Test that search still works in mobile view
9. Report any UI issues at different sizes
```

### Expected Results:
- Layout adapts at each breakpoint
- Mobile menu works properly
- All features remain accessible
- No horizontal scrolling on mobile

## Scenario 8: Performance Test

### Prompt for Claude:
```
Using mcp-chrome, please test performance:

1. Navigate to http://localhost:3000
2. Open browser DevTools Network tab
3. Clear network log
4. Perform a search for "*"
5. Measure time from search start to first result
6. Continue typing rapidly (5 different searches)
7. Check if UI remains responsive
8. Take a screenshot of network activity
9. Report performance metrics
```

### Expected Results:
- First result appears < 100ms
- UI doesn't freeze during rapid searches
- Network requests are properly debounced
- Memory usage remains stable

## Scenario 9: Error Handling Test

### Prompt for Claude:
```
Using mcp-chrome, please test error handling:

1. Navigate to http://localhost:3000
2. Open DevTools and go to Network tab
3. Set network to "Offline"
4. Try to perform a search
5. Take a screenshot of any error message
6. Try to switch projects
7. Set network back to "Online"
8. Retry the search
9. Report how errors are displayed
```

### Expected Results:
- Clear error messages when offline
- UI doesn't break
- Graceful recovery when back online
- No infinite loading states

## Scenario 10: Accessibility Quick Test

### Prompt for Claude:
```
Using mcp-chrome, please test basic accessibility:

1. Navigate to http://localhost:3000
2. Press Tab key repeatedly
3. Note the focus order and visibility
4. Try to activate search using only keyboard
5. Use Enter key to submit search
6. Use arrow keys in dropdowns
7. Take screenshots of focus indicators
8. Check for any elements unreachable by keyboard
```

### Expected Results:
- Logical tab order
- Visible focus indicators
- All interactive elements keyboard accessible
- Proper ARIA labels (check DevTools)

## Automated Test Report Template

After running tests, use this template for reporting:

```markdown
# Web UI Test Report - [Date]

## Test Environment
- Browser: Chrome [version]
- URL: http://localhost:3000
- mcp-chrome: Active

## Test Results Summary
- Total Scenarios: X
- Passed: X
- Failed: X
- Blocked: X

## Detailed Results

### Scenario 1: [Name]
- Status: PASS/FAIL
- Duration: Xs
- Screenshots: [links]
- Issues Found: None/[list]

[Repeat for each scenario]

## Performance Metrics
- Page Load: Xms
- Time to First Result: Xms
- Average Search Time: Xms

## Accessibility Issues
- [List any found]

## Recommendations
- [List any improvements]
```

## Tips for Using mcp-chrome

1. **Take Screenshots**: Always capture visual evidence
2. **Check Console**: Look for JavaScript errors
3. **Measure Timing**: Use performance metrics
4. **Test Edge Cases**: Empty states, long lists, special characters
5. **Verify Animations**: Ensure smooth transitions
6. **Check Network**: Monitor API calls
7. **Test Interactions**: Clicks, hovers, focus states

## Continuous Testing

These scenarios should be run:
- Before each release
- After major changes
- Weekly for regression testing
- When issues are reported

Store results in: `/test/web-ui-e2e/results/[date]/`