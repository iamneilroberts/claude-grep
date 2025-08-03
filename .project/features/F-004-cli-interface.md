# Feature: Command Line Interface

## Status: Planning
## Priority: Medium
## Owner: TBD

## Description
Provide a comprehensive command-line interface for claude-grep that enables users to search conversation history, manage projects, and configure preferences directly from the terminal.

## Requirements

### Functional
- Search conversations with various filters and options
- List and switch between projects
- Configure user preferences
- Export results in multiple formats
- Provide clear help and usage information
- Support both interactive and non-interactive modes

### Non-Functional
- Fast startup time (<500ms)
- Clear and helpful error messages
- Intuitive command structure
- Cross-platform compatibility
- Minimal dependencies

## User Stories

### As a command-line user
- I want to quickly search my conversation history from the terminal
- I want to export search results to files for further processing
- I want to switch between projects without leaving the terminal
- I want to see my search results in a format I prefer

### As a power user
- I want to pipe search results to other commands
- I want to script searches for automation
- I want to configure default settings to save time
- I want detailed help for all commands and options

## Tasks
- TASK-F004-001: Build CLI Interface
  - Set up Commander.js framework
  - Implement search command with all options
  - Add project management commands
  - Create configuration commands
  - Add output format support
  - Implement help system

## Technical Design

### Command Structure
```bash
claude-grep <command> [options]

Commands:
  search <query>              Search conversation history
  projects list               List all projects
  projects use <name>         Set default project
  config get [key]           Get configuration value
  config set <key> <value>   Set configuration value
  mcp                        Start as MCP server
  web                        Start web UI server
```

### Search Options
```bash
Options:
  -f, --format <type>     Output format (table|list|csv|markdown|json)
  -p, --project <name>    Search specific project
  -e, --exhaustive        Use exhaustive search mode
  -t, --time <range>      Time range (e.g., "24h", "7d", "1m")
  -l, --limit <n>         Maximum results to return
  --files <pattern>       Filter by file pattern
  --all-projects          Search across all projects
```

## Success Criteria
- [ ] All commands work as documented
- [ ] Clear help text for all commands
- [ ] Proper exit codes for scripting
- [ ] Results can be piped to other commands
- [ ] Configuration persists between sessions
- [ ] Works on Windows, macOS, and Linux