export interface SearchOptions {
  query: string;
  projectContext?: string;
  filePatterns?: string[];
  timeRange?: { start?: Date; end?: Date };
  exhaustive?: boolean;
  limit?: number;
  keywords?: string[];
  includeErrors?: boolean;
  includeToolCalls?: boolean;
  messageTypes?: MessageType[];
  sortBy?: 'relevance' | 'date' | 'messageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  sessionId: string;
  timestamp: Date;
  matchedContent: string;
  files: string[];
  score: number;
  projectName: string;
  branch?: string;
  matchCount?: number;
  metadata?: SearchResultMetadata;
}

export interface SearchResultMetadata {
  totalMessages: number;
  messageTypes?: Record<MessageType, number>;
  hasErrors?: boolean;
  gitBranch?: string;
  projectPath?: string;
}

export interface SearchProgress {
  filesProcessed: number;
  totalFiles: number;
  currentFile?: string;
  stage?: 'scanning' | 'searching' | 'ranking';
}

export type MessageType = 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'system';

export interface ParsedMessage {
  sessionId: string;
  timestamp: Date;
  content: string;
  files: string[];
  branch?: string;
  messageId: string;
  role: 'user' | 'assistant';
  hasError?: boolean;
  hasToolCall?: boolean;
}

export interface ConversationFile {
  path: string;
  sessionId: string;
  lastModified: Date;
  projectName?: string;
}

export interface ConversationMessage {
  uuid: string;
  sessionId: string;
  timestamp: string;
  type: string;
  gitBranch?: string;
  message?: {
    content: string | ContentBlock[];
  };
  toolUseResult?: any;
}

export interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  [key: string]: any;
}

export interface RankingWeights {
  keywordMatch: number;
  recency: number;
  messageTypeMatch: number;
  errorPresence: number;
  toolCallPresence: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  keywordMatch: 0.4,
  recency: 0.2,
  messageTypeMatch: 0.2,
  errorPresence: 0.1,
  toolCallPresence: 0.1,
};