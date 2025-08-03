# Claude Grep - Development Start Guide

## Quick Start

Welcome to the claude-grep project! This guide will help you get started with development.

### First Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Review Key Documents**
   - `.project/overview/SYSTEM-DESIGN.md` - Understand the architecture
   - `.project/features/F-003-project-context.md` - Critical project context feature
   - `.project/guidelines/DEVELOPMENT.md` - Coding standards
   - `.project/agents/` - Available sub-agents for specialized tasks

3. **Development Tasks**
   The project needs the following components extracted/implemented:
   
   - [ ] Extract search engine from travel-agent project
   - [ ] Implement project context detection
   - [ ] Create MCP server wrapper
   - [ ] Build CLI interface
   - [ ] Add output formatters
   - [ ] Set up test framework

### Key Implementation Notes

#### Project Context (CRITICAL)
The tool MUST detect which project it's searching in:
- In Claude Code: Auto-detect from working directory
- Standalone: Remember last project, allow switching
- Conversations stored in: `~/.claude/conversation_history/{project_name}/`

#### Search Philosophy
**Depth Over Speed** - Always prioritize complete results:
- Process every file, even if slow
- Handle corrupted JSON gracefully
- Provide progress indicators
- Support exhaustive mode

### File Locations to Extract From

From `/home/neil/dev/claude-travel-agent-v2/`:
1. **Search Implementation**: `mcp-local-servers/claude-chat-miner/src/`
2. **Output Formatters**: Look for formatter classes
3. **Test Files**: Any test files for chat miner
4. **MCP Integration**: Check how it's configured in `.mcp.json`

### Development Commands

```bash
# Run in development mode
npm run dev

# Run MCP server locally
npm run mcp:dev

# Run tests
npm test

# Launch web UI development
npm run web:dev
```

### Testing Approach

1. Create test conversations in a test project folder
2. Test all output formats work correctly
3. Verify project context detection
4. Test exhaustive vs normal search modes
5. Ensure preferences persistence

### Architecture Overview

```
Core Search Engine
    ↓
Project Context Manager
    ↓
┌─────────────┬──────────────┬────────────┐
│ MCP Server  │     CLI      │   Web UI   │
└─────────────┴──────────────┴────────────┘
```

### Next Development Session

When you return to this project:
1. Check git status for any uncommitted work
2. Review this file for context
3. Check `.project/tasks/` for any new task files
4. Run tests to ensure nothing is broken

### Important Reminders

- **No Network Calls**: Everything runs locally
- **Stream Large Files**: Don't load entire conversations into memory
- **Test with Real Data**: Use actual Claude conversation files
- **Document Changes**: Update .project docs as you work

### Contact Points

- Main project: `/home/neil/dev/claude-travel-agent-v2/`
- This project: `/home/neil/dev/claude-grep/`
- MCP config: `~/.config/Claude/claude_desktop_config.json`

---

**Remember**: This tool helps Claude Code users find their past solutions. Make it thorough, reliable, and user-friendly.