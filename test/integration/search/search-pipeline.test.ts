import { SearchEngine } from '@/core/search';
import { ConversationScanner } from '@/core/scanner';
import { ConversationParser } from '@/core/parser';
import { conversationFixtures, createJsonlContent } from '../../fixtures/conversations';
import { createTempDir, cleanupTempDir, setupTestProject } from '../../utils/test-helpers';
import * as path from 'path';
import * as os from 'os';

describe('Search Pipeline Integration', () => {
  let tempDir: string;
  let searchEngine: SearchEngine;
  let scanner: ConversationScanner;
  let parser: ConversationParser;

  beforeEach(async () => {
    tempDir = await createTempDir('search-integration');
    parser = new ConversationParser();
    scanner = new ConversationScanner();
    searchEngine = new SearchEngine(parser, scanner);
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('End-to-end search workflow', () => {
    it('should search across multiple projects', async () => {
      // Set up test projects
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      await setupTestProject(baseDir, 'project-one', [
        conversationFixtures.simple,
        conversationFixtures.withCode
      ]);
      
      await setupTestProject(baseDir, 'project-two', [
        conversationFixtures.withErrors,
        conversationFixtures.withToolCalls
      ]);

      // Search across all projects
      const results = await searchEngine.search('Hello', {
        baseDir,
        searchAllProjects: true
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.project === 'project-one')).toBe(true);
    });

    it('should search within specific project', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      await setupTestProject(baseDir, 'project-one', [
        conversationFixtures.simple,
        conversationFixtures.withCode
      ]);
      
      await setupTestProject(baseDir, 'project-two', [
        conversationFixtures.withErrors,
        conversationFixtures.withToolCalls
      ]);

      // Search only in project-one
      const results = await searchEngine.search('Hello', {
        baseDir,
        project: 'project-one',
        searchAllProjects: false
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.project === 'project-one')).toBe(true);
      expect(results.some(r => r.project === 'project-two')).toBe(false);
    });

    it('should handle file pattern filtering', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      const projectDir = await setupTestProject(baseDir, 'test-project', []);
      
      // Create conversation with specific file mentions
      const convWithFile = conversationFixtures.simple;
      convWithFile.messages[0].content = 'Check the file Button.tsx';
      
      await setupTestProject(baseDir, 'test-project', [convWithFile]);

      // Search with file pattern
      const results = await searchEngine.search('Check', {
        baseDir,
        project: 'test-project',
        filePatterns: ['*.tsx']
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].messages[0].files).toContain('Button.tsx');
    });

    it('should handle exhaustive search mode', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      // Create many conversations
      const manyConversations = Array.from({ length: 10 }, (_, i) => ({
        ...conversationFixtures.simple,
        sessionId: `session-${i}`,
        messages: [
          { ...conversationFixtures.simple.messages[0], content: `Question ${i}` },
          { ...conversationFixtures.simple.messages[1], content: `Answer ${i}` }
        ]
      }));
      
      await setupTestProject(baseDir, 'test-project', manyConversations);

      // Normal search (may limit results)
      const normalResults = await searchEngine.search('Question', {
        baseDir,
        project: 'test-project',
        exhaustive: false,
        maxResults: 5
      });

      // Exhaustive search (gets all matches)
      const exhaustiveResults = await searchEngine.search('Question', {
        baseDir,
        project: 'test-project',
        exhaustive: true
      });

      expect(normalResults.length).toBeLessThanOrEqual(5);
      expect(exhaustiveResults.length).toBe(10);
    });

    it('should handle time range filtering', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      // Create conversations with different dates
      const oldConversation = {
        ...conversationFixtures.simple,
        metadata: {
          ...conversationFixtures.simple.metadata,
          timestamp: '2023-01-15T10:00:00Z'
        }
      };
      
      const recentConversation = {
        ...conversationFixtures.withCode,
        metadata: {
          ...conversationFixtures.withCode.metadata,
          timestamp: new Date().toISOString()
        }
      };
      
      await setupTestProject(baseDir, 'test-project', [oldConversation, recentConversation]);

      // Search with time range (last 7 days)
      const results = await searchEngine.search('', {
        baseDir,
        project: 'test-project',
        timeRange: '7d'
      });

      // Should only find recent conversation
      expect(results.length).toBe(1);
      expect(results[0].sessionId).toBe(recentConversation.sessionId);
    });

    it('should handle corrupted files gracefully', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      const projectDir = path.join(baseDir, 'test-project');
      
      // Create mix of valid and corrupted files
      await setupTestProject(baseDir, 'test-project', [conversationFixtures.simple]);
      
      // Add corrupted file
      const corruptedFile = path.join(projectDir, '2024-01-16.jsonl');
      await require('fs/promises').writeFile(corruptedFile, 'invalid json\n{partial', 'utf-8');

      // Search should still work
      const results = await searchEngine.search('Hello', {
        baseDir,
        project: 'test-project'
      });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should support case-insensitive search', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      const conversation = {
        ...conversationFixtures.simple,
        messages: [
          { ...conversationFixtures.simple.messages[0], content: 'HELLO WORLD' },
          { ...conversationFixtures.simple.messages[1], content: 'Hi there!' }
        ]
      };
      
      await setupTestProject(baseDir, 'test-project', [conversation]);

      // Search with different cases
      const results1 = await searchEngine.search('hello', {
        baseDir,
        project: 'test-project'
      });
      
      const results2 = await searchEngine.search('HELLO', {
        baseDir,
        project: 'test-project'
      });
      
      const results3 = await searchEngine.search('HeLLo', {
        baseDir,
        project: 'test-project'
      });

      expect(results1.length).toBe(1);
      expect(results2.length).toBe(1);
      expect(results3.length).toBe(1);
    });

    it('should filter by tool calls', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      await setupTestProject(baseDir, 'test-project', [
        conversationFixtures.simple,
        conversationFixtures.withToolCalls,
        conversationFixtures.withErrors
      ]);

      // Search only conversations with tool calls
      const results = await searchEngine.search('', {
        baseDir,
        project: 'test-project',
        includeToolCalls: true
      });

      expect(results.length).toBe(1);
      expect(results[0].sessionId).toBe(conversationFixtures.withToolCalls.sessionId);
    });

    it('should filter by errors', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      await setupTestProject(baseDir, 'test-project', [
        conversationFixtures.simple,
        conversationFixtures.withToolCalls,
        conversationFixtures.withErrors
      ]);

      // Search only conversations with errors
      const results = await searchEngine.search('', {
        baseDir,
        project: 'test-project',
        includeErrors: true
      });

      expect(results.length).toBe(1);
      expect(results[0].sessionId).toBe(conversationFixtures.withErrors.sessionId);
    });

    it('should handle empty search query', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      await setupTestProject(baseDir, 'test-project', [
        conversationFixtures.simple,
        conversationFixtures.withCode
      ]);

      // Empty search should return all conversations
      const results = await searchEngine.search('', {
        baseDir,
        project: 'test-project'
      });

      expect(results.length).toBe(2);
    });

    it('should respect max results limit', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      // Create many conversations
      const conversations = Array.from({ length: 20 }, (_, i) => ({
        ...conversationFixtures.simple,
        sessionId: `session-${i}`
      }));
      
      await setupTestProject(baseDir, 'test-project', conversations);

      // Search with max results
      const results = await searchEngine.search('', {
        baseDir,
        project: 'test-project',
        maxResults: 10
      });

      expect(results.length).toBe(10);
    });
  });

  describe('Performance tests', () => {
    it('should handle large conversations efficiently', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      await setupTestProject(baseDir, 'test-project', [
        conversationFixtures.longConversation
      ]);

      const startTime = Date.now();
      const results = await searchEngine.search('Question', {
        baseDir,
        project: 'test-project'
      });
      const duration = Date.now() - startTime;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should stream results as they are found', async () => {
      const baseDir = path.join(tempDir, '.claude', 'conversation_history');
      
      // Create multiple files
      const conversations = Array.from({ length: 5 }, (_, i) => ({
        ...conversationFixtures.simple,
        sessionId: `session-${i}`,
        metadata: {
          ...conversationFixtures.simple.metadata,
          timestamp: `2024-01-${15 + i}T10:00:00Z`
        }
      }));
      
      for (const conv of conversations) {
        await setupTestProject(baseDir, 'test-project', [conv]);
      }

      const foundResults: string[] = [];
      const startTime = Date.now();
      
      // Use streaming API if available
      const results = await searchEngine.search('Hello', {
        baseDir,
        project: 'test-project',
        onResult: (result) => {
          foundResults.push(result.sessionId);
        }
      });

      // Results should be found progressively
      expect(foundResults.length).toBeGreaterThan(0);
      expect(results.length).toBe(foundResults.length);
    });
  });
});