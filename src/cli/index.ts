#!/usr/bin/env node
import { Command } from 'commander';
import { 
  SearchEngine, 
  ProjectManager,
  ConversationScanner,
  ResultProcessor,
  createProgressReporter
} from '../core/index.js';
import { formatResults, OutputFormat } from '../mcp/formatters/index.js';
import { PreferencesManager } from '../mcp/preferences.js';
import { ProjectContextDetector } from '../mcp/project-context.js';
import { ConversationLoader } from '../mcp/conversation-loader.js';

const program = new Command();

// Initialize components
let projectManager: ProjectManager;
let preferencesManager: PreferencesManager;

async function initializeComponents() {
  projectManager = await ProjectManager.getInstance();
  preferencesManager = PreferencesManager.getInstance();
  await preferencesManager.load();
}

program
  .name('claude-grep')
  .description('Search and analyze Claude conversation history')
  .version('1.0.0');

// Search command
program
  .command('search <query>')
  .description('Search conversations for a query')
  .option('-p, --project <name>', 'Search specific project')
  .option('-a, --all-projects', 'Search all projects')
  .option('-f, --format <format>', 'Output format (table, list, csv, markdown, json)', 'table')
  .option('-e, --exhaustive', 'Exhaustive search mode (slower but complete)')
  .option('-m, --max-results <number>', 'Maximum results to return', '20')
  .option('-t, --time-range <range>', 'Time range (e.g., 24h, 7d, 1m)')
  .option('--include-errors', 'Only show conversations with errors')
  .option('--include-tool-calls', 'Only show conversations with tool calls')
  .option('--file-patterns <patterns>', 'File patterns to match (comma-separated)')
  .action(async (query, options) => {
    await initializeComponents();
    
    try {
      // Get project context
      const context = await projectManager.getCurrentContext();
      let searchProject = options.project || context.currentProject;
      
      if (options.allProjects) {
        searchProject = undefined;
      } else if (!searchProject) {
        console.error('No project detected. Use --project to specify one or --all-projects to search all.');
        process.exit(1);
      }

      // Create search engine with progress reporter
      const progressReporter = options.exhaustive 
        ? createProgressReporter({ type: 'console' })
        : undefined;
      
      const searchEngine = new SearchEngine(undefined, {}, progressReporter);
      const results = [];
      
      // Perform search
      for await (const result of searchEngine.search({
        query,
        projectContext: searchProject,
        exhaustive: options.exhaustive,
        limit: parseInt(options.maxResults),
        timeRange: parseTimeRange(options.timeRange),
        includeErrors: options.includeErrors,
        includeToolCalls: options.includeToolCalls,
        filePatterns: options.filePatterns?.split(',').map((p: string) => p.trim()),
      })) {
        results.push(result);
      }
      
      // Process and format results
      const processor = new ResultProcessor();
      const processed = processor.processResults(results, {
        maxResults: parseInt(options.maxResults),
        highlightKeywords: query.split(' '),
      });
      
      const formatted = formatResults(processed.results, options.format as OutputFormat, {
        includeStats: true,
        searchStats: processed.searchStats,
      });
      
      console.log(formatted);
    } catch (error) {
      console.error('Search error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Search for files command
program
  .command('files <pattern>')
  .description('Find conversations that mention specific files')
  .option('-p, --project <name>', 'Search specific project')
  .option('-f, --format <format>', 'Output format', 'table')
  .option('-m, --max-results <number>', 'Maximum results', '20')
  .option('-t, --time-range <range>', 'Time range filter')
  .action(async (pattern, options) => {
    await initializeComponents();
    
    try {
      const context = await projectManager.getCurrentContext();
      const searchProject = options.project || context.currentProject;
      
      if (!searchProject) {
        console.error('No project detected. Use --project to specify one.');
        process.exit(1);
      }
      
      const searchEngine = new SearchEngine();
      const results = [];
      
      for await (const result of searchEngine.search({
        query: '',
        projectContext: searchProject,
        filePatterns: [pattern],
        limit: parseInt(options.maxResults),
        timeRange: parseTimeRange(options.timeRange),
      })) {
        results.push(result);
      }
      
      const formatted = formatResults(results, options.format as OutputFormat);
      console.log(formatted);
    } catch (error) {
      console.error('Search error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Project commands
const projectCmd = program
  .command('project')
  .description('Manage projects');

projectCmd
  .command('list')
  .description('List all available projects')
  .action(async () => {
    await initializeComponents();
    
    try {
      const scanner = new ConversationScanner();
      const projects = await scanner.listProjects();
      const context = await projectManager.getCurrentContext();
      
      console.log('Available projects:');
      projects.forEach(project => {
        const isCurrent = project === context.currentProject;
        console.log(`  ${isCurrent ? '→' : ' '} ${project}${isCurrent ? ' (current)' : ''}`);
      });
    } catch (error) {
      console.error('Error listing projects:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

projectCmd
  .command('current')
  .description('Show current project context')
  .action(async () => {
    await initializeComponents();
    
    try {
      const context = await projectManager.getCurrentContext();
      console.log(`Current project: ${context.currentProject || 'None'}`);
      console.log(`Working directory: ${context.workingDirectory || 'Unknown'}`);
      console.log(`Claude Code mode: ${context.isClaudeCode ? 'Yes' : 'No'}`);
    } catch (error) {
      console.error('Error getting current project:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

projectCmd
  .command('use <name>')
  .description('Switch to a different project')
  .action(async (name) => {
    await initializeComponents();
    
    try {
      await projectManager.switchProject(name);
      console.log(`Switched to project: ${name}`);
    } catch (error) {
      console.error('Error switching project:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Conversation details command
program
  .command('show <sessionId>')
  .description('Show full conversation details')
  .option('-f, --format <format>', 'Output format (markdown, json)', 'markdown')
  .option('-c, --context <lines>', 'Include context lines around matches')
  .option('-h, --highlight <terms>', 'Highlight search terms (comma-separated)')
  .action(async (sessionId, options) => {
    await initializeComponents();
    
    try {
      const loader = new ConversationLoader();
      const conversation = await loader.loadConversation(sessionId);
      
      if (!conversation) {
        console.error(`Conversation ${sessionId} not found.`);
        process.exit(1);
      }
      
      const formatted = loader.formatConversation(
        conversation,
        options.format,
        {
          includeContext: options.context ? parseInt(options.context) : undefined,
          highlightMatches: !!options.highlight,
          searchTerms: options.highlight?.split(',').map((s: string) => s.trim()),
        }
      );
      
      console.log(formatted);
    } catch (error) {
      console.error('Error loading conversation:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Config commands
const configCmd = program
  .command('config')
  .description('Manage preferences');

configCmd
  .command('get [key]')
  .description('Get preference value(s)')
  .action(async (key) => {
    await initializeComponents();
    
    try {
      if (key) {
        const value = preferencesManager.get(key as any);
        console.log(`${key}: ${JSON.stringify(value)}`);
      } else {
        const prefs = preferencesManager.getAll();
        console.log(JSON.stringify(prefs, null, 2));
      }
    } catch (error) {
      console.error('Error getting preferences:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

configCmd
  .command('set <key> <value>')
  .description('Set preference value')
  .action(async (key, value) => {
    await initializeComponents();
    
    try {
      // Try to parse as JSON first
      let parsedValue: any = value;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Keep as string if not valid JSON
      }
      
      await preferencesManager.set(key as any, parsedValue);
      console.log(`Set ${key} to ${JSON.stringify(parsedValue)}`);
    } catch (error) {
      console.error('Error setting preference:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

configCmd
  .command('reset')
  .description('Reset all preferences to defaults')
  .action(async () => {
    await initializeComponents();
    
    try {
      await preferencesManager.reset();
      console.log('Preferences reset to defaults');
    } catch (error) {
      console.error('Error resetting preferences:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// MCP server command
program
  .command('mcp')
  .description('Start as MCP server')
  .action(async () => {
    // Import and start MCP server
    const { ClaudeGrepMCPServer } = await import('../mcp/server.js');
    const server = new ClaudeGrepMCPServer();
    await server.start();
  });

// Web server command
program
  .command('web')
  .description('Start web interface')
  .option('-p, --port <port>', 'Port to run web server on', '3000')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (options) => {
    const port = parseInt(options.port);
    
    // Import and start web server
    const { WebServer } = await import('../web/server.js');
    const server = new WebServer(port);
    
    try {
      await server.initialize();
      await server.start();
      
      const url = `http://localhost:${port}`;
      console.log(`\n🌐 Claude Grep web interface started`);
      console.log(`   Access at: ${url}`);
      console.log(`   Press Ctrl+C to stop\n`);
      
      // Open browser if not disabled
      if (options.open) {
        const { exec } = await import('child_process');
        const platform = process.platform;
        const cmd = platform === 'darwin' ? 'open' : 
                   platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${cmd} ${url}`);
      }
    } catch (error) {
      console.error('Failed to start web server:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Helper function to parse time range
function parseTimeRange(timeRange?: string): { start?: Date; end?: Date } | undefined {
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

// Parse command line arguments
program.parse(process.argv);