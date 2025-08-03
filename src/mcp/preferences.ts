import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface DisplayPreferences {
  defaultFormat: 'table' | 'list' | 'csv' | 'markdown' | 'json';
  includeStats: boolean;
  maxPreviewLength: number;
  showRankingExplanation: boolean;
}

export interface SearchPreferences {
  maxResults: number;
  defaultDaysBack: number;
  exhaustive: boolean;
  defaultProject?: string;
}

export interface PerformancePreferences {
  batchSize: number;
  memoryLimit: number;
  enableProgressBar: boolean;
}

export interface Preferences {
  display: DisplayPreferences;
  search: SearchPreferences;
  performance: PerformancePreferences;
}

const DEFAULT_PREFERENCES: Preferences = {
  display: {
    defaultFormat: 'table',
    includeStats: true,
    maxPreviewLength: 200,
    showRankingExplanation: false,
  },
  search: {
    maxResults: 20,
    defaultDaysBack: 30,
    exhaustive: false,
  },
  performance: {
    batchSize: 10,
    memoryLimit: 512, // MB
    enableProgressBar: true,
  },
};

export class PreferencesManager {
  private static instance: PreferencesManager;
  private preferences: Preferences;
  private configPath: string;
  private isDirty: boolean = false;

  private constructor() {
    this.configPath = path.join(
      os.homedir(),
      '.claude-grep',
      'config.json'
    );
    this.preferences = { ...DEFAULT_PREFERENCES };
  }

  static getInstance(): PreferencesManager {
    if (!PreferencesManager.instance) {
      PreferencesManager.instance = new PreferencesManager();
    }
    return PreferencesManager.instance;
  }

  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = await fs.promises.readFile(this.configPath, 'utf-8');
        const loaded = JSON.parse(data);
        this.preferences = this.mergePreferences(DEFAULT_PREFERENCES, loaded);
      } else {
        // Create config directory if it doesn't exist
        const configDir = path.dirname(this.configPath);
        await fs.promises.mkdir(configDir, { recursive: true });
        await this.save();
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  async save(): Promise<void> {
    try {
      const configDir = path.dirname(this.configPath);
      await fs.promises.mkdir(configDir, { recursive: true });
      
      await fs.promises.writeFile(
        this.configPath,
        JSON.stringify(this.preferences, null, 2)
      );
      
      this.isDirty = false;
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }

  get<K extends keyof Preferences>(category: K): Preferences[K];
  get<K extends keyof Preferences, P extends keyof Preferences[K]>(
    path: `${K}.${P & string}`
  ): Preferences[K][P];
  get(path: string): any {
    const parts = path.split('.');
    let current: any = this.preferences;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  async set<K extends keyof Preferences>(
    category: K,
    value: Preferences[K]
  ): Promise<void>;
  async set<K extends keyof Preferences, P extends keyof Preferences[K]>(
    path: `${K}.${P & string}`,
    value: Preferences[K][P]
  ): Promise<void>;
  async set(path: string, value: any): Promise<void> {
    const parts = path.split('.');
    let current: any = this.preferences;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
    
    this.isDirty = true;
    await this.save();
  }

  getAll(): Preferences {
    return { ...this.preferences };
  }

  async reset(category?: keyof Preferences): Promise<void> {
    if (category) {
      // Type-safe assignment for specific category
      const defaultValue = DEFAULT_PREFERENCES[category];
      (this.preferences as any)[category] = { ...defaultValue };
    } else {
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
    
    this.isDirty = true;
    await this.save();
  }

  private mergePreferences(defaults: any, loaded: any): any {
    const result: any = {};
    
    for (const key in defaults) {
      if (key in loaded && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
        result[key] = this.mergePreferences(defaults[key], loaded[key]);
      } else if (key in loaded) {
        result[key] = loaded[key];
      } else {
        result[key] = defaults[key];
      }
    }
    
    return result;
  }

  // Convenience methods
  getDefaultFormat(): string {
    return this.get('display.defaultFormat');
  }

  async setDefaultFormat(format: DisplayPreferences['defaultFormat']): Promise<void> {
    await this.set('display.defaultFormat', format);
  }

  getDefaultProject(): string | undefined {
    return this.get('search.defaultProject');
  }

  async setDefaultProject(project: string): Promise<void> {
    await this.set('search.defaultProject', project);
  }

  isExhaustiveByDefault(): boolean {
    return this.get('search.exhaustive');
  }

  getMaxResults(): number {
    return this.get('search.maxResults');
  }
}