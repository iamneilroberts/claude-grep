import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ProjectContextDetector, ProjectContext } from '../mcp/project-context.js';
import { ConversationScanner } from './scanner.js';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

export interface ProjectConfig {
  lastProject?: string;
  projectHistory: string[];
  lastUpdated: Date;
}

export class ProjectManager {
  private configPath: string;
  private config: ProjectConfig;
  private contextDetector: ProjectContextDetector;
  private scanner: ConversationScanner;

  constructor() {
    const homeDir = process.env.HOME || '';
    const configDir = path.join(homeDir, '.claude-grep');
    this.configPath = path.join(configDir, 'project-config.json');
    this.contextDetector = new ProjectContextDetector();
    this.scanner = new ConversationScanner();
    this.config = {
      projectHistory: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Initialize the project manager and load config
   */
  async initialize(): Promise<void> {
    await this.ensureConfigDir();
    await this.loadConfig();
  }

  /**
   * Get the current project context with persistence support
   */
  async getCurrentContext(): Promise<ProjectContext> {
    const context = await this.contextDetector.detectContext();
    
    // If no project detected and we have a last project, use it
    if (!context.currentProject && this.config.lastProject) {
      const projects = await this.scanner.listProjects();
      const projectExists = projects.includes(this.config.lastProject);
      
      if (projectExists) {
        context.currentProject = this.config.lastProject;
      }
    }
    
    return context;
  }

  /**
   * Switch to a different project
   */
  async switchProject(projectName: string): Promise<void> {
    // Verify project exists
    const projects = await this.scanner.listProjects();
    if (!projects.includes(projectName)) {
      throw new Error(`Project '${projectName}' not found`);
    }
    
    // Update config
    this.config.lastProject = projectName;
    
    // Update project history
    const historyIndex = this.config.projectHistory.indexOf(projectName);
    if (historyIndex > -1) {
      this.config.projectHistory.splice(historyIndex, 1);
    }
    this.config.projectHistory.unshift(projectName);
    
    // Keep only last 10 projects in history
    if (this.config.projectHistory.length > 10) {
      this.config.projectHistory = this.config.projectHistory.slice(0, 10);
    }
    
    await this.saveConfig();
  }

  /**
   * Remember a project for future use
   */
  async rememberProject(projectName: string): Promise<void> {
    this.config.lastProject = projectName;
    await this.saveConfig();
  }

  /**
   * Get the last used project
   */
  getLastProject(): string | undefined {
    return this.config.lastProject;
  }

  /**
   * Get project history
   */
  getProjectHistory(): string[] {
    return [...this.config.projectHistory];
  }

  /**
   * Clear project memory
   */
  async clearProjectMemory(): Promise<void> {
    this.config.lastProject = undefined;
    this.config.projectHistory = [];
    await this.saveConfig();
  }

  /**
   * Ensure config directory exists
   */
  private async ensureConfigDir(): Promise<void> {
    const configDir = path.dirname(this.configPath);
    
    try {
      await mkdir(configDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Load configuration from disk
   */
  private async loadConfig(): Promise<void> {
    try {
      const data = await readFile(this.configPath, 'utf-8');
      const loaded = JSON.parse(data);
      
      // Merge with defaults
      this.config = {
        ...this.config,
        ...loaded,
        lastUpdated: new Date(loaded.lastUpdated || Date.now()),
      };
    } catch (error) {
      // Config doesn't exist yet, use defaults
    }
  }

  /**
   * Save configuration to disk
   */
  private async saveConfig(): Promise<void> {
    this.config.lastUpdated = new Date();
    
    try {
      await writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save project config:', error);
    }
  }

  /**
   * Static instance for singleton pattern
   */
  private static instance: ProjectManager;

  static async getInstance(): Promise<ProjectManager> {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
      await ProjectManager.instance.initialize();
    }
    return ProjectManager.instance;
  }
}