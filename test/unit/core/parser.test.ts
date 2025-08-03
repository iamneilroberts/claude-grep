import { ConversationParser } from '@/core/parser';
import { conversationFixtures, createJsonlContent, createCorruptedJsonl } from '../../fixtures/conversations';
import { createTempDir, cleanupTempDir, writeJsonlFile } from '../../utils/test-helpers';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ParsedMessage } from '@/core/types';

describe('ConversationParser', () => {
  let parser: ConversationParser;
  let tempDir: string;

  beforeEach(async () => {
    parser = new ConversationParser();
    tempDir = await createTempDir('parser-test');
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('parseConversation', () => {
    it('should parse valid JSONL files', async () => {
      const testFile = path.join(tempDir, 'valid.jsonl');
      const conversations = [conversationFixtures.simple, conversationFixtures.withCode];
      await writeJsonlFile(testFile, conversations);

      const messages: ParsedMessage[] = [];
      for await (const message of parser.parseConversation(testFile)) {
        messages.push(message);
      }

      expect(messages).toHaveLength(4); // 2 messages from each conversation
      expect(messages[0].content).toBe('Hello');
      expect(messages[0].role).toBe('user');
      expect(messages[1].content).toBe('Hi there!');
      expect(messages[1].role).toBe('assistant');
    });

    it('should handle corrupted JSON lines gracefully', async () => {
      const testFile = path.join(tempDir, 'corrupted.jsonl');
      await fs.writeFile(testFile, createCorruptedJsonl(), 'utf-8');

      const messages: ParsedMessage[] = [];
      const errors: string[] = [];
      
      // Capture console warnings
      const originalWarn = console.warn;
      console.warn = (msg: string) => errors.push(msg);

      try {
        for await (const message of parser.parseConversation(testFile)) {
          messages.push(message);
        }
      } finally {
        console.warn = originalWarn;
      }

      // Should parse valid lines and skip corrupted ones
      expect(messages.length).toBeGreaterThan(0);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Skipping malformed line'))).toBe(true);
    });

    it('should extract files from content', async () => {
      const testFile = path.join(tempDir, 'files.jsonl');
      const conversation = conversationFixtures.simple;
      conversation.messages[0].content = 'Please check src/index.ts and package.json. Also look at TASK-001-feature.md';
      
      await writeJsonlFile(testFile, [conversation]);

      const messages: ParsedMessage[] = [];
      for await (const message of parser.parseConversation(testFile)) {
        messages.push(message);
      }

      expect(messages[0].files).toContain('src/index.ts');
      expect(messages[0].files).toContain('package.json');
      expect(messages[0].files).toContain('TASK-001-feature.md');
    });

    it('should detect errors in content', async () => {
      const testFile = path.join(tempDir, 'errors.jsonl');
      const conversation = conversationFixtures.withErrors;
      
      await writeJsonlFile(testFile, [conversation]);

      const messages: ParsedMessage[] = [];
      for await (const message of parser.parseConversation(testFile)) {
        messages.push(message);
      }

      expect(messages.find(m => m.content.includes('error'))).toBeDefined();
      expect(messages.find(m => m.content.includes('error'))?.hasError).toBe(true);
    });

    it('should handle tool calls in content', async () => {
      const testFile = path.join(tempDir, 'tools.jsonl');
      const conversation = conversationFixtures.withToolCalls;
      
      await writeJsonlFile(testFile, [conversation]);

      const messages: ParsedMessage[] = [];
      for await (const message of parser.parseConversation(testFile)) {
        messages.push(message);
      }

      const toolMessage = messages.find(m => m.role === 'assistant');
      expect(toolMessage?.hasToolCall).toBe(true);
      expect(toolMessage?.content).toContain('read the package.json file');
    });

    it('should handle large conversations efficiently', async () => {
      const testFile = path.join(tempDir, 'large.jsonl');
      const conversation = conversationFixtures.longConversation;
      
      await writeJsonlFile(testFile, [conversation]);

      const messages: ParsedMessage[] = [];
      const startTime = Date.now();
      
      for await (const message of parser.parseConversation(testFile)) {
        messages.push(message);
      }
      
      const elapsedTime = Date.now() - startTime;

      expect(messages).toHaveLength(100); // 50 Q&A pairs
      expect(elapsedTime).toBeLessThan(1000); // Should process in under 1 second
    });

    it('should handle empty files', async () => {
      const testFile = path.join(tempDir, 'empty.jsonl');
      await fs.writeFile(testFile, '', 'utf-8');

      const messages: ParsedMessage[] = [];
      for await (const message of parser.parseConversation(testFile)) {
        messages.push(message);
      }

      expect(messages).toHaveLength(0);
    });

    it('should handle non-existent files', async () => {
      const testFile = path.join(tempDir, 'non-existent.jsonl');
      
      await expect(async () => {
        const messages: ParsedMessage[] = [];
        for await (const message of parser.parseConversation(testFile)) {
          messages.push(message);
        }
      }).rejects.toThrow();
    });
  });

  describe('extractFiles', () => {
    it('should extract various file patterns', () => {
      const content = `
        Check these files:
        - src/components/Button.tsx
        - package.json
        - .eslintrc.js
        - TASK-123-implement-feature.md
        - .project/overview/README.md
        Also see config.yaml and test.py
      `;

      const files = parser.extractFiles(content);

      expect(files).toContain('src/components/Button.tsx');
      expect(files).toContain('package.json');
      expect(files).toContain('.eslintrc.js');
      expect(files).toContain('TASK-123-implement-feature.md');
      expect(files).toContain('.project/overview/README.md');
      expect(files).toContain('config.yaml');
      expect(files).toContain('test.py');
    });

    it('should not extract URLs as files', () => {
      const content = 'Visit https://example.com/file.js for more info';
      const files = parser.extractFiles(content);
      
      expect(files).not.toContain('https://example.com/file.js');
    });

    it('should extract files from code blocks', () => {
      const content = `
        Here's the import:
        \`\`\`typescript
        import { Button } from './components/Button';
        import utils from '../utils/helpers.js';
        require('./config.json');
        \`\`\`
      `;

      const files = parser.extractFiles(content);

      expect(files).toContain('./components/Button');
      expect(files).toContain('../utils/helpers.js');
      expect(files).toContain('./config.json');
    });

    it('should handle file paths in various contexts', () => {
      const content = `
        The file at /absolute/path/file.txt
        In directory: ~/home/user/project/
        Windows path: C:\\Users\\Documents\\file.doc
        Relative: ../../../shared/utils.js
        Hidden: .env.local
      `;

      const files = parser.extractFiles(content);

      expect(files).toContain('/absolute/path/file.txt');
      expect(files).toContain('~/home/user/project/');
      expect(files).toContain('C:\\Users\\Documents\\file.doc');
      expect(files).toContain('../../../shared/utils.js');
      expect(files).toContain('.env.local');
    });

    it('should deduplicate file paths', () => {
      const content = `
        Check package.json
        Also see package.json
        Don't forget package.json
      `;

      const files = parser.extractFiles(content);

      expect(files.filter(f => f === 'package.json')).toHaveLength(1);
    });
  });

  describe('detectErrors', () => {
    it('should detect common error patterns', () => {
      const errorMessages = [
        'TypeError: Cannot read property of undefined',
        'ReferenceError: variable is not defined',
        'SyntaxError: Unexpected token',
        'Error: ENOENT: no such file or directory',
        'Failed to compile',
        'Module not found',
        'Cannot find module',
        'FATAL ERROR: something went wrong'
      ];

      for (const message of errorMessages) {
        expect(parser.detectErrors(message)).toBe(true);
      }
    });

    it('should not detect false positives', () => {
      const normalMessages = [
        'Everything is working fine',
        'Successfully compiled',
        'No errors found',
        'The error handling is implemented correctly'
      ];

      for (const message of normalMessages) {
        expect(parser.detectErrors(message)).toBe(false);
      }
    });
  });
});