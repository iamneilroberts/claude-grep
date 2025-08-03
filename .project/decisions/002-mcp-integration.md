# Decision: MCP Server as Primary Interface

## Date: 2025-01-31
## Status: Accepted
## Context

We needed to decide how to integrate with Claude Desktop:
1. Direct file system integration
2. Browser extension
3. MCP (Model Context Protocol) server
4. Standalone app with copy/paste

## Decision

Use MCP server as the primary integration method, with CLI and Web UI as secondary interfaces.

## Rationale

MCP provides:
- Native integration with Claude Desktop
- Standardized protocol for tool exposure
- Automatic discovery and configuration
- Built-in error handling and validation

## Implementation Details

The MCP server will:
- Auto-detect project context from working directory
- Expose search tools with proper schemas
- Handle formatting based on preferences
- Provide progress updates for long operations

## Consequences

### Positive
- Seamless Claude Desktop integration
- Users can search without leaving Claude
- Consistent interface with other MCP tools
- Easy to install and configure

### Negative
- Requires understanding MCP protocol
- Limited to MCP's capabilities
- Must maintain compatibility with protocol changes

## Alternatives Considered

1. **Browser Extension**: Would require browser-specific code
2. **File Watcher**: Too invasive, performance concerns
3. **REST API**: Would require manual integration

## References
- MCP Documentation: https://modelcontextprotocol.org
- Claude Desktop MCP support announcement