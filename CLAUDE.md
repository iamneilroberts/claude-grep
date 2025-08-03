# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Grep is a grep-like tool for searching and analyzing Claude conversation history with multiple interfaces (CLI, MCP server, and Web UI). The project prioritizes **depth over speed** - always favoring complete, thorough results over fast responses.

## Common Development Commands

```bash
# Build the TypeScript project
npm run build

# Run in development mode with hot reload
npm run dev

# Run tests
npm test
npm run test:watch    # Watch mode

# Lint and format code
npm run lint
npm run format

# Run specific interfaces in development
npm run mcp:dev      # MCP server development
npm run web:dev      # Web UI development (starts both server and Vite)
```

## Architecture & Structure

The project follows a modular architecture with clear separation of concerns:

```
src/
├── core/          # Core search engine and business logic
│                  # JSONL parser, search algorithms, file matching
├── mcp/           # Model Context Protocol server
│                  # Exposes search tools to Claude Desktop
├── web/           # Web UI (Express backend + React frontend)
│                  # Backend acts as MCP client
└── cli/           # Command-line interface
                   # Direct search access with multiple output formats
```

### Key Architectural Principles
- **Local First**: All data processing happens on user's machine
- **Stream Processing**: Handle large files without loading into memory
- **Project Context Aware**: Automatically limits searches to current project
- **Type Safety**: Full TypeScript with strict mode enabled

## Critical Implementation Notes

### Project Context Detection (CRITICAL)
The tool MUST detect and respect project boundaries:
- In Claude Code: Auto-detect from working directory
- Standalone: Remember last project, allow switching
- Conversations stored in: `~/.claude/conversation_history/{project_name}/`

### Search Philosophy
Always prioritize completeness:
- Process every file, even if slow
- Handle corrupted JSON gracefully (skip and continue)
- Provide progress indicators for long operations
- Support both normal and exhaustive search modes

### Error Handling Pattern
```typescript
// Continue processing on errors
try {
  const parsed = JSON.parse(line);
  yield parsed;
} catch (error) {
  console.warn(`Skipping malformed line: ${error.message}`);
  continue;
}
```

## Extracting From Travel Agent Project

The original implementation exists in `/home/neil/dev/claude-travel-agent-v2/mcp-local-servers/claude-chat-miner/` (now extracted and renamed to claude-grep). Key files that were extracted:
- Search implementation and core logic
- Output formatters (table, list, CSV, markdown, JSON)
- MCP server configuration
- Test files and test data

## Testing Approach

```bash
# Run a single test file
npm test -- path/to/test.ts

# Run tests with coverage
npm test -- --coverage
```

Tests should:
- Use real conversation data structures
- Test all output formats
- Verify project context detection
- Test both normal and exhaustive search modes
- Handle corrupted data gracefully

## Important Development Guidelines

1. **No Network Calls**: Everything runs locally on the user's machine
2. **Memory Efficiency**: Use async iterators and streaming for large files
3. **Progress Feedback**: Long operations must show progress
4. **Respect Project Boundaries**: Never mix data between projects
5. **Graceful Degradation**: Continue processing even when individual files fail

## Module Resolution

The project uses TypeScript path aliases:
- `@/*` maps to `./src/*`

Example: `import { SearchEngine } from '@/core/search'`

## MCP Integration

For Claude Desktop integration, the tool is configured in:
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

## Web UI Development

The web interface uses:
- Express.js backend (acts as MCP client)
- React frontend with Vite
- Minimal, functional design
- Real-time search updates

## Development Workflow

- Always consult the ./project/tasks/TASK-MASTER-LIST.md before starting or resuming a task. Update status of tasks when complete 

## Next Steps

Check `.project/START-HERE.md` for current development tasks and status. The project needs:
1. Core search engine extraction from travel-agent
2. Project context detection implementation
3. MCP server wrapper
4. CLI interface with output formatters
5. Web UI components
6. Comprehensive test suite

## Project Startup Procedures

- Check .project folder on startup and before starting any planning or coding

## Available Sub-Agents

### GitHub Repository Reviewer Agent

This specialized agent reviews projects before they're pushed to GitHub to ensure best practices, completeness, and security.

**When to use**: Before pushing any project to GitHub, especially for initial repository creation or major releases.

**Capabilities**:
- Comprehensive repository structure analysis
- Documentation completeness verification  
- Security and sensitive data scanning
- Installation and setup validation
- Best practices compliance checking
- License and legal compliance review

**How to invoke**: Use the Task tool with `subagent_type: "general-purpose"` and prompt:
```
Review this repository for GitHub readiness using the GitHub Repository Review Agent guidelines 
at .project/agents/github-repo-reviewer.md. Check for documentation completeness, security issues, 
proper .gitignore, installation instructions, and overall best practices.
```

The agent will provide a detailed report with:
- Summary and readiness score
- Critical issues that must be fixed
- Warnings for quality improvements
- Suggestions for enhancements
- Complete checklist of all review points

**Agent specification**: See `.project/agents/github-repo-reviewer.md` for full details.