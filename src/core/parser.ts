import * as fs from 'fs';
import * as readline from 'readline';
import { ParsedMessage, ConversationMessage, ContentBlock } from './types.js';

// Regex patterns for file detection
const FILE_PATTERNS = [
  // Standard file extensions - order matters for tsx/jsx before ts/js
  /(?:^|\s)([A-Za-z0-9\-_./]+\.(?:tsx|jsx|ts|js|md|json|yml|yaml|toml|txt|py|java|go|rs|cpp|c|h|hpp|css|html|vue|svelte))\b/gi,
  // Task files pattern
  /(?:TASK-\d{4}-\d{1,3}(?:\.\d+)?(?:-[A-Za-z0-9\-]+)?\.md)/gi,
  // Project folder patterns
  /(?:\.project\/[A-Za-z0-9\-_./]+)/gi,
  // Common config files
  /(?:package\.json|tsconfig\.json|\.eslintrc|\.prettierrc|\.gitignore)/gi,
];

export class ConversationParser {
  /**
   * Parse a JSONL conversation file using streaming for memory efficiency
   */
  async *parseConversation(filePath: string): AsyncGenerator<ParsedMessage> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineNumber = 0;
    for await (const line of rl) {
      lineNumber++;
      if (!line.trim()) continue;

      try {
        const message: ConversationMessage = JSON.parse(line);
        const parsed = this.parseMessage(message);
        if (parsed) {
          yield parsed;
        }
      } catch (error) {
        // Log error but continue processing
        console.warn(`Skipping malformed line ${lineNumber} in ${filePath}: ${error}`);
        continue;
      }
    }
  }

  /**
   * Parse a single message
   */
  private parseMessage(message: ConversationMessage): ParsedMessage | null {
    const content = this.extractContent(message.message?.content);
    if (!content) return null;

    const files = this.extractFiles(content);
    const hasError = this.detectError(content);
    const hasToolCall = this.detectToolCall(message);

    return {
      sessionId: message.sessionId,
      timestamp: new Date(message.timestamp),
      content,
      files,
      branch: message.gitBranch,
      messageId: message.uuid,
      role: message.type as 'user' | 'assistant',
      hasError,
      hasToolCall,
    };
  }

  /**
   * Extract text content from various content formats
   */
  private extractContent(content: string | ContentBlock[] | undefined): string {
    if (!content) return '';

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((block) => {
          if (block.type === 'text' && typeof block.text === 'string') {
            return block.text;
          }
          if (block.type === 'tool_use') {
            return `[Tool: ${block.name}]`;
          }
          if (block.type === 'tool_result') {
            return `[Tool Result: ${block.tool_use_id}]`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n')
        .trim();
    }

    return '';
  }

  /**
   * Extract file references from content
   */
  extractFiles(content: string): string[] {
    const files = new Set<string>();

    for (const pattern of FILE_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        // Get the full match or the first capture group
        const file = match[1] || match[0];
        if (file && !file.startsWith('http')) {
          files.add(file.trim());
        }
      }
    }

    // Also look for files in code blocks
    const codeBlockPattern = /```[a-zA-Z]*\s*\n?([^`]+)```/g;
    const codeBlocks = content.matchAll(codeBlockPattern);
    for (const block of codeBlocks) {
      const blockContent = block[1];
      // Look for import/require statements
      const importPattern = /(?:import|require)\s*(?:(?:\{[^}]*\}|\w+)\s*from\s*)?(?:\(?\s*)?['"`]([^'"`]+)['"`]/g;
      const imports = blockContent.matchAll(importPattern);
      for (const imp of imports) {
        if (imp[1] && !imp[1].startsWith('http')) {
          files.add(imp[1].trim());
        }
      }
    }

    return Array.from(files);
  }

  /**
   * Detect if content contains error indicators
   */
  private detectError(content: string): boolean {
    const errorPatterns = [
      /error:/i,
      /exception:/i,
      /failed:/i,
      /failure:/i,
      /traceback/i,
      /stack trace/i,
      /TypeError/,
      /ReferenceError/,
      /SyntaxError/,
      /Error\s+at\s+/,
    ];

    const lowerContent = content.toLowerCase();
    return errorPatterns.some(pattern => pattern.test(lowerContent));
  }

  /**
   * Detect if message contains tool calls
   */
  private detectToolCall(message: ConversationMessage): boolean {
    if (!message.message || typeof message.message.content === 'string') {
      return false;
    }

    if (Array.isArray(message.message.content)) {
      return message.message.content.some(
        block => block.type === 'tool_use' || block.type === 'tool_result'
      );
    }

    return false;
  }
}

/**
 * Convenience function for parsing a single conversation file
 */
export async function* parseConversation(filePath: string): AsyncGenerator<ParsedMessage> {
  const parser = new ConversationParser();
  yield* parser.parseConversation(filePath);
}