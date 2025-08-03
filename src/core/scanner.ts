import * as fs from 'fs';
import * as path from 'path';
import { ConversationFile, SearchProgress } from './types.js';

export interface ScanOptions {
  projectFilter?: string;
  startDate?: Date;
  endDate?: Date;
  onProgress?: (progress: SearchProgress) => void;
}

export class ConversationScanner {
  private conversationBasePath: string;

  constructor(basePath?: string) {
    this.conversationBasePath = basePath || 
      process.env.CLAUDE_PROJECTS_PATH ||
      path.join(
        process.env.HOME || '',
        '.claude',
        'projects'
      );
  }

  /**
   * Scan for conversation files with optional filters
   */
  async scanConversations(options: ScanOptions = {}): Promise<ConversationFile[]> {
    const files: ConversationFile[] = [];
    
    if (!fs.existsSync(this.conversationBasePath)) {
      console.warn(`Conversation history directory not found: ${this.conversationBasePath}`);
      return files;
    }

    // Get all project directories
    const projectDirs = await this.getProjectDirectories();
    const totalProjects = projectDirs.length;
    let processedProjects = 0;

    for (const projectDir of projectDirs) {
      const projectName = path.basename(projectDir);
      
      // Apply project filter if specified
      if (options.projectFilter && projectName !== options.projectFilter) {
        continue;
      }

      const projectFiles = await this.scanProjectDirectory(projectDir, projectName, options);
      files.push(...projectFiles);

      processedProjects++;
      if (options.onProgress) {
        options.onProgress({
          filesProcessed: processedProjects,
          totalFiles: totalProjects,
          currentFile: projectDir,
          stage: 'scanning',
        });
      }
    }

    // Sort by last modified date, newest first
    files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    return files;
  }

  /**
   * Get all project directories
   */
  private async getProjectDirectories(): Promise<string[]> {
    try {
      const entries = await fs.promises.readdir(this.conversationBasePath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(this.conversationBasePath, entry.name));
    } catch (error) {
      console.error(`Error reading conversation base directory: ${error}`);
      return [];
    }
  }

  /**
   * Scan a single project directory for conversation files
   */
  private async scanProjectDirectory(
    projectDir: string,
    projectName: string,
    options: ScanOptions
  ): Promise<ConversationFile[]> {
    const files: ConversationFile[] = [];

    try {
      const entries = await fs.promises.readdir(projectDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.jsonl')) {
          continue;
        }

        const fullPath = path.join(projectDir, entry.name);
        const stats = await fs.promises.stat(fullPath);

        // Apply date filters if specified
        if (options.startDate && stats.mtime < options.startDate) {
          continue;
        }
        if (options.endDate && stats.mtime > options.endDate) {
          continue;
        }

        // Extract session ID from filename
        const sessionMatch = entry.name.match(/^(.+?)(?:_conversation)?\.jsonl$/);
        const sessionId = sessionMatch ? sessionMatch[1] : entry.name.replace('.jsonl', '');

        files.push({
          path: fullPath,
          sessionId,
          lastModified: stats.mtime,
          projectName,
        });
      }
    } catch (error) {
      console.error(`Error scanning project directory ${projectDir}: ${error}`);
    }

    return files;
  }

  /**
   * Get recent conversations across all projects or a specific project
   */
  async getRecentConversations(
    days: number = 7,
    projectFilter?: string
  ): Promise<ConversationFile[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.scanConversations({
      projectFilter,
      startDate: cutoffDate,
    });
  }

  /**
   * List all available projects
   */
  async listProjects(): Promise<string[]> {
    const projectDirs = await this.getProjectDirectories();
    return projectDirs.map(dir => path.basename(dir)).sort();
  }

  /**
   * Check if a project exists
   */
  async projectExists(projectName: string): Promise<boolean> {
    const projectPath = path.join(this.conversationBasePath, projectName);
    try {
      const stats = await fs.promises.stat(projectPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get the path to a specific project's conversation directory
   */
  getProjectPath(projectName: string): string {
    return path.join(this.conversationBasePath, projectName);
  }
}