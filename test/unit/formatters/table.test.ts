import { TableFormatter } from '@/mcp/formatters/table';
import { SearchResult } from '@/core/results';
import { conversationFixtures } from '../../fixtures/conversations';
import { captureOutput } from '../../utils/test-helpers';

describe('TableFormatter', () => {
  let formatter: TableFormatter;

  beforeEach(() => {
    formatter = new TableFormatter();
  });

  describe('format', () => {
    it('should format empty results', () => {
      const results: SearchResult[] = [];
      const { stdout } = captureOutput(() => {
        formatter.format(results);
      });

      expect(stdout).toContain('No results found');
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

      expect(stdout.join('\n')).toContain('session-123');
      expect(stdout.join('\n')).toContain('test-project');
      expect(stdout.join('\n')).toContain('Test Conversation');
      expect(stdout.join('\n')).toContain('How do I implement authentication?');
    });

    it('should format multiple results', () => {
      const results: SearchResult[] = [
        {
          sessionId: 'session-1',
          timestamp: '2024-01-15T10:00:00Z',
          project: 'project-1',
          title: 'First Conversation',
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
          title: 'Second Conversation',
          matchCount: 1,
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

      const output = stdout.join('\n');
      expect(output).toContain('session-1');
      expect(output).toContain('session-2');
      expect(output).toContain('First Conversation');
      expect(output).toContain('Second Conversation');
      expect(output).toContain('2 matches');
      expect(output).toContain('1 match');
    });

    it('should truncate long content', () => {
      const longContent = 'This is a very long message '.repeat(20);
      const result: SearchResult = {
        sessionId: 'session-123',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'test-project',
        title: 'Long Conversation',
        matchCount: 1,
        messages: [{
          role: 'user',
          content: longContent,
          timestamp: '2024-01-15T10:30:00Z',
          hasMatch: true
        }]
      };

      const { stdout } = captureOutput(() => {
        formatter.format([result]);
      });

      const output = stdout.join('\n');
      expect(output).toContain('...');
      expect(output.length).toBeLessThan(longContent.length);
    });

    it('should handle special characters in content', () => {
      const result: SearchResult = {
        sessionId: 'session-123',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'test-project',
        title: 'Special Characters',
        matchCount: 1,
        messages: [{
          role: 'user',
          content: 'Line 1\nLine 2\tTabbed\r\nWindows line',
          timestamp: '2024-01-15T10:30:00Z',
          hasMatch: true
        }]
      };

      const { stdout } = captureOutput(() => {
        formatter.format([result]);
      });

      const output = stdout.join('\n');
      expect(output).toContain('Line 1');
      // Newlines and tabs should be handled appropriately
    });
  });

  describe('formatHeader', () => {
    it('should format header with proper column widths', () => {
      const { stdout } = captureOutput(() => {
        formatter.formatHeader();
      });

      const output = stdout.join('\n');
      expect(output).toContain('Session ID');
      expect(output).toContain('Date');
      expect(output).toContain('Project');
      expect(output).toContain('Title');
      expect(output).toContain('Matches');
      expect(output).toContain('─'); // Separator line
    });
  });

  describe('formatRow', () => {
    it('should format row with proper alignment', () => {
      const result: SearchResult = {
        sessionId: 'abc-123-def',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'my-project',
        title: 'My Conversation',
        matchCount: 5,
        messages: []
      };

      const { stdout } = captureOutput(() => {
        formatter.formatRow(result);
      });

      const output = stdout.join('\n');
      expect(output).toContain('abc-123-def');
      expect(output).toContain('2024-01-15');
      expect(output).toContain('my-project');
      expect(output).toContain('My Conversation');
      expect(output).toContain('5');
    });
  });
});