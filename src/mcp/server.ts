#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SearchEngine } from '../core/search.js';
import { ConversationScanner } from '../core/scanner.js';
import { ResultProcessor } from '../core/results.js';
import { createProgressReporter } from '../core/progress.js';
import { SearchResult } from '../core/types.js';
import { ProjectManager } from '../core/project-manager.js';
import { PreferencesManager } from './preferences.js';
import { ProjectContextDetector } from './project-context.js';
import { ConversationLoader } from './conversation-loader.js';
import { 
  createSearchTool,
  createSearchFilesTool,
  createGetConversationTool,
  createProjectTools,
  createPreferencesTools,
  createWebTools,
} from './tools/index.js';
import { formatResults } from './formatters/index.js';

export class ClaudeGrepMCPServer {
  private server: Server;
  private searchEngine: SearchEngine;
  private scanner: ConversationScanner;
  private resultProcessor: ResultProcessor;
  private preferencesManager: PreferencesManager;
  private projectDetector: ProjectContextDetector;
  private projectManager: ProjectManager | null = null;
  private conversationLoader: ConversationLoader;
  private webInterfaceUrl: string | null = null;

  constructor() {
    // Initialize server
    this.server = new Server(
      {
        name: 'claude-grep',
        version: '1.0.0',
        description: 'Search and analyze Claude conversation history',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize components
    this.preferencesManager = PreferencesManager.getInstance();
    this.projectDetector = new ProjectContextDetector();
    this.scanner = new ConversationScanner();
    this.searchEngine = new SearchEngine();
    this.resultProcessor = new ResultProcessor();
    this.conversationLoader = new ConversationLoader();

    // Set up handlers
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle list tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        ...createSearchTool(),
        ...createSearchFilesTool(),
        ...createGetConversationTool(),
        ...createProjectTools(),
        ...createPreferencesTools(),
      ];
      
      // Add web tools if web interface is available
      if (this.webInterfaceUrl) {
        tools.push(...createWebTools());
      }

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Initialize project manager if not in Claude Code
        if (!this.projectManager && !this.projectDetector.isRunningInClaudeCode()) {
          this.projectManager = await ProjectManager.getInstance();
        }

        // Detect current project context
        const projectContext = this.projectManager 
          ? await this.projectManager.getCurrentContext()
          : await this.projectDetector.detectContext();

        switch (name) {
          case 'search_conversations':
            return await this.handleSearchConversations(args, projectContext);
          
          case 'search_for_files':
            return await this.handleSearchForFiles(args, projectContext);
          
          case 'get_conversation_details':
            return await this.handleGetConversationDetails(args);
          
          case 'list_projects':
            return await this.handleListProjects();
          
          case 'get_current_project':
            return await this.handleGetCurrentProject(projectContext);
          
          case 'switch_project':
            return await this.handleSwitchProject(args);
          
          case 'get_preferences':
            return await this.handleGetPreferences();
          
          case 'set_preferences':
            return await this.handleSetPreferences(args);
          
          case 'reset_preferences':
            return await this.handleResetPreferences();
          
          case 'open_web_interface':
            return await this.handleOpenWebInterface();
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in ${name}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    });
  }

  private async handleSearchConversations(args: any, projectContext: any): Promise<any> {
    const {
      query,
      format = this.preferencesManager.get('display.defaultFormat'),
      exhaustive = this.preferencesManager.get('search.exhaustive'),
      maxResults = this.preferencesManager.get('search.maxResults'),
      timeRange,
      project,
      searchAllProjects,
      includeErrors,
      includeToolCalls,
      filePatterns,
    } = args;

    // Determine project to search
    const searchProject = searchAllProjects ? undefined : (project || projectContext.currentProject);

    // Create progress reporter if in exhaustive mode
    const progressReporter = exhaustive ? createProgressReporter({ type: 'silent' }) : undefined;

    // Create search engine with progress reporter
    const searchEngine = new SearchEngine(undefined, {}, progressReporter);
    const searchResults: SearchResult[] = [];
    
    // Perform search
    for await (const result of searchEngine.search({
      query,
      projectContext: searchProject,
      exhaustive,
      limit: maxResults,
      timeRange: this.parseTimeRange(timeRange),
      includeErrors,
      includeToolCalls,
      filePatterns: filePatterns ? filePatterns.split(',').map((p: string) => p.trim()) : undefined,
    })) {
      searchResults.push(result);
    }

    // Process results
    const processed = this.resultProcessor.processResults(searchResults, {
      maxResults,
      highlightKeywords: query.split(' '),
    });

    // Format output
    const formatted = formatResults(processed.results, format, {
      includeStats: true,
      searchStats: processed.searchStats,
    });

    return {
      content: [{
        type: 'text',
        text: formatted
      }]
    };
  }

  private async handleSearchForFiles(args: any, projectContext: any): Promise<any> {
    const {
      filePattern,
      format = this.preferencesManager.get('display.defaultFormat'),
      maxResults = this.preferencesManager.get('search.maxResults'),
      timeRange,
      project,
    } = args;

    const searchProject = project || projectContext.currentProject;

    // Search for files
    const searchEngine = new SearchEngine();
    const results: SearchResult[] = [];
    
    for await (const result of searchEngine.search({
      query: '',
      projectContext: searchProject,
      filePatterns: [filePattern],
      limit: maxResults,
      timeRange: this.parseTimeRange(timeRange),
    })) {
      results.push(result);
    }

    // Format output
    const formatted = formatResults(results, format);

    return {
      content: [{
        type: 'text',
        text: formatted
      }]
    };
  }

  private async handleGetConversationDetails(args: any): Promise<any> {
    const { 
      sessionId, 
      format = 'markdown',
      includeContext,
      highlightMatches,
      searchTerms
    } = args;
    
    try {
      const details = await this.conversationLoader.loadConversation(sessionId);
      
      if (!details) {
        return {
          content: [{
            type: 'text',
            text: `Conversation ${sessionId} not found.`
          }]
        };
      }
      
      const formatted = this.conversationLoader.formatConversation(
        details,
        format,
        {
          includeContext,
          highlightMatches,
          searchTerms: searchTerms ? searchTerms.split(',').map((s: string) => s.trim()) : undefined
        }
      );
      
      return {
        content: [{
          type: 'text',
          text: formatted
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error loading conversation: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private async handleListProjects(): Promise<any> {
    const projects = await this.scanner.listProjects();
    
    return {
      content: [{
        type: 'text',
        text: `Available projects:\n${projects.map(p => `- ${p}`).join('\n')}`
      }]
    };
  }

  private async handleGetCurrentProject(projectContext: any): Promise<any> {
    return {
      content: [{
        type: 'text',
        text: `Current project: ${projectContext.currentProject || 'No project detected'}\nWorking directory: ${projectContext.workingDirectory || 'Unknown'}`
      }]
    };
  }

  private async handleSwitchProject(args: any): Promise<any> {
    const { project } = args;
    
    // If we have a project manager (standalone mode), use it
    if (this.projectManager) {
      await this.projectManager.switchProject(project);
    }
    
    // Also update preferences for consistency
    await this.preferencesManager.set('search.defaultProject', project);
    
    return {
      content: [{
        type: 'text',
        text: `Switched to project: ${project}`
      }]
    };
  }

  private async handleGetPreferences(): Promise<any> {
    const prefs = this.preferencesManager.getAll();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(prefs, null, 2)
      }]
    };
  }

  private async handleSetPreferences(args: any): Promise<any> {
    for (const [key, value] of Object.entries(args)) {
      if (key !== 'tool') {
        await this.preferencesManager.set(key as any, value);
      }
    }
    
    return {
      content: [{
        type: 'text',
        text: 'Preferences updated successfully'
      }]
    };
  }

  private async handleResetPreferences(): Promise<any> {
    await this.preferencesManager.reset();
    
    return {
      content: [{
        type: 'text',
        text: 'Preferences reset to defaults'
      }]
    };
  }

  private async handleOpenWebInterface(): Promise<any> {
    if (!this.webInterfaceUrl) {
      return {
        content: [{
          type: 'text',
          text: 'Web interface is not available. The MCP server needs to be started with the --with-web flag to enable the web interface.'
        }]
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: `Claude Grep web interface is available at: ${this.webInterfaceUrl}\n\nYou can open this URL in your browser to access the visual search interface.`
      }]
    };
  }

  setWebInterfaceUrl(url: string): void {
    this.webInterfaceUrl = url;
  }

  private parseTimeRange(timeRange?: string): { start?: Date; end?: Date } | undefined {
    if (!timeRange) return undefined;

    const now = new Date();
    const match = timeRange.match(/^(\d+)([hdwmy])$/);
    
    if (!match) return undefined;

    const [, amount, unit] = match;
    const value = parseInt(amount);
    const start = new Date(now);

    switch (unit) {
      case 'h':
        start.setHours(start.getHours() - value);
        break;
      case 'd':
        start.setDate(start.getDate() - value);
        break;
      case 'w':
        start.setDate(start.getDate() - value * 7);
        break;
      case 'm':
        start.setMonth(start.getMonth() - value);
        break;
      case 'y':
        start.setFullYear(start.getFullYear() - value);
        break;
    }

    return { start };
  }

  async start(): Promise<void> {
    // Load preferences
    await this.preferencesManager.load();

    // Start server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Claude Grep MCP server started');
  }
}

// Main entry point
async function main() {
  // Check for --with-web flag
  const withWeb = process.argv.includes('--with-web');
  
  const server = new ClaudeGrepMCPServer();
  await server.start();
  
  if (withWeb) {
    // Start web server in background
    const { WebServer } = await import('../web/server.js');
    const webServer = new WebServer(3000);
    
    try {
      await webServer.initialize();
      await webServer.start();
      const webUrl = 'http://localhost:3000';
      server.setWebInterfaceUrl(webUrl);
      console.error(`Claude Grep web interface available at ${webUrl}`);
    } catch (error) {
      console.error('Failed to start web server:', error);
      // Continue running MCP server even if web fails
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});