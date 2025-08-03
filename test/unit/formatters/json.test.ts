import { JsonFormatter } from '@/mcp/formatters/json';
import { SearchResult } from '@/core/results';
import { captureOutput } from '../../utils/test-helpers';

describe('JsonFormatter', () => {
  let formatter: JsonFormatter;

  beforeEach(() => {
    formatter = new JsonFormatter();
  });

  describe('format', () => {
    it('should format empty results as empty array', () => {
      const results: SearchResult[] = [];
      const { stdout } = captureOutput(() => {
        formatter.format(results);
      });

      const output = JSON.parse(stdout.join(''));
      expect(output).toEqual([]);
    });

    it('should format single result', () => {
      const result: SearchResult = {
        sessionId: 'session-123',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'test-project',
        title: 'Test Conversation',
        matchCount: 1,
        messages: [{
          role: 'user',
          content: 'How do I implement authentication?',
          timestamp: '2024-01-15T10:30:00Z',
          hasMatch: true
        }]
      };

      const { stdout } = captureOutput(() => {
        formatter.format([result]);
      });

      const output = JSON.parse(stdout.join(''));
      expect(output).toHaveLength(1);
      expect(output[0].sessionId).toBe('session-123');
      expect(output[0].project).toBe('test-project');
      expect(output[0].title).toBe('Test Conversation');
      expect(output[0].matchCount).toBe(1);
      expect(output[0].messages).toHaveLength(1);
      expect(output[0].messages[0].content).toBe('How do I implement authentication?');
    });

    it('should format multiple results', () => {
      const results: SearchResult[] = [
        {
          sessionId: 'session-1',
          timestamp: '2024-01-15T10:00:00Z',
          project: 'project-1',
          title: 'First',
          matchCount: 2,
          messages: [{
            role: 'user',
            content: 'Question 1',
            timestamp: '2024-01-15T10:00:00Z',
            hasMatch: true
          }]
        },
        {
          sessionId: 'session-2',
          timestamp: '2024-01-16T10:00:00Z',
          project: 'project-2',
          title: 'Second',
          matchCount: 3,
          messages: [{
            role: 'assistant',
            content: 'Answer 2',
            timestamp: '2024-01-16T10:00:00Z',
            hasMatch: true
          }]
        }
      ];

      const { stdout } = captureOutput(() => {
        formatter.format(results);
      });

      const output = JSON.parse(stdout.join(''));
      expect(output).toHaveLength(2);
      expect(output[0].sessionId).toBe('session-1');
      expect(output[1].sessionId).toBe('session-2');
    });

    it('should produce valid JSON with special characters', () => {
      const result: SearchResult = {
        sessionId: 'session-123',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'test-project',
        title: 'Title with "quotes" and \\ backslash',
        matchCount: 1,
        messages: [{
          role: 'user',
          content: 'Content with\nnewlines\tand\ttabs',
          timestamp: '2024-01-15T10:30:00Z',
          hasMatch: true
        }]
      };

      const { stdout } = captureOutput(() => {
        formatter.format([result]);
      });

      // Should not throw when parsing
      const output = JSON.parse(stdout.join(''));
      expect(output[0].title).toBe('Title with "quotes" and \\ backslash');
      expect(output[0].messages[0].content).toBe('Content with\nnewlines\tand\ttabs');
    });

    it('should pretty print JSON', () => {
      const result: SearchResult = {
        sessionId: 'session-123',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'test-project',
        title: 'Test',
        matchCount: 1,
        messages: []
      };

      const { stdout } = captureOutput(() => {
        formatter.format([result]);
      });

      const output = stdout.join('');
      // Check for indentation (pretty printing)
      expect(output).toContain('\n  ');
      expect(output).toMatch(/^\[\n/); // Starts with array and newline
      expect(output).toMatch(/\n\]$/); // Ends with newline and closing bracket
    });

    it('should include all fields in output', () => {
      const result: SearchResult = {
        sessionId: 'session-123',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'test-project',
        title: 'Test Conversation',
        matchCount: 5,
        messages: [
          {
            role: 'user',
            content: 'Question',
            timestamp: '2024-01-15T10:30:00Z',
            hasMatch: true,
            files: ['file1.ts', 'file2.js'],
            hasError: false,
            hasToolCall: true
          },
          {
            role: 'assistant',
            content: 'Answer',
            timestamp: '2024-01-15T10:31:00Z',
            hasMatch: false
          }
        ]
      };

      const { stdout } = captureOutput(() => {
        formatter.format([result]);
      });

      const output = JSON.parse(stdout.join(''));
      const firstResult = output[0];
      
      // Check all fields are present
      expect(firstResult).toHaveProperty('sessionId');
      expect(firstResult).toHaveProperty('timestamp');
      expect(firstResult).toHaveProperty('project');
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('matchCount');
      expect(firstResult).toHaveProperty('messages');
      
      // Check message fields
      const firstMessage = firstResult.messages[0];
      expect(firstMessage).toHaveProperty('role');
      expect(firstMessage).toHaveProperty('content');
      expect(firstMessage).toHaveProperty('timestamp');
      expect(firstMessage).toHaveProperty('hasMatch');
      expect(firstMessage).toHaveProperty('files');
      expect(firstMessage).toHaveProperty('hasError');
      expect(firstMessage).toHaveProperty('hasToolCall');
    });
  });
});