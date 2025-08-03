import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SearchEngine } from '../core/search.js';
import { ConversationScanner } from '../core/scanner.js';
import { ProjectManager } from '../core/project-manager.js';
import { formatResults } from '../mcp/formatters/index.js';
import { PreferencesManager } from '../mcp/preferences.js';
import type { SearchOptions, SearchResult } from '../core/types.js';
import type { OutputFormat } from '../mcp/formatters/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WebServer {
  private app: Express;
  private searchEngine: SearchEngine;
  private scanner: ConversationScanner;
  private projectManager?: ProjectManager;
  private preferencesManager?: PreferencesManager;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.searchEngine = new SearchEngine();
    this.scanner = new ConversationScanner();
  }

  async initialize(): Promise<void> {
    this.projectManager = await ProjectManager.getInstance();
    this.preferencesManager = PreferencesManager.getInstance();
    await this.preferencesManager.load();
    
    this.app.use(express.json());
    this.app.use(cors());
    
    this.app.use(express.static(join(__dirname, 'public')));
    
    this.setupApiRoutes();
  }

  private setupApiRoutes(): void {
    this.app.get('/api/projects', async (req: Request, res: Response) => {
      try {
        const projects = await this.scanner.listProjects();
        const context = await this.projectManager!.getCurrentContext();
        
        res.json({
          projects,
          currentProject: context.currentProject,
          isClaudeCode: context.isClaudeCode,
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/projects/current', async (req: Request, res: Response) => {
      try {
        const context = await this.projectManager!.getCurrentContext();
        res.json(context);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/projects/switch', async (req: Request, res: Response) => {
      console.log('Project switch request:', req.body);
      try {
        const { project } = req.body;
        
        if (!project) {
          return res.status(400).json({ error: 'Project name is required' });
        }
        
        console.log('Switching to project:', project);
        await this.projectManager!.switchProject(project);
        const context = await this.projectManager!.getCurrentContext();
        console.log('New context:', context);
        
        res.json(context);
      } catch (error) {
        console.error('Project switch error:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/search', async (req: Request, res: Response) => {
      console.log('Search request received:', req.body);
      try {
        const { 
          query, 
          project, 
          searchAllProjects = false,
          exhaustive = false,
          timeRange,
          includeErrors = false,
          includeToolCalls = false,
          filePatterns,
          format = 'json',
          maxResults = 20
        } = req.body;

        if (!query) {
          return res.status(400).json({ error: 'Query is required' });
        }

        const context = await this.projectManager!.getCurrentContext();
        const targetProject = searchAllProjects ? undefined : (project || context.currentProject);

        const searchOptions: SearchOptions = {
          query,
          projectContext: targetProject,
          exhaustive,
          includeErrors,
          includeToolCalls,
          filePatterns: filePatterns ? filePatterns.split(',').map((p: string) => p.trim()) : undefined,
          timeRange,
          limit: maxResults,
        };

        const startTime = Date.now();
        const results: SearchResult[] = [];
        let filesSearched = 0;
        let totalFiles = 0;

        // Get search results and track progress
        const searchIterator = this.searchEngine.search(searchOptions);
        for await (const item of searchIterator) {
          if ('progress' in item && item.progress) {
            const progress = item.progress as any;
            filesSearched = progress.processed || 0;
            totalFiles = progress.total || 0;
          } else {
            results.push(item as SearchResult);
          }
        }

        const searchTime = Date.now() - startTime;

        const formattedResults = format === 'json' 
          ? results 
          : formatResults(results, format as OutputFormat, {
              includeStats: true,
              searchStats: {
                filesSearched,
                totalFiles,
                searchTime,
                project: targetProject || 'all projects',
              }
            });

        res.json({
          results: formattedResults,
          metadata: {
            totalSearched: filesSearched,
            totalMatches: results.length,
            searchTime,
            project: targetProject || 'all projects',
            exhaustive,
          },
        });
      } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/conversation/:sessionId', async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const { format = 'json' } = req.query;
        
        const result = await this.searchEngine.getConversationById(sessionId);
        
        if (!result) {
          return res.status(404).json({ error: 'Conversation not found' });
        }

        const formatted = format === 'json' 
          ? result 
          : formatResults([result], format as OutputFormat);

        res.json(formatted);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/preferences', async (req: Request, res: Response) => {
      try {
        const prefs = this.preferencesManager!.getAll();
        res.json(prefs);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/preferences', async (req: Request, res: Response) => {
      try {
        const updates = req.body;
        // Update preferences by category
        if (updates.display) {
          await this.preferencesManager!.set('display', updates.display);
        }
        if (updates.search) {
          await this.preferencesManager!.set('search', updates.search);
        }
        if (updates.performance) {
          await this.preferencesManager!.set('performance', updates.performance);
        }
        const prefs = this.preferencesManager!.getAll();
        res.json(prefs);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/formats', (req: Request, res: Response) => {
      res.json({
        formats: ['table', 'list', 'csv', 'markdown', 'json'],
        default: 'table',
      });
    });
  }

  async start(): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`Web server running at http://localhost:${this.port}`);
        resolve();
      });
    });
  }
}

async function main() {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new WebServer(port);
  
  try {
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}