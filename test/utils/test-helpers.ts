import { Readable } from 'stream';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Conversation } from '@/types';

export async function createTempDir(prefix: string = 'claude-chat-test'): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  return tmpDir;
}

export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup temp directory: ${dir}`, error);
  }
}

export function createReadableStream(data: string[]): Readable {
  return Readable.from(data);
}

export async function writeJsonlFile(filePath: string, conversations: Conversation[]): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  
  // Convert conversations to message format expected by parser
  const messages = conversations.flatMap(conv => 
    conv.messages.map(msg => ({
      uuid: `${conv.sessionId}-${msg.timestamp}`,
      sessionId: conv.sessionId,
      timestamp: msg.timestamp,
      type: msg.role === 'user' ? 'human_message' : 'ai_message',
      gitBranch: conv.metadata.branch,
      message: {
        content: msg.content
      },
      toolUseResult: msg.toolResult,
      toolCalls: msg.toolCalls
    }))
  );
  
  const content = messages
    .map(msg => JSON.stringify(msg))
    .join('\n');
  
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function setupTestProject(baseDir: string, projectName: string, conversations: Conversation[]): Promise<string> {
  const projectDir = path.join(baseDir, projectName);
  await fs.mkdir(projectDir, { recursive: true });
  
  // Group conversations by date
  const conversationsByDate = new Map<string, Conversation[]>();
  
  for (const conv of conversations) {
    const date = conv.metadata.timestamp.split('T')[0];
    if (!conversationsByDate.has(date)) {
      conversationsByDate.set(date, []);
    }
    conversationsByDate.get(date)!.push(conv);
  }
  
  // Write JSONL files for each date
  for (const [date, convs] of conversationsByDate) {
    const filePath = path.join(projectDir, `${date}.jsonl`);
    await writeJsonlFile(filePath, convs);
  }
  
  return projectDir;
}

export class TestTimer {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  elapsed(): number {
    return Date.now() - this.startTime;
  }
  
  reset(): void {
    this.startTime = Date.now();
  }
}

export function expectToContainAll<T>(actual: T[], expected: T[]): void {
  for (const item of expected) {
    expect(actual).toContain(item);
  }
}

export function expectToMatchPattern(actual: string, pattern: RegExp): void {
  expect(actual).toMatch(pattern);
}

export async function waitFor(conditionFn: () => boolean, timeout: number = 5000, interval: number = 100): Promise<void> {
  const startTime = Date.now();
  
  while (!conditionFn()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

export function createMockConsole() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };
}

export function captureOutput(fn: () => void | Promise<void>): { stdout: string[], stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args: any[]) => stdout.push(args.join(' '));
  console.error = (...args: any[]) => stderr.push(args.join(' '));
  
  try {
    const result = fn();
    if (result instanceof Promise) {
      return { stdout, stderr };
    }
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
  
  return { stdout, stderr };
}