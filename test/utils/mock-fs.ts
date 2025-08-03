import * as path from 'path';

export interface MockFile {
  path: string;
  content: string;
  stats?: {
    size: number;
    mtime: Date;
    isDirectory: boolean;
  };
}

export interface MockFS {
  files: Map<string, MockFile>;
  reset: () => void;
  addFile: (filePath: string, content: string) => void;
  addDirectory: (dirPath: string) => void;
  getFileContent: (filePath: string) => string | null;
  listFiles: (dirPath: string) => string[];
  exists: (filePath: string) => boolean;
  getStats: (filePath: string) => any;
}

export function createMockFS(): MockFS {
  const files = new Map<string, MockFile>();
  
  return {
    files,
    
    reset() {
      files.clear();
    },
    
    addFile(filePath: string, content: string) {
      files.set(filePath, {
        path: filePath,
        content,
        stats: {
          size: content.length,
          mtime: new Date(),
          isDirectory: false
        }
      });
      
      // Ensure parent directories exist
      const parts = filePath.split(path.sep);
      for (let i = 1; i < parts.length; i++) {
        const dirPath = parts.slice(0, i).join(path.sep);
        if (dirPath && !files.has(dirPath)) {
          this.addDirectory(dirPath);
        }
      }
    },
    
    addDirectory(dirPath: string) {
      if (!files.has(dirPath)) {
        files.set(dirPath, {
          path: dirPath,
          content: '',
          stats: {
            size: 0,
            mtime: new Date(),
            isDirectory: true
          }
        });
      }
    },
    
    getFileContent(filePath: string): string | null {
      const file = files.get(filePath);
      return file && !file.stats?.isDirectory ? file.content : null;
    },
    
    listFiles(dirPath: string): string[] {
      const results: string[] = [];
      const dirPathWithSep = dirPath.endsWith(path.sep) ? dirPath : dirPath + path.sep;
      
      for (const [filePath, file] of files) {
        if (filePath.startsWith(dirPathWithSep)) {
          const relativePath = filePath.slice(dirPathWithSep.length);
          const firstSegment = relativePath.split(path.sep)[0];
          if (firstSegment && !results.includes(firstSegment)) {
            results.push(firstSegment);
          }
        }
      }
      
      return results;
    },
    
    exists(filePath: string): boolean {
      return files.has(filePath);
    },
    
    getStats(filePath: string) {
      const file = files.get(filePath);
      if (!file) {
        throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`);
      }
      
      return {
        ...file.stats,
        isFile: () => !file.stats?.isDirectory,
        isDirectory: () => file.stats?.isDirectory || false
      };
    }
  };
}

export function createMockFsModule(mockFs: MockFS) {
  return {
    readFileSync: (filePath: string) => {
      const content = mockFs.getFileContent(filePath);
      if (content === null) {
        throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      }
      return content;
    },
    
    readdirSync: (dirPath: string) => {
      return mockFs.listFiles(dirPath);
    },
    
    existsSync: (filePath: string) => {
      return mockFs.exists(filePath);
    },
    
    statSync: (filePath: string) => {
      return mockFs.getStats(filePath);
    },
    
    promises: {
      readFile: async (filePath: string) => {
        const content = mockFs.getFileContent(filePath);
        if (content === null) {
          throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
        }
        return content;
      },
      
      readdir: async (dirPath: string) => {
        return mockFs.listFiles(dirPath);
      },
      
      stat: async (filePath: string) => {
        return mockFs.getStats(filePath);
      }
    }
  };
}