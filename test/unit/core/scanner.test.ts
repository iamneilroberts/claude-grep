import { ConversationScanner } from '@/core/scanner';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ConversationScanner', () => {
  let testDir: string;
  let scanner: ConversationScanner;

  beforeAll(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), 'claude-scanner-test', Date.now().toString());
    const conversationDir = path.join(testDir, '.claude', 'conversation_history');
    
    // Create test project structure
    const projects = ['project-a', 'project-b', 'project-c'];
    for (const project of projects) {
      await fs.promises.mkdir(path.join(conversationDir, project), { recursive: true });
    }

    // Create test conversation files
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Project A files
    await createTestFile(
      path.join(conversationDir, 'project-a', 'session-1_conversation.jsonl'),
      now
    );
    await createTestFile(
      path.join(conversationDir, 'project-a', 'session-2_conversation.jsonl'),
      dayAgo
    );

    // Project B files
    await createTestFile(
      path.join(conversationDir, 'project-b', 'session-3_conversation.jsonl'),
      weekAgo
    );

    // Project C files
    await createTestFile(
      path.join(conversationDir, 'project-c', 'session-4_conversation.jsonl'),
      monthAgo
    );

    // Create some non-JSONL files that should be ignored
    await fs.promises.writeFile(
      path.join(conversationDir, 'project-a', 'README.md'),
      'This should be ignored'
    );

    scanner = new ConversationScanner(conversationDir);
  });

  afterAll(async () => {
    // Clean up test directory
    await fs.promises.rm(testDir, { recursive: true, force: true });
  });

  async function createTestFile(filePath: string, modifiedTime: Date) {
    await fs.promises.writeFile(filePath, '{"test": "data"}');
    await fs.promises.utimes(filePath, modifiedTime, modifiedTime);
  }

  describe('scanConversations', () => {
    it('should find all conversation files', async () => {
      const files = await scanner.scanConversations();

      expect(files).toHaveLength(4);
      expect(files.every(f => f.path.endsWith('.jsonl'))).toBe(true);
    });

    it('should sort files by modification time (newest first)', async () => {
      const files = await scanner.scanConversations();

      for (let i = 1; i < files.length; i++) {
        expect(files[i - 1].lastModified.getTime()).toBeGreaterThanOrEqual(
          files[i].lastModified.getTime()
        );
      }
    });

    it('should filter by project', async () => {
      const files = await scanner.scanConversations({
        projectFilter: 'project-a'
      });

      expect(files).toHaveLength(2);
      expect(files.every(f => f.projectName === 'project-a')).toBe(true);
    });

    it('should filter by date range', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      const files = await scanner.scanConversations({
        startDate: threeDaysAgo
      });

      expect(files).toHaveLength(2); // Only session-1 and session-2
    });

    it('should report progress', async () => {
      const progressUpdates: any[] = [];
      
      await scanner.scanConversations({
        onProgress: (progress) => progressUpdates.push(progress)
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].stage).toBe('scanning');
    });

    it('should extract session IDs from filenames', async () => {
      const files = await scanner.scanConversations();

      const sessionIds = files.map(f => f.sessionId);
      expect(sessionIds).toContain('session-1');
      expect(sessionIds).toContain('session-2');
      expect(sessionIds).toContain('session-3');
      expect(sessionIds).toContain('session-4');
    });

    it('should handle missing conversation directory gracefully', async () => {
      const nonExistentScanner = new ConversationScanner('/non/existent/path');
      const files = await nonExistentScanner.scanConversations();

      expect(files).toHaveLength(0);
    });
  });

  describe('getRecentConversations', () => {
    it('should get conversations from the last N days', async () => {
      const files = await scanner.getRecentConversations(3);

      expect(files).toHaveLength(2); // session-1 and session-2
      expect(files[0].sessionId).toBe('session-1'); // Most recent
    });

    it('should filter by project when specified', async () => {
      const files = await scanner.getRecentConversations(30, 'project-b');

      expect(files).toHaveLength(1);
      expect(files[0].projectName).toBe('project-b');
    });
  });

  describe('listProjects', () => {
    it('should list all available projects', async () => {
      const projects = await scanner.listProjects();

      expect(projects).toHaveLength(3);
      expect(projects).toContain('project-a');
      expect(projects).toContain('project-b');
      expect(projects).toContain('project-c');
      expect(projects).toEqual(projects.slice().sort()); // Should be sorted
    });
  });

  describe('projectExists', () => {
    it('should return true for existing projects', async () => {
      const exists = await scanner.projectExists('project-a');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing projects', async () => {
      const exists = await scanner.projectExists('non-existent-project');
      expect(exists).toBe(false);
    });
  });

  describe('getProjectPath', () => {
    it('should return the correct project path', () => {
      const projectPath = scanner.getProjectPath('my-project');
      expect(projectPath).toContain('.claude');
      expect(projectPath).toContain('conversation_history');
      expect(projectPath).toContain('my-project');
    });
  });
});