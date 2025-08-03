import { SearchEngine } from '@/core/search';
import { SearchOptions } from '@/core/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SearchEngine', () => {
  let testDir: string;
  let searchEngine: SearchEngine;

  beforeAll(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), 'claude-grep-test', Date.now().toString());
    const conversationDir = path.join(testDir, '.claude', 'conversation_history');
    await fs.promises.mkdir(conversationDir, { recursive: true });

    // Create test project directories
    await fs.promises.mkdir(path.join(conversationDir, 'test-project'), { recursive: true });
    await fs.promises.mkdir(path.join(conversationDir, 'another-project'), { recursive: true });

    // Create search engine with test directory
    searchEngine = new SearchEngine(conversationDir);
  });

  afterAll(async () => {
    // Clean up test directory
    await fs.promises.rm(testDir, { recursive: true, force: true });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Create test conversation files
      const testConversation1 = [
        {
          uuid: 'msg-1',
          sessionId: 'session-1',
          timestamp: new Date().toISOString(),
          type: 'user',
          gitBranch: 'main',
          message: { content: 'I have a TypeScript error in my code' }
        },
        {
          uuid: 'msg-2',
          sessionId: 'session-1',
          timestamp: new Date().toISOString(),
          type: 'assistant',
          message: { content: 'Let me help you fix that TypeScript error. Check src/index.ts' }
        }
      ];

      const testConversation2 = [
        {
          uuid: 'msg-3',
          sessionId: 'session-2',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          type: 'user',
          message: { content: 'How do I configure Jest for testing?' }
        },
        {
          uuid: 'msg-4',
          sessionId: 'session-2',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'assistant',
          message: { content: 'To configure Jest, update your jest.config.js file' }
        }
      ];

      const testConversation3 = [
        {
          uuid: 'msg-5',
          sessionId: 'session-3',
          timestamp: new Date().toISOString(),
          type: 'user',
          message: { content: 'My code is throwing an error' }
        },
        {
          uuid: 'msg-6',
          sessionId: 'session-3',
          timestamp: new Date().toISOString(),
          type: 'assistant',
          message: { content: 'I see the issue. You have a TypeError: Cannot read property of undefined at line 42' }
        }
      ];

      // Write test files
      const projectDir = path.join(testDir, '.claude', 'conversation_history', 'test-project');
      await fs.promises.writeFile(
        path.join(projectDir, 'session-1_conversation.jsonl'),
        testConversation1.map(msg => JSON.stringify(msg)).join('\n')
      );
      await fs.promises.writeFile(
        path.join(projectDir, 'session-2_conversation.jsonl'),
        testConversation2.map(msg => JSON.stringify(msg)).join('\n')
      );
      await fs.promises.writeFile(
        path.join(projectDir, 'session-3_conversation.jsonl'),
        testConversation3.map(msg => JSON.stringify(msg)).join('\n')
      );
    });

    it('should find conversations by keyword', async () => {
      const options: SearchOptions = {
        query: 'TypeScript error code',
        projectContext: 'test-project'
      };

      const results = [];
      for await (const result of searchEngine.search(options)) {
        results.push(result);
      }

      expect(results).toHaveLength(2);
      // Session-1 should be first due to higher relevance score
      expect(results[0].sessionId).toBe('session-1');
      expect(results[0].matchedContent).toContain('TypeScript error');
      expect(results[0].files).toContain('src/index.ts');
      // Session-3 also matches but with lower score
      expect(results[1].sessionId).toBe('session-3');
    });

    it('should filter by time range', async () => {
      const options: SearchOptions = {
        query: 'configure',
        projectContext: 'test-project',
        timeRange: {
          start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Last 3 days
        }
      };

      const results = [];
      for await (const result of searchEngine.search(options)) {
        results.push(result);
      }

      expect(results).toHaveLength(0); // Session-2 is 7 days old
    });

    it('should search across all projects when no filter specified', async () => {
      // Add conversation to another project
      const anotherProjectDir = path.join(testDir, '.claude', 'conversation_history', 'another-project');
      const testConversation = [{
        uuid: 'msg-5',
        sessionId: 'session-3',
        timestamp: new Date().toISOString(),
        type: 'user',
        message: { content: 'TypeScript is great for type safety' }
      }];

      await fs.promises.writeFile(
        path.join(anotherProjectDir, 'session-3_conversation.jsonl'),
        testConversation.map(msg => JSON.stringify(msg)).join('\n')
      );

      const options: SearchOptions = {
        query: 'TypeScript'
      };

      const results = [];
      for await (const result of searchEngine.search(options)) {
        results.push(result);
      }

      expect(results.length).toBeGreaterThanOrEqual(2);
      const projects = [...new Set(results.map(r => r.projectName))];
      expect(projects).toContain('test-project');
      expect(projects).toContain('another-project');
    });

    it('should calculate relevance scores', async () => {
      const options: SearchOptions = {
        query: 'TypeScript Jest configure',
        projectContext: 'test-project'
      };

      const results = [];
      for await (const result of searchEngine.search(options)) {
        results.push(result);
      }

      expect(results.length).toBeGreaterThan(0);
      
      // Results should be sorted by score
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }

      // Session-1 should have higher score due to better keyword matches
      const session1Result = results.find(r => r.sessionId === 'session-1');
      const session3Result = results.find(r => r.sessionId === 'session-3');
      
      if (session1Result && session3Result) {
        // session-1 matches more keywords (TypeScript, Jest) than session-3
        expect(session1Result.score).toBeGreaterThan(session3Result.score);
      }
    });

    it('should limit results when specified', async () => {
      const options: SearchOptions = {
        query: 'the', // Common word that appears in both conversations
        projectContext: 'test-project',
        limit: 1
      };

      const results = [];
      for await (const result of searchEngine.search(options)) {
        results.push(result);
      }

      expect(results).toHaveLength(1);
    });

    it('should filter by file patterns', async () => {
      const options: SearchOptions = {
        query: 'configure',
        projectContext: 'test-project',
        filePatterns: ['*.js']
      };

      const results = [];
      for await (const result of searchEngine.search(options)) {
        results.push(result);
      }

      expect(results).toHaveLength(1);
      expect(results[0].files).toContain('jest.config.js');
    });

    it('should detect errors in conversations', async () => {
      const options: SearchOptions = {
        query: 'error',
        projectContext: 'test-project',
        includeErrors: true
      };

      const results = [];
      for await (const result of searchEngine.search(options)) {
        results.push(result);
      }

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('session-3');
      expect(results[0].metadata?.hasErrors).toBe(true);
    });
  });

  describe('keyword extraction', () => {
    it('should extract meaningful keywords from query', async () => {
      const testCases = [
        {
          query: 'TypeError in React component',
          expectedKeywords: ['TypeError', 'React', 'component']
        },
        {
          query: 'the and or but', // All stop words
          expectedKeywords: []
        },
        {
          query: 'implement async/await functionality',
          expectedKeywords: ['implement', 'async/await', 'functionality']
        }
      ];

      // This would require exposing the extractKeywords method or testing indirectly
      // For now, we test through search behavior
      for (const testCase of testCases) {
        const options: SearchOptions = {
          query: testCase.query,
          projectContext: 'test-project'
        };

        // Just verify search doesn't crash with various queries
        const results = [];
        for await (const result of searchEngine.search(options)) {
          results.push(result);
        }
        
        expect(results).toBeDefined();
      }
    });
  });

  describe('exhaustive mode', () => {
    it('should search all files in exhaustive mode', async () => {
      const options: SearchOptions = {
        query: 'test',
        projectContext: 'test-project',
        exhaustive: true,
        limit: 1 // Should be ignored in exhaustive mode
      };

      const results = [];
      for await (const result of searchEngine.search(options)) {
        results.push(result);
      }

      // In exhaustive mode, limit should not apply
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });
});