# Claude Grep - System Design

## Overview
Claude Grep is a tool for searching and analyzing Claude conversation history. It provides multiple interfaces: CLI, MCP server, and web UI.

## Architecture

### Core Components

1. **Core Search Engine** (`src/core/`)
   - JSONL parser with streaming support
   - Search algorithms and relevance scoring
   - File pattern matching
   - Time-based filtering

2. **MCP Server** (`src/mcp/`)
   - Implements Model Context Protocol
   - Exposes search tools to Claude Desktop
   - Handles formatting and preferences

3. **Web UI** (`src/web/`)
   - Express.js backend as MCP client
   - React frontend with minimal design
   - Real-time search updates

4. **CLI Interface** (`src/cli/`)
   - Command-line tool for direct search
   - Setup wizard for configuration
   - Multiple output formats

### Data Flow
```
[Claude Conversations] -> [Parser] -> [Search Engine] -> [Results]
                                           ^
                                           |
                            [MCP Server] <--+
                            [Web Server] <--+
                            [CLI]        <--+
```

## Design Principles
- **Local First**: All data stays on user's machine
- **Depth Over Speed**: Prioritize thorough, complete results over fast responses
- **Completeness**: Find all relevant conversations, even if it takes longer
- **Extensibility**: Plugin architecture for custom analyzers
- **Compatibility**: Works with existing Claude file format
- **Minimal Design**: Clean, functional interfaces
- **Type Safety**: Full TypeScript implementation

## Security Considerations
- No network requests except for updates
- All processing happens locally
- No telemetry or analytics
- Conversation data never leaves the machine

## Performance Philosophy
- **Thoroughness First**: Complete search coverage is more important than speed
- **Progressive Results**: Display results as they're found during long searches
- **Memory Efficiency**: Handle large datasets without crashes
- **User Control**: Let users choose between fast and exhaustive search modes