import * as path from 'path';
import * as os from 'os';

export interface MockFileSystem {
  baseDir: string;
  projectDirs: string[];
  conversationFiles: Map<string, string>;
}

export const createMockFileSystem = (): MockFileSystem => {
  const baseDir = path.join(os.homedir(), '.claude', 'conversation_history');
  
  return {
    baseDir,
    projectDirs: [
      'project-one',
      'project-two',
      'test-project',
      'empty-project'
    ],
    conversationFiles: new Map([
      ['project-one/2024-01-15.jsonl', 'conversation data'],
      ['project-one/2024-01-16.jsonl', 'conversation data'],
      ['project-two/2024-01-15.jsonl', 'conversation data'],
      ['test-project/2024-01-15.jsonl', 'conversation data'],
      ['test-project/2024-01-16.jsonl', 'conversation data'],
      ['test-project/2024-01-17.jsonl', 'conversation data'],
      // Empty project has no files
    ])
  };
};

export const mockProjectStructure = {
  'claude-grep': {
    files: [
      'package.json',
      'tsconfig.json',
      'README.md',
      'src/index.ts',
      'src/core/search.ts',
      'src/core/parser.ts'
    ]
  },
  'travel-agent': {
    files: [
      'package.json',
      'src/app.ts',
      'src/routes/index.ts'
    ]
  },
  'test-project': {
    files: [
      'index.js',
      'test.js'
    ]
  }
};

export const createMockStats = (isDirectory: boolean = false, size: number = 1024) => ({
  isDirectory: () => isDirectory,
  isFile: () => !isDirectory,
  size,
  mtime: new Date(),
  atime: new Date(),
  ctime: new Date(),
  birthtime: new Date()
});

export const mockGlobPatterns = {
  allJsonl: '**/*.jsonl',
  specificProject: 'test-project/**/*.jsonl',
  dateRange: '**/2024-01-{15,16}.jsonl',
  invalid: '**/*.xyz'
};