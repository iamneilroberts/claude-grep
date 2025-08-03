# Feature: Project Context Management

## Status: Completed
## Priority: Critical
## Owner: TBD

## Description
Handle multi-project conversation history by detecting the current project context and limiting searches appropriately. When used as an MCP server in Claude Code, searches should be limited to the current project. When used standalone, it should default to the most recent project with ability to switch.

## Requirements

### Functional
- Detect Claude conversation storage structure (~/.claude/conversation_history/{project_name}/)
- Auto-detect current project when running as MCP server
- Show current project context clearly in all interfaces
- Allow switching between projects
- Support searching across all projects when needed
- Remember last selected project for standalone usage

### Non-Functional
- Fast project detection (<100ms)
- Clear visual indication of active project
- Seamless project switching
- No data mixing between projects

## User Stories

### As a Claude Code user
- I want searches limited to my current project automatically
- I want to see which project I'm searching in
- I want to launch GUI that respects my project context

### As a standalone user
- I want the tool to remember my last project
- I want to easily switch between projects
- I want to search across all projects when needed

## Tasks
- TASK-003.1: Implement project detection logic
- TASK-003.2: Add project context to search engine
- TASK-003.3: Update MCP server for project awareness
- TASK-003.4: Add project switcher to web UI
- TASK-003.5: Update CLI with project flags
- TASK-003.6: Create project manager component

## Technical Design

### Project Detection
```typescript
interface ProjectContext {
  currentProject?: string;
  availableProjects: string[];
  isClaudeCode: boolean;
  projectPath?: string;
}

class ProjectDetector {
  async detectContext(): Promise<ProjectContext>;
  async listProjects(): Promise<string[]>;
  async switchProject(projectName: string): Promise<void>;
}
```

### Integration Points
- MCP server reads CWD to determine project
- Web UI shows project selector in header
- CLI accepts --project flag
- Search engine filters by project path

### Storage Structure
```
~/.claude/conversation_history/
├── travel-agent/
│   ├── conversation_1.jsonl
│   └── conversation_2.jsonl
├── chat-miner/
│   └── conversation_3.jsonl
└── other-project/
    └── conversation_4.jsonl
```

## Success Criteria
- [ ] Correctly detects current project in Claude Code
- [ ] Limits searches to current project by default
- [ ] Clear project indication in all interfaces
- [ ] Easy project switching mechanism
- [ ] Option to search all projects
- [ ] GUI launched from terminal maintains context