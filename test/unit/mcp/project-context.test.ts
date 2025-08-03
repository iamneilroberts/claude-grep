import { ProjectContextDetector } from '@/mcp/project-context';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ProjectContextDetector', () => {
  let detector: ProjectContextDetector;
  let testDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    // Save original CWD
    originalCwd = process.cwd();
    
    // Create test directory structure
    testDir = path.join(os.tmpdir(), 'claude-context-test', Date.now().toString());
    const conversationDir = path.join(testDir, '.claude', 'conversation_history');
    
    // Create test projects
    await fs.promises.mkdir(path.join(conversationDir, 'my-app'), { recursive: true });
    await fs.promises.mkdir(path.join(conversationDir, 'another-project'), { recursive: true });
    await fs.promises.mkdir(path.join(conversationDir, 'test-project'), { recursive: true });
    
    // Create test project directories
    await fs.promises.mkdir(path.join(testDir, 'projects', 'my-app', 'src'), { recursive: true });
    await fs.promises.mkdir(path.join(testDir, 'projects', 'another-project'), { recursive: true });
    
    // Mock HOME
    process.env.HOME = testDir;
  });

  afterAll(async () => {
    // Restore CWD
    process.chdir(originalCwd);
    
    // Clean up
    await fs.promises.rm(testDir, { recursive: true, force: true });
    
    // Restore HOME
    delete process.env.HOME;
  });

  beforeEach(() => {
    detector = new ProjectContextDetector();
  });

  describe('detectContext', () => {
    it('should detect available projects', async () => {
      const context = await detector.detectContext();
      
      expect(context.availableProjects).toContain('my-app');
      expect(context.availableProjects).toContain('another-project');
      expect(context.availableProjects).toContain('test-project');
      expect(context.availableProjects).toHaveLength(3);
    });

    it('should detect current project from CWD', async () => {
      // Change to a project directory
      const projectDir = path.join(testDir, 'projects', 'my-app', 'src');
      process.chdir(projectDir);
      
      const context = await detector.detectContext();
      
      expect(context.currentProject).toBe('my-app');
      expect(context.workingDirectory).toBe(projectDir);
    });

    it('should detect project from parent directory', async () => {
      // Create a deeply nested directory
      const deepDir = path.join(testDir, 'projects', 'another-project', 'src', 'components', 'ui');
      await fs.promises.mkdir(deepDir, { recursive: true });
      process.chdir(deepDir);
      
      const context = await detector.detectContext();
      
      expect(context.currentProject).toBe('another-project');
    });

    it('should detect project from package.json', async () => {
      // Create a project with package.json
      const projectDir = path.join(testDir, 'unrelated-dir');
      await fs.promises.mkdir(projectDir, { recursive: true });
      
      await fs.promises.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'my-app' })
      );
      
      process.chdir(projectDir);
      
      const context = await detector.detectContext();
      
      expect(context.currentProject).toBe('my-app');
    });

    it('should handle no project detected', async () => {
      // Change to a directory with no project indicators
      process.chdir(testDir);
      
      const context = await detector.detectContext();
      
      expect(context.currentProject).toBeUndefined();
    });

    it('should detect Claude Code environment', async () => {
      // Mock Claude Code environment
      process.env.CLAUDE_CODE = 'true';
      
      const context = await detector.detectContext();
      
      expect(context.isClaudeCode).toBe(true);
      
      // Clean up
      delete process.env.CLAUDE_CODE;
    });

    it('should detect MCP server environment', async () => {
      // Mock MCP server environment
      process.env.MCP_SERVER_NAME = 'claude-grep';
      
      const context = await detector.detectContext();
      
      expect(context.isClaudeCode).toBe(true);
      
      // Clean up
      delete process.env.MCP_SERVER_NAME;
    });
  });

  describe('switchProject', () => {
    it('should verify project exists before switching', async () => {
      await expect(
        detector.switchProject('non-existent-project')
      ).rejects.toThrow("Project 'non-existent-project' not found");
    });

    it('should allow switching to existing project', async () => {
      await expect(
        detector.switchProject('my-app')
      ).resolves.not.toThrow();
    });
  });

  describe('getProjectPath', () => {
    it('should return correct project path', () => {
      const projectPath = detector.getProjectPath('my-project');
      
      expect(projectPath).toContain('.claude');
      expect(projectPath).toContain('conversation_history');
      expect(projectPath).toContain('my-project');
    });
  });
});