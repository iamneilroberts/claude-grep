# Claude Grep Sub-Agents

This directory contains specifications for specialized sub-agents that can be invoked to handle specific complex tasks within the claude-grep project.

## Available Agents

### GitHub Repository Reviewer Agent
**File**: `github-repo-reviewer.md`  
**Purpose**: Reviews projects before they're pushed to GitHub to ensure best practices, completeness, and security.

**Key capabilities**:
- Repository structure analysis
- Documentation verification
- Security scanning for secrets and sensitive data
- Installation validation
- Best practices compliance
- License and legal review

**When to use**: Before pushing to GitHub, especially for initial repository creation or major releases.

## How to Use Sub-Agents

Sub-agents are invoked using the Task tool with `subagent_type: "general-purpose"`. Include a reference to the specific agent specification file in your prompt.

Example:
```
Review this repository for GitHub readiness using the GitHub Repository Review Agent guidelines 
at .project/agents/github-repo-reviewer.md
```

## Creating New Sub-Agents

When creating new sub-agents:

1. Create a new `.md` file in this directory
2. Include:
   - Clear purpose statement
   - Specific capabilities
   - Detailed checklist or process
   - Output format specification
   - Usage instructions
3. Update this README.md
4. Add documentation to CLAUDE.md

## Agent Design Principles

- **Specific Focus**: Each agent should have a narrow, well-defined purpose
- **Comprehensive Coverage**: Within their domain, agents should be thorough
- **Clear Output**: Define exactly what the agent will report
- **Actionable Results**: Outputs should guide next steps
- **Self-Contained**: Agent specs should include all needed information