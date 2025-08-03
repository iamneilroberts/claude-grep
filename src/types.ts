// Re-export all types from core/types
export * from './core/types';

// Define types needed by tests
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCall?: any;
  toolCalls?: any[];
  toolResult?: any;
}

export interface ConversationMetadata {
  title: string;
  project: string;
  timestamp: string;
  tags: string[];
  branch?: string;
}

export interface Conversation {
  sessionId: string;
  messages: Message[];
  metadata: ConversationMetadata;
}