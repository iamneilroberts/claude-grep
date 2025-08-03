export interface ProjectContext {
  currentProject?: string;
  availableProjects: string[];
  isClaudeCode: boolean;
}

export interface SearchResult {
  sessionId: string;
  timestamp: Date | string;
  matchedContent: string;
  files: string[];
  score: number;
  projectName: string;
  branch?: string;
  matchCount?: number;
  metadata?: {
    totalMessages: number;
    hasErrors?: boolean;
    gitBranch?: string;
    projectPath?: string;
  };
  // Additional fields for getConversationById
  lastMessageTime?: Date | string;
  matchedMessages?: ParsedMessage[];
  totalMessages?: number;
  preview?: string;
  hasErrors?: boolean;
  hasToolCalls?: boolean;
}

export interface ParsedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  hasError?: boolean;
  hasToolCall?: boolean;
  files?: string[];
}

export interface SearchOptions {
  query: string;
  project?: string;
  searchAllProjects?: boolean;
  exhaustive?: boolean;
  timeRange?: string;
  includeErrors?: boolean;
  includeToolCalls?: boolean;
  filePatterns?: string;
  format?: OutputFormat;
  maxResults?: number;
}

export type OutputFormat = 'table' | 'list' | 'csv' | 'markdown' | 'json';

export interface SearchResponse {
  results: SearchResult[] | string;
  metadata: {
    totalSearched: number;
    totalMatches: number;
    searchTime: number;
    project: string;
    exhaustive: boolean;
  };
}

export interface Preferences {
  display: {
    defaultFormat: OutputFormat;
    maxPreviewLength: number;
    includeStats: boolean;
  };
  search: {
    defaultProject?: string;
    exhaustive: boolean;
    maxResults: number;
    defaultDaysBack: number;
  };
}