# TASK-003: Implement MCP Server

## Status: COMPLETED
## Priority: HIGH
## Assignee: Unassigned
## Created: 2025-08-02

## Description
Create the Model Context Protocol (MCP) server that exposes claude-grep functionality to Claude Desktop. This allows users to search their conversation history directly within Claude.

## Acceptance Criteria
- [ ] Implement MCP server following the protocol specification
- [ ] Expose search tool with all options
- [ ] Support all output formats
- [ ] Auto-detect project context from Claude Code
- [ ] Handle preferences and persistence
- [ ] Provide clear tool descriptions for Claude
- [ ] Support conversation drill-down

## Implementation Checklist

### 1. MCP Server Setup (`src/mcp/server.ts`)
- [ ] Initialize MCP SDK server
- [ ] Set up transport (stdio)
- [ ] Implement error handling
- [ ] Add logging for debugging
- [ ] Handle graceful shutdown

### 2. Search Tool (`src/mcp/tools/search.ts`)
- [ ] Define search tool with parameters
- [ ] Map tool inputs to search engine
- [ ] Format results based on preferences
- [ ] Include project context
- [ ] Support all search options

### 3. Preferences Tool (`src/mcp/tools/preferences.ts`)
- [ ] Get current preferences
- [ ] Set output format preference
- [ ] Set default project
- [ ] Persist preferences

### 4. Project Tools (`src/mcp/tools/projects.ts`)
- [ ] List available projects
- [ ] Get current project
- [ ] Switch project
- [ ] Search all projects option

## Technical Design

### Tool Definitions
```typescript
const searchTool = {
  name: "search_conversations",
  description: "Search Claude conversation history in the current project",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (keywords, file names, or patterns)"
      },
      format: {
        type: "string",
        enum: ["table", "list", "csv", "markdown", "json"],
        description: "Output format (default: table)"
      },
      exhaustive: {
        type: "boolean",
        description: "Use exhaustive search (slower but complete)"
      },
      timeRange: {
        type: "string",
        description: "Time range (e.g., '24h', '7d', '1m')"
      },
      project: {
        type: "string",
        description: "Override project context"
      }
    },
    required: ["query"]
  }
};

const drillDownTool = {
  name: "get_conversation",
  description: "Get full conversation details by session ID",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Session ID from search results"
      },
      format: {
        type: "string",
        enum: ["markdown", "json"],
        description: "Output format (default: markdown)"
      }
    },
    required: ["sessionId"]
  }
};
```

### MCP Integration Flow
1. Claude Desktop starts MCP server via npx
2. Server detects current working directory
3. Maps CWD to project context
4. Exposes tools with project-aware defaults
5. Returns formatted results to Claude

### Output Format Examples

#### Table Format
```
Session               Time          Match Preview                    Files
4dK92La_conversati... 17 hours ago  ...TypeScript error in...       src/types.ts
```

#### Markdown Format
```markdown
## Search Results: "TypeScript error"

### Session 4dK92La (17 hours ago)
**Files:** src/types.ts, src/index.ts

> ...when dealing with TypeScript errors in the type system...

[View Full Conversation](#4dK92La)
```

## Configuration
- MCP server should read from `~/.claude-grep/config.json`
- Support environment variables for overrides
- Auto-create config if missing

## Error Handling
- [ ] Handle missing conversation files gracefully
- [ ] Provide helpful error messages
- [ ] Log errors for debugging
- [ ] Never crash the MCP server
- [ ] Timeout long operations

## Testing Requirements
- [ ] Test with Claude Desktop integration
- [ ] Test all tool inputs and edge cases
- [ ] Test project context detection
- [ ] Test output formatting
- [ ] Test error scenarios
- [ ] Performance test with large datasets

## User Experience
- Tool descriptions should be clear and helpful
- Error messages should suggest solutions
- Results should be immediately useful
- Support natural language queries
- Provide examples in descriptions

## Notes
- Reference travel-agent MCP implementation
- Follow MCP SDK best practices
- Keep tool interface simple and intuitive
- Consider adding more tools based on user feedback