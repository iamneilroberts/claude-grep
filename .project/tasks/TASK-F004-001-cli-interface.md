# TASK-004: Build CLI Interface

## Status: TODO
## Priority: MEDIUM
## Assignee: Unassigned
## Created: 2025-08-02

## Description
Create a comprehensive command-line interface for claude-grep that provides direct access to search functionality with multiple output formats and configuration options.

## Acceptance Criteria
- [ ] Implement main search command with all options
- [ ] Support all output formats (table, list, csv, markdown, json)
- [ ] Add project management commands
- [ ] Include configuration commands
- [ ] Provide helpful command descriptions
- [ ] Support both flags and interactive mode
- [ ] Include setup wizard for first-time users

## Implementation Checklist

### 1. CLI Framework Setup (`src/cli/index.ts`)
- [ ] Set up Commander.js for command parsing
- [ ] Define main entry point
- [ ] Add version and description
- [ ] Implement help system
- [ ] Handle unknown commands gracefully

### 2. Search Command (`src/cli/commands/search.ts`)
- [ ] Implement search command with query argument
- [ ] Add format option (--format, -f)
- [ ] Add project option (--project, -p)
- [ ] Add exhaustive flag (--exhaustive, -e)
- [ ] Add time range option (--time, -t)
- [ ] Add limit option (--limit, -l)
- [ ] Support file pattern filters

### 3. Project Commands (`src/cli/commands/projects.ts`)
- [ ] `projects list` - List all available projects
- [ ] `projects use <name>` - Set default project
- [ ] `projects current` - Show current project
- [ ] Add project detection info display

### 4. Config Commands (`src/cli/commands/config.ts`)
- [ ] `config get <key>` - Get configuration value
- [ ] `config set <key> <value>` - Set configuration
- [ ] `config list` - Show all configuration
- [ ] `config reset` - Reset to defaults

### 5. Setup Command (`src/cli/commands/setup.ts`)
- [ ] Interactive setup wizard
- [ ] Check for conversation history
- [ ] Set default output format
- [ ] Configure default project
- [ ] Test search functionality

## Command Examples

```bash
# Basic search
claude-grep search "TypeError"

# Search with options
claude-grep search "async function" --format markdown --exhaustive

# Search in specific project
claude-grep search "bug fix" --project travel-agent

# Search with time range
claude-grep search "refactor" --time 7d

# Search for files
claude-grep search --files "*.test.ts"

# Project management
claude-grep projects list
claude-grep projects use my-app
claude-grep projects current

# Configuration
claude-grep config set format table
claude-grep config get format
claude-grep config list

# Setup wizard
claude-grep setup
```

## Output Handling

### Progress Indicators
```
Searching conversations... [████████████████----] 80% (16/20 files)
Found 3 matches in project 'travel-agent'
```

### Error Messages
```
Error: No conversation history found for project 'unknown-project'
Hint: Use 'claude-grep projects list' to see available projects
```

### Success Formatting
- Use colors for better readability (when supported)
- Align columns in table output
- Truncate long content with ellipsis
- Show total results count
- Display search time for exhaustive searches

## Configuration Schema

```typescript
interface CLIConfig {
  defaultFormat: 'table' | 'list' | 'csv' | 'markdown' | 'json';
  defaultProject?: string;
  exhaustiveByDefault: boolean;
  colorOutput: boolean;
  maxResults: number;
  showTimestamps: boolean;
}
```

## Interactive Features

### Auto-completion
- [ ] Generate completion scripts for bash/zsh
- [ ] Support project name completion
- [ ] Support format completion

### Interactive Mode (Future)
```bash
claude-grep interactive
> search "error"
> format markdown
> project use travel-agent
> exit
```

## Testing Requirements
- [ ] Test all command variations
- [ ] Test with missing/invalid arguments
- [ ] Test output formatting
- [ ] Test configuration persistence
- [ ] Test setup wizard flow
- [ ] Test with no conversation history

## User Experience
- Provide helpful examples in --help
- Show hints for common mistakes
- Use consistent flag naming
- Support both long and short flags
- Clear error messages with solutions

## Package Configuration
- Set up proper bin entry in package.json
- Include shebang in entry file
- Make executable during build
- Test global installation

## Dependencies
- Commander.js for CLI framework
- Chalk for colored output (optional)
- Ora for progress spinners (optional)
- Inquirer for interactive prompts (setup wizard)