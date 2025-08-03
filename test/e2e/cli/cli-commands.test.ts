import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createTempDir, cleanupTempDir, setupTestProject } from '../../utils/test-helpers';
import { conversationFixtures } from '../../fixtures/conversations';

describe('CLI End-to-End Tests', () => {
  let tempDir: string;
  let originalHome: string;
  const cliPath = path.join(process.cwd(), 'dist', 'cli', 'index.js');

  beforeAll(async () => {
    // Build the project
    execSync('npm run build', { stdio: 'ignore' });
  });

  beforeEach(async () => {
    tempDir = await createTempDir('cli-e2e');
    originalHome = process.env.HOME || '';
    process.env.HOME = tempDir;
    
    // Set up test data
    const baseDir = path.join(tempDir, '.claude', 'projects');
    await setupTestProject(baseDir, 'test-project', [
      conversationFixtures.simple,
      conversationFixtures.withCode,
      conversationFixtures.withErrors
    ]);
    
    await setupTestProject(baseDir, 'another-project', [
      conversationFixtures.withToolCalls,
      conversationFixtures.longConversation
    ]);
    
    // Set up project config
    const configDir = path.join(tempDir, '.claude-grep');
    await fs.mkdir(configDir, { recursive: true });
    const projectConfig = {
      lastProject: 'test-project',
      projectHistory: ['test-project', 'another-project'],
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(
      path.join(configDir, 'project-config.json'),
      JSON.stringify(projectConfig, null, 2),
      'utf-8'
    );
  });

  afterEach(async () => {
    process.env.HOME = originalHome;
    await cleanupTempDir(tempDir);
  });

  describe('Search command', () => {
    it('should search with default options', () => {
      const result = execSync(`node ${cliPath} search "Hello"`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      expect(result).toContain('Hello');
      expect(result).toContain('Session');
    });

    it('should search with table format', () => {
      const result = execSync(`node ${cliPath} search "Hello" --format table`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      expect(result).toContain('Session ID');
      expect(result).toContain('Date');
      expect(result).toContain('Project');
      expect(result).toContain('─'); // Table separator
    });

    it('should search with JSON format', () => {
      const result = execSync(`node ${cliPath} search "Hello" --format json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]).toHaveProperty('sessionId');
    });

    it('should search with CSV format', () => {
      const result = execSync(`node ${cliPath} search "Hello" --format csv`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const lines = result.split('\n');
      expect(lines[0]).toContain('Session ID,Date,Project,Title,Matches,Preview');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should search specific project', () => {
      const result = execSync(`node ${cliPath} search "" --project another-project --format json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed) ? parsed.every((r: any) => r.project === 'another-project') : false).toBe(true);
    });

    it('should search all projects', () => {
      const result = execSync(`node ${cliPath} search "" --all-projects --format json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const parsed = JSON.parse(result);
      if (Array.isArray(parsed)) {
        const projects = [...new Set(parsed.map((r: any) => r.project))];
        expect(projects.length).toBe(2);
        expect(projects).toContain('test-project');
        expect(projects).toContain('another-project');
      } else {
        throw new Error('Expected array of results');
      }
    });

    it('should limit results', () => {
      const result = execSync(`node ${cliPath} search "" --max-results 2 --format json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const parsed = JSON.parse(result);
      expect(parsed.length).toBe(2);
    });

    it('should filter by file patterns', () => {
      const result = execSync(`node ${cliPath} search "TypeScript" --file-patterns "*.ts" --format json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const parsed = JSON.parse(result);
      if (parsed.length > 0) {
        expect(parsed[0].messages.some((m: any) => m.content.includes('TypeScript'))).toBe(true);
      }
    });

    it('should filter by errors', () => {
      const result = execSync(`node ${cliPath} search "" --include-errors --format json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const parsed = JSON.parse(result);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].sessionId).toBe(conversationFixtures.withErrors.sessionId);
    });

    it('should filter by tool calls', () => {
      const result = execSync(`node ${cliPath} search "" --include-tool-calls --all-projects --format json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const parsed = JSON.parse(result);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].sessionId).toBe(conversationFixtures.withToolCalls.sessionId);
    });

    it('should handle exhaustive search', () => {
      const result = execSync(`node ${cliPath} search "Question" --exhaustive --all-projects --format json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const parsed = JSON.parse(result);
      // Should find all matches in long conversation
      expect(parsed.some((r: any) => r.sessionId === conversationFixtures.longConversation.sessionId)).toBe(true);
    });

    it('should handle no results gracefully', () => {
      const result = execSync(`node ${cliPath} search "nonexistentquery12345" --format table`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      expect(result).toContain('No results found');
    });
  });

  describe('Projects command', () => {
    it('should list all projects', () => {
      const result = execSync(`node ${cliPath} project list`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      expect(result).toContain('test-project');
      expect(result).toContain('another-project');
    });

    it('should show current project', () => {
      // First set a project
      execSync(`node ${cliPath} project use test-project`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const result = execSync(`node ${cliPath} project current`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      expect(result).toContain('test-project');
    });

    it('should switch projects', () => {
      const result = execSync(`node ${cliPath} project use another-project`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      expect(result).toContain('Switched to project: another-project');

      // Verify switch worked
      const current = execSync(`node ${cliPath} project current`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      expect(current).toContain('another-project');
    });
  });

  describe('Config command', () => {
    it('should show current configuration', () => {
      const result = execSync(`node ${cliPath} config get`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      expect(result).toContain('defaultFormat');
      expect(result).toContain('maxResults');
    });

    it('should set configuration value', () => {
      execSync(`node ${cliPath} config set display.defaultFormat json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const result = execSync(`node ${cliPath} config get`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      expect(result).toContain('"defaultFormat": "json"');
    });

    it('should reset configuration', () => {
      // First set a value
      execSync(`node ${cliPath} config set maxResults 100`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      // Then reset
      execSync(`node ${cliPath} config reset`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const result = execSync(`node ${cliPath} config get`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      // Should have default values
      expect(result).toContain('"maxResults": 20');
    });
  });

  describe('Show command', () => {
    it('should show conversation by session ID', () => {
      const result = execSync(`node ${cliPath} show ${conversationFixtures.simple.sessionId} --format json`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });

      const parsed = JSON.parse(result);
      
      expect(parsed.sessionId).toBe(conversationFixtures.simple.sessionId);
      expect(parsed.messages).toHaveLength(conversationFixtures.simple.messages.length);
    });

    it('should show with markdown format', () => {
      const result = execSync(`node ${cliPath} show ${conversationFixtures.simple.sessionId} --format markdown`, {
        env: { ...process.env, HOME: tempDir },
        encoding: 'utf-8'
      });
      
      expect(result).toContain('# Conversation');
      expect(result).toContain('**User:**');
      expect(result).toContain('**Assistant:**');
    });
  });

  describe('Error handling', () => {
    it('should show help for invalid commands', () => {
      try {
        execSync(`node ${cliPath} invalidcommand`, {
          env: { ...process.env, HOME: tempDir },
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('Usage:');
      }
    });

    it('should handle missing required arguments', () => {
      try {
        execSync(`node ${cliPath} show`, {
          env: { ...process.env, HOME: tempDir },
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('missing required argument');
      }
    });
  });
});