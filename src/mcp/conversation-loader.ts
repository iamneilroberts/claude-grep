import { ConversationScanner } from '../core/scanner.js';
import { ConversationParser } from '../core/parser.js';
import { ParsedMessage } from '../core/types.js';
import * as path from 'path';

export interface ConversationDetails {
  sessionId: string;
  projectName: string;
  messages: ParsedMessage[];
  metadata: {
    totalMessages: number;
    timeRange: {
      start: Date;
      end: Date;
    };
    files: string[];
    hasErrors: boolean;
    hasToolCalls: boolean;
  };
}

export class ConversationLoader {
  private scanner: ConversationScanner;
  private parser: ConversationParser;

  constructor() {
    this.scanner = new ConversationScanner();
    this.parser = new ConversationParser();
  }

  async loadConversation(sessionId: string): Promise<ConversationDetails | null> {
    // Find the conversation file
    const files = await this.scanner.scanConversations();
    const conversationFile = files.find(f => f.sessionId === sessionId);
    
    if (!conversationFile) {
      return null;
    }

    // Parse all messages
    const messages: ParsedMessage[] = [];
    const allFiles = new Set<string>();
    let hasErrors = false;
    let hasToolCalls = false;

    for await (const message of this.parser.parseConversation(conversationFile.path)) {
      messages.push(message);
      message.files.forEach(f => allFiles.add(f));
      if (message.hasError) hasErrors = true;
      if (message.hasToolCall) hasToolCalls = true;
    }

    if (messages.length === 0) {
      return null;
    }

    // Calculate metadata
    const timestamps = messages.map(m => m.timestamp);
    const timeRange = {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime()))),
    };

    return {
      sessionId,
      projectName: conversationFile.projectName || 'unknown',
      messages,
      metadata: {
        totalMessages: messages.length,
        timeRange,
        files: Array.from(allFiles),
        hasErrors,
        hasToolCalls,
      },
    };
  }

  formatConversation(
    details: ConversationDetails,
    format: 'markdown' | 'json',
    options: {
      includeContext?: number;
      highlightMatches?: boolean;
      searchTerms?: string[];
    } = {}
  ): string {
    if (format === 'json') {
      return JSON.stringify(details, null, 2);
    }

    // Markdown format
    let output = `# Conversation: ${details.sessionId}\n\n`;
    output += `**Project:** ${details.projectName}\n`;
    output += `**Messages:** ${details.metadata.totalMessages}\n`;
    output += `**Time Range:** ${this.formatDateRange(details.metadata.timeRange)}\n`;
    
    if (details.metadata.files.length > 0) {
      output += `**Files:** ${details.metadata.files.map(f => `\`${f}\``).join(', ')}\n`;
    }
    
    output += '\n---\n\n';

    // Format messages
    details.messages.forEach((message, index) => {
      const timestamp = new Date(message.timestamp).toLocaleString();
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
      
      output += `## ${role} (${timestamp})\n\n`;
      
      // Highlight search terms if requested
      let content = message.content;
      if (options.highlightMatches && options.searchTerms) {
        for (const term of options.searchTerms) {
          const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
          content = content.replace(regex, '**$1**');
        }
      }
      
      output += content + '\n\n';
      
      if (message.files.length > 0) {
        output += `_Files: ${message.files.map(f => `\`${f}\``).join(', ')}_\n\n`;
      }
      
      if (index < details.messages.length - 1) {
        output += '---\n\n';
      }
    });

    return output;
  }

  private formatDateRange(range: { start: Date; end: Date }): string {
    const start = range.start.toLocaleString();
    const end = range.end.toLocaleString();
    
    // If same day, show simplified format
    if (range.start.toDateString() === range.end.toDateString()) {
      const date = range.start.toLocaleDateString();
      const startTime = range.start.toLocaleTimeString();
      const endTime = range.end.toLocaleTimeString();
      return `${date} (${startTime} - ${endTime})`;
    }
    
    return `${start} - ${end}`;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}