import { Conversation, Message } from '@/types';

export const createMockMessage = (overrides?: Partial<Message>): Message => ({
  role: 'user',
  content: 'Test message content',
  timestamp: new Date().toISOString(),
  ...overrides
});

export const createMockConversation = (overrides?: Partial<Conversation>): Conversation => ({
  sessionId: 'test-session-123',
  messages: [
    createMockMessage({ role: 'user', content: 'How do I implement authentication?' }),
    createMockMessage({ role: 'assistant', content: 'Here\'s how to implement authentication...' })
  ],
  metadata: {
    title: 'Test Conversation',
    project: 'test-project',
    timestamp: new Date().toISOString(),
    tags: []
  },
  ...overrides
});

export const conversationFixtures = {
  simple: createMockConversation({
    sessionId: 'simple-123',
    messages: [
      createMockMessage({ role: 'user', content: 'Hello' }),
      createMockMessage({ role: 'assistant', content: 'Hi there!' })
    ]
  }),
  
  withCode: createMockConversation({
    sessionId: 'code-456',
    messages: [
      createMockMessage({ role: 'user', content: 'Show me a TypeScript function' }),
      createMockMessage({ 
        role: 'assistant', 
        content: '```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n```' 
      })
    ]
  }),
  
  withErrors: createMockConversation({
    sessionId: 'error-789',
    messages: [
      createMockMessage({ role: 'user', content: 'My code is failing' }),
      createMockMessage({ 
        role: 'assistant', 
        content: 'I see an error in your code. The issue is...' 
      })
    ],
    metadata: {
      title: 'Debugging Session',
      project: 'test-project',
      timestamp: new Date().toISOString(),
      tags: ['error', 'debugging']
    }
  }),
  
  withToolCalls: createMockConversation({
    sessionId: 'tools-101',
    messages: [
      createMockMessage({ role: 'user', content: 'Read the package.json file' }),
      createMockMessage({ 
        role: 'assistant', 
        content: 'I\'ll read the package.json file for you.',
        toolCalls: [{
          id: 'call-123',
          type: 'function',
          function: {
            name: 'read_file',
            arguments: '{"path": "package.json"}'
          }
        }]
      })
    ]
  }),
  
  longConversation: createMockConversation({
    sessionId: 'long-202',
    messages: Array.from({ length: 50 }, (_, i) => [
      createMockMessage({ 
        role: 'user', 
        content: `Question ${i + 1}: How do I ${['implement', 'debug', 'optimize', 'test'][i % 4]} this?` 
      }),
      createMockMessage({ 
        role: 'assistant', 
        content: `Answer ${i + 1}: Here's how you can approach that...` 
      })
    ]).flat()
  }),
  
  multiProject: [
    createMockConversation({
      sessionId: 'proj1-001',
      metadata: {
        title: 'Project 1 Discussion',
        project: 'project-one',
        timestamp: new Date().toISOString(),
        tags: []
      }
    }),
    createMockConversation({
      sessionId: 'proj2-001',
      metadata: {
        title: 'Project 2 Discussion',
        project: 'project-two',
        timestamp: new Date().toISOString(),
        tags: []
      }
    })
  ]
};

export const malformedJsonLines = [
  '{"valid": "json", "line": 1}',
  'this is not json',
  '{"partial": "json"',
  '{"valid": "json", "line": 2}',
  '',
  null,
  undefined,
  '{"valid": "json", "line": 3}'
];

export const createJsonlContent = (conversations: Conversation[]): string => {
  return conversations.map(conv => JSON.stringify(conv)).join('\n');
};

export const createCorruptedJsonl = (): string => {
  return malformedJsonLines.filter(line => line !== null && line !== undefined).join('\n');
};