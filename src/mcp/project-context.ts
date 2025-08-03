import * as path from 'path';
import * as fs from 'fs';
import { ConversationScanner } from '../core/scanner.js';

export interface ProjectContext {
  currentProject?: string;
  availableProjects: string[];
  isClaudeCode: boolean;
  workingDirectory?: string;
  conversationBasePath: string;
}

export class ProjectContextDetector {
  private scanner: ConversationScanner;
  
  constructor() {
    this.scanner = new ConversationScanner();
  }

  async detectContext(): Promise<ProjectContext> {
    const cwd = process.cwd();
    const availableProjects = await this.scanner.listProjects();
    const isClaudeCode = this.isRunningInClaudeCode();
    
    // Try to detect project from current working directory
    const currentProject = await this.detectProjectFromCwd(cwd, availableProjects);
    
    return {
      currentProject,
      availableProjects,
      isClaudeCode,
      workingDirectory: cwd,
      conversationBasePath: process.env.CLAUDE_PROJECTS_PATH || 
        path.join(
          process.env.HOME || '',
          '.claude',
          'projects'
        ),
    };
  }

  isRunningInClaudeCode(): boolean {
    // Check for Claude Code specific environment variables or indicators
    return !!(
      process.env.CLAUDE_CODE ||
      process.env.MCP_SERVER_NAME === 'claude-grep' ||
      process.argv.some(arg => arg.includes('mcp'))
    );
  }

  private async detectProjectFromCwd(
    cwd: string,
    availableProjects: string[]
  ): Promise<string | undefined> {
    // Strategy 1: Check if CWD contains a project name
    const cwdParts = cwd.split(path.sep);
    
    for (const project of availableProjects) {
      if (cwdParts.includes(project)) {
        return project;
      }
    }

    // Strategy 2: Check git remote origin
    try {
      const gitConfig = await this.getGitProjectName(cwd);
      if (gitConfig && availableProjects.includes(gitConfig)) {
        return gitConfig;
      }
    } catch {
      // Git not available or not a git repo
    }

    // Strategy 3: Check parent directories for project indicators
    let currentPath = cwd;
    const homeDir = process.env.HOME || '';
    
    while (currentPath !== homeDir && currentPath !== path.dirname(currentPath)) {
      const dirName = path.basename(currentPath);
      
      // Check if this directory name matches a project
      if (availableProjects.includes(dirName)) {
        return dirName;
      }
      
      // Check for package.json or other project files
      try {
        const packagePath = path.join(currentPath, 'package.json');
        if (fs.existsSync(packagePath)) {
          const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
          const projectName = packageData.name;
          
          if (projectName && availableProjects.includes(projectName)) {
            return projectName;
          }
        }
      } catch {
        // Continue searching
      }
      
      currentPath = path.dirname(currentPath);
    }

    // Strategy 4: Fuzzy match directory name to project names
    const cwdBasename = path.basename(cwd).toLowerCase();
    for (const project of availableProjects) {
      if (
        project.toLowerCase().includes(cwdBasename) ||
        cwdBasename.includes(project.toLowerCase())
      ) {
        return project;
      }
    }

    return undefined;
  }

  private async getGitProjectName(cwd: string): Promise<string | undefined> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync(
        'git config --get remote.origin.url',
        { cwd }
      );
      
      // Extract project name from git URL
      const match = stdout.trim().match(/\/([^\/]+?)(?:\.git)?$/);
      return match ? match[1] : undefined;
    } catch {
      return undefined;
    }
  }

  async switchProject(projectName: string): Promise<void> {
    // Verify project exists
    const exists = await this.scanner.projectExists(projectName);
    if (!exists) {
      throw new Error(`Project '${projectName}' not found`);
    }
    
    // In MCP context, we don't actually "switch" projects globally,
    // but this could update preferences for the default project
  }

  getProjectPath(projectName: string): string {
    return this.scanner.getProjectPath(projectName);
  }
}