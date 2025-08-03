# Claude Grep

Grep-like tool for searching Claude conversation history with powerful filtering, multiple output formats, and project-aware context.

![Claude Grep Web UI](docs/images/web-ui-overview.png)

## Features

- **Comprehensive Search**: Find conversations by keywords, files, errors, or patterns
- **Multiple Output Formats**: Table, list, CSV, markdown, JSON
- **Project Context**: Automatically limits searches to current project
- **Drill-down Capability**: View full conversations with context
- **Exhaustive Mode**: Deep search that prioritizes completeness
- **MCP Integration**: Works seamlessly with Claude Desktop

## Installation

### NPM (Recommended)
```bash
npm install -g claude-grep
```

### From Source
```bash
git clone https://github.com/iamneilroberts/claude-grep.git
cd claude-grep
npm install
npm run build
npm link
```

## MCP (Model Context Protocol) Configuration

claude-grep integrates with Claude Desktop through MCP, allowing you to search conversations directly within Claude.

### Setting up MCP for Claude Desktop

1. **Open Claude Desktop settings**
   - On macOS: `Claude` → `Settings` → `Developer` → `Edit Config`
   - On Windows: `File` → `Preferences` → `Developer` → `Edit Config`

2. **Add claude-grep to your MCP settings:**

```json
{
  "mcpServers": {
    "claude-grep": {
      "command": "npx",
      "args": ["claude-grep", "mcp"]
    }
  }
}
```

3. **Restart Claude Desktop** for the changes to take effect.

### Alternative MCP Configuration (Local Installation)

If you installed from source or want to use a specific installation:

```json
{
  "mcpServers": {
    "claude-grep": {
      "command": "node",
      "args": ["/path/to/claude-grep/dist/mcp/server.js"]
    }
  }
}
```

### Using claude-grep in Claude Desktop

Once configured, you can use natural language to search your conversations:

- "Search for conversations about TypeScript errors"
- "Find where we discussed the authentication system"
- "Show me conversations mentioning package.json"
- "Export conversation abc123 to a file"

The MCP integration provides these tools:
- `search_conversations` - Search with keywords
- `search_for_files` - Find conversations mentioning specific files
- `get_conversation_details` - View full conversation
- `export_conversation` - Export conversation to file (great for Claude's compact view)
- `list_projects` - See all your projects
- `switch_project` - Change active project

## Quick Start

### CLI Usage

```bash
# Search for a keyword
claude-grep search "TypeError"

# Search with table output (default)
claude-grep search "async function" --format table

# Search in specific project
claude-grep search "bug fix" --project my-project

# Exhaustive search (slower but complete)
claude-grep search "edge case" --exhaustive
```

![CLI Table Output](docs/images/cli-table-output.png)

### In Claude Desktop

After MCP setup, use these commands in Claude:

- Search: "search for conversations about TypeScript errors"
- Files: "find when I last edited package.json"
- Drill-down: "show me the full conversation about that bug fix"

## Output Formats

### Table Format (Default)
```
Session               Time          Match Preview                    Files
4dK92La_conversati... 17 hours ago  ...dealing with TypeScript err... src/types.ts, src/index.ts
9mN31Pb_conversati... 2 days ago    ...fixed the async/await issue... lib/async.js
```

### List Format
```
1. Session 4dK92La (17 hours ago)
   Files: src/types.ts, src/index.ts
   Match: "...when dealing with TypeScript errors in the..."
   
2. Session 9mN31Pb (2 days ago)
   Files: lib/async.js
   Match: "...successfully fixed the async/await issue by..."
```

## Advanced Usage

### Web UI

Launch the web interface for visual search:

```bash
# Start web server on default port (3000)
claude-grep web

# Start on custom port
claude-grep web --port 8080

# Start without opening browser
claude-grep web --no-open
```

The web interface provides:
- Real-time search with live results
- Project switching
- Conversation drill-down with in-conversation search
- Multiple output format support
- Claude-inspired dark theme

![Web UI Search Results](docs/images/web-ui-search.png)

**Security Note**: The web server is designed for local use only. Your conversation data never leaves your machine. Do not expose the web server to the internet as it does not include authentication.

### Persistent Preferences

Set your default output format:

```bash
claude-grep config set format markdown
```

## Development

```bash
# Clone the repository
git clone https://github.com/iamneilroberts/claude-grep.git
cd claude-grep

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## Troubleshooting

### MCP Connection Issues

If claude-grep isn't working in Claude Desktop:

1. **Check the configuration path**
   - Ensure the config file is saved in the correct location
   - Common locations:
     - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Verify installation**
   ```bash
   # Check if claude-grep is installed globally
   npm list -g claude-grep
   
   # Test MCP server directly
   npx claude-grep mcp
   ```

3. **Check Claude Desktop logs**
   - Open Developer Tools in Claude Desktop
   - Look for MCP-related errors in the console

4. **Common fixes**
   - Restart Claude Desktop after configuration changes
   - Ensure you have the latest version of claude-grep
   - Check that Node.js is in your system PATH

### Permission Issues

If you encounter permission errors:

```bash
# On macOS/Linux
sudo npm install -g claude-grep

# Or use a Node version manager like nvm
nvm use 18
npm install -g claude-grep
```

## License

MIT