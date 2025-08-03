# Feature: Project Rename to Claude Grep

## Status: Completed ✅
## Priority: High
## Owner: TBD

## Description
Rename the project from "claude-chat-miner" to "claude-grep" to better reflect its functionality as a grep-like tool for Claude conversations. The new name is more concise and immediately conveys the tool's purpose.

## Requirements

### Functional
- Update all references to "claude-chat-miner" throughout the codebase
- Maintain backward compatibility where possible
- Update documentation to reflect new name
- Ensure all installation methods work with new name
- Update command-line interface to use new name
- Preserve existing functionality

### Non-Functional
- Minimal disruption to existing users
- Clear migration path documented
- Consistent branding across all touchpoints
- SEO-friendly naming for discoverability

## User Stories

### As an existing user
- I want clear instructions on migrating to the new name
- I want my existing configurations to continue working
- I want to understand why the name changed
- I want the transition to be seamless

### As a new user
- I want the name to clearly indicate what the tool does
- I want consistent naming across documentation
- I want installation instructions that work
- I want to easily find the tool by its new name

## Tasks
- TASK-F007-001: Rename to claude-grep
  - Update package.json
  - Update README.md
  - Update CLAUDE.md
  - Update .mcp.json
  - Update task documentation
  - Update directory name
  - Update git configuration
  - Test all functionality

## Technical Design

### Naming Changes
```
Old: claude-chat-miner
New: claude-grep

Binary: claude-chat-miner → claude-grep
Package: claude-chat-miner → claude-grep
Repository: claude-chat-miner → claude-grep
```

### Compatibility Considerations
- Consider providing alias for old command name (temporary)
- Update any hardcoded paths
- Ensure MCP server name consistency
- Update all documentation examples

### Migration Path
1. Update all code references
2. Test functionality thoroughly
3. Update documentation
4. Publish with new name
5. Announce change to users
6. Maintain redirect from old repository

## Success Criteria
- [ ] All references updated consistently
- [ ] No functionality broken by rename
- [ ] Documentation accurately reflects new name
- [ ] Installation works with new name
- [ ] MCP integration continues to work
- [ ] Git history preserved
- [ ] Users can find and install the tool