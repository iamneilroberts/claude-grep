import { CsvFormatter } from '@/mcp/formatters/csv';
import { SearchResult } from '@/core/results';
import { captureOutput } from '../../utils/test-helpers';

describe('CsvFormatter', () => {
  let formatter: CsvFormatter;

  beforeEach(() => {
    formatter = new CsvFormatter();
  });

  describe('format', () => {
    it('should format empty results with header only', () => {
      const results: SearchResult[] = [];
      const { stdout } = captureOutput(() => {
        formatter.format(results);
      });

      expect(stdout).toHaveLength(1); // Header only
      expect(stdout[0]).toContain('Session ID,Date,Project,Title,Matches,Preview');
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

      expect(stdout).toHaveLength(2); // Header + 1 row
      expect(stdout[1]).toContain('session-123');
      expect(stdout[1]).toContain('2024-01-15T10:30:00Z');
      expect(stdout[1]).toContain('test-project');
      expect(stdout[1]).toContain('Test Conversation');
      expect(stdout[1]).toContain('1');
      expect(stdout[1]).toContain('How do I implement authentication?');
    });

    it('should escape special characters', () => {
      const result: SearchResult = {
        sessionId: 'session-123',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'test,project',
        title: 'Title with "quotes"',
        matchCount: 1,
        messages: [{
          role: 'user',
          content: 'Content with, comma and "quotes"',
          timestamp: '2024-01-15T10:30:00Z',
          hasMatch: true
        }]
      };

      const { stdout } = captureOutput(() => {
        formatter.format([result]);
      });

      expect(stdout[1]).toContain('"test,project"'); // Quoted because of comma
      expect(stdout[1]).toContain('"Title with ""quotes"""'); // Escaped quotes
      expect(stdout[1]).toContain('"Content with, comma and ""quotes"""');
    });

    it('should handle newlines in content', () => {
      const result: SearchResult = {
        sessionId: 'session-123',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'test-project',
        title: 'Multi-line',
        matchCount: 1,
        messages: [{
          role: 'user',
          content: 'Line 1\nLine 2\nLine 3',
          timestamp: '2024-01-15T10:30:00Z',
          hasMatch: true
        }]
      };

      const { stdout } = captureOutput(() => {
        formatter.format([result]);
      });

      expect(stdout[1]).toContain('"Line 1\nLine 2\nLine 3"'); // Quoted because of newlines
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

      expect(stdout).toHaveLength(3); // Header + 2 rows
      expect(stdout[1]).toContain('session-1');
      expect(stdout[1]).toContain('Question 1');
      expect(stdout[2]).toContain('session-2');
      expect(stdout[2]).toContain('Answer 2');
    });

    it('should limit preview length', () => {
      const longContent = 'This is a very long message '.repeat(50);
      const result: SearchResult = {
        sessionId: 'session-123',
        timestamp: '2024-01-15T10:30:00Z',
        project: 'test-project',
        title: 'Long',
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

      const preview = stdout[1].split(',').pop();
      expect(preview!.length).toBeLessThan(longContent.length);
      expect(preview).toContain('...');
    });
  });

  describe('escapeCSV', () => {
    it('should not escape simple strings', () => {
      expect(formatter.escapeCSV('simple')).toBe('simple');
      expect(formatter.escapeCSV('with spaces')).toBe('with spaces');
    });

    it('should escape strings with commas', () => {
      expect(formatter.escapeCSV('value,with,commas')).toBe('"value,with,commas"');
    });

    it('should escape strings with quotes', () => {
      expect(formatter.escapeCSV('value with "quotes"')).toBe('"value with ""quotes"""');
    });

    it('should escape strings with newlines', () => {
      expect(formatter.escapeCSV('line1\nline2')).toBe('"line1\nline2"');
    });

    it('should handle empty strings', () => {
      expect(formatter.escapeCSV('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(formatter.escapeCSV(null as any)).toBe('');
      expect(formatter.escapeCSV(undefined as any)).toBe('');
    });
  });
});