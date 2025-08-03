# Quick Test Guide for Web UI with mcp-chrome

## Quick Start

### 1. Start the Web Server
```bash
# In one terminal
npm run web:dev
```

### 2. Open Chrome
Make sure the mcp-chrome extension is installed and active.

### 3. Test with Claude

Simply ask Claude to run any of these quick tests:

## Basic Smoke Test
```
Using mcp-chrome, please:
1. Go to http://localhost:3000
2. Search for "test"
3. Click View on any result
4. Take screenshots
```

## Quick Functionality Check
```
Using mcp-chrome, please verify these features work:
1. Search bar (type "error")
2. Project switcher (if multiple projects)
3. Format switcher (try Table and List)
4. Export button
5. View conversation modal
```

## Performance Check
```
Using mcp-chrome, please:
1. Go to http://localhost:3000
2. Time how long it takes to load
3. Search for "*" and time the results
4. Report the performance
```

## Mobile View Test
```
Using mcp-chrome, please:
1. Go to http://localhost:3000
2. Resize browser to 375x667 (mobile)
3. Check if everything still works
4. Take a screenshot
```

## What to Look For

### ✅ Good Signs:
- Page loads quickly (< 2s)
- Search results appear fast (< 500ms)
- All buttons are clickable
- Modals open and close properly
- No console errors

### ❌ Issues to Report:
- Slow loading times
- Buttons not working
- Layout breaking on mobile
- Search not returning results
- JavaScript errors in console

## Sample Test Report

After running tests, you can ask Claude:

```
Please summarize the test results:
- What worked well?
- What issues were found?
- Include screenshots
- Any performance concerns?
```

## Automated Test Loop

For continuous testing:

```
Using mcp-chrome, please run these tests every 5 minutes for 30 minutes:
1. Navigate to http://localhost:3000
2. Perform a search
3. Check for errors
4. Log the results
```

## Tips

1. **Always include screenshots** - They help diagnose issues
2. **Check the console** - JavaScript errors are important
3. **Test edge cases** - Empty searches, special characters
4. **Verify responsiveness** - Different screen sizes
5. **Monitor performance** - Loading and search times

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Page won't load | Check if server is running on port 3000 |
| No search results | Verify conversation files exist in ~/.claude/projects/ |
| Slow performance | Check browser dev tools for errors |
| Layout broken | Clear cache and reload |
| Export not working | Check browser download settings |

## Integration with CI/CD

These tests can be automated in CI/CD by:
1. Starting the server in CI environment
2. Using headless Chrome with mcp-chrome
3. Running the test scenarios
4. Collecting screenshots and reports
5. Failing the build on test failures

Remember: The goal is to ensure the web UI works reliably for all users!