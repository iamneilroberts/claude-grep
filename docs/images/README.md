# Screenshot Instructions

This folder contains screenshots for the Claude Grep documentation.

## Required Screenshots

Please add the following screenshots:

1. **web-ui-overview.png** - Full view of the web interface showing:
   - Header with project selector
   - Search bar
   - Results in table format
   - Compact layout

2. **cli-table-output.png** - Terminal showing:
   - A search command being run
   - Table format output with results
   - Good example: `claude-grep search "mcp" --format table`

3. **web-ui-search.png** - Web UI showing:
   - Active search results
   - Detail panel open with conversation view
   - Search highlighting in conversation

## How to Take Screenshots

### For Web UI:
1. Start the web server: `npm run web:dev`
2. Open http://localhost:3000
3. Run a search with good example data
4. Take screenshot with your preferred tool

### For CLI:
1. Use a clean terminal with good contrast
2. Run example commands
3. Capture the full output

## Screenshot Guidelines

- Use high resolution (retina/2x if possible)
- Include relevant UI elements but crop unnecessary whitespace
- Show real search results (but ensure no sensitive data)
- Keep file sizes reasonable (use PNG format)
- Recommended width: 1200-1400px for web UI, terminal width for CLI

## Updating README

After adding screenshots, commit them:

```bash
git add docs/images/*.png
git commit -m "Add documentation screenshots"
git push
```

The images will automatically display in the README on GitHub.