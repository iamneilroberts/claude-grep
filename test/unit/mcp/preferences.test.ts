import { PreferencesManager } from '@/mcp/preferences';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PreferencesManager', () => {
  let preferencesManager: PreferencesManager;
  let testConfigPath: string;

  beforeEach(async () => {
    // Create a test config directory
    const testDir = path.join(os.tmpdir(), 'claude-grep-test', Date.now().toString());
    testConfigPath = path.join(testDir, '.claude-grep', 'config.json');
    
    // Mock the home directory
    jest.spyOn(os, 'homedir').mockReturnValue(testDir);
    
    // Get instance (singleton)
    preferencesManager = PreferencesManager.getInstance();
    
    // Load preferences (will create default config)
    await preferencesManager.load();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      const testDir = path.dirname(path.dirname(testConfigPath));
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    
    // Restore mocks
    jest.restoreAllMocks();
  });

  describe('load and save', () => {
    it('should create default preferences on first load', async () => {
      expect(fs.existsSync(testConfigPath)).toBe(true);
      
      const savedData = JSON.parse(await fs.promises.readFile(testConfigPath, 'utf-8'));
      expect(savedData.display.defaultFormat).toBe('table');
      expect(savedData.search.maxResults).toBe(20);
    });

    it('should load existing preferences', async () => {
      // Modify preferences
      await preferencesManager.set('display.defaultFormat', 'json');
      
      // Create new instance and load
      const newManager = PreferencesManager.getInstance();
      await newManager.load();
      
      expect(newManager.get('display.defaultFormat')).toBe('json');
    });

    it('should merge with defaults when loading partial config', async () => {
      // Write partial config
      const partialConfig = {
        display: {
          defaultFormat: 'markdown'
        }
      };
      await fs.promises.writeFile(testConfigPath, JSON.stringify(partialConfig));
      
      // Load preferences
      await preferencesManager.load();
      
      // Should have custom format but default other values
      expect(preferencesManager.get('display.defaultFormat')).toBe('markdown');
      expect(preferencesManager.get('display.includeStats')).toBe(true); // default
      expect(preferencesManager.get('search.maxResults')).toBe(20); // default
    });
  });

  describe('get and set', () => {
    it('should get nested preferences', () => {
      expect(preferencesManager.get('display.defaultFormat')).toBe('table');
      expect(preferencesManager.get('search.maxResults')).toBe(20);
    });

    it('should get category preferences', () => {
      const displayPrefs = preferencesManager.get('display');
      expect(displayPrefs.defaultFormat).toBe('table');
      expect(displayPrefs.includeStats).toBe(true);
    });

    it('should set nested preferences', async () => {
      await preferencesManager.set('display.defaultFormat', 'csv');
      expect(preferencesManager.get('display.defaultFormat')).toBe('csv');
      
      // Verify saved to disk
      const savedData = JSON.parse(await fs.promises.readFile(testConfigPath, 'utf-8'));
      expect(savedData.display.defaultFormat).toBe('csv');
    });

    it('should set category preferences', async () => {
      await preferencesManager.set('display', {
        defaultFormat: 'json',
        includeStats: false,
        maxPreviewLength: 300,
        showRankingExplanation: true
      });
      
      const displayPrefs = preferencesManager.get('display');
      expect(displayPrefs.defaultFormat).toBe('json');
      expect(displayPrefs.includeStats).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all preferences to defaults', async () => {
      // Change some preferences
      await preferencesManager.set('display.defaultFormat', 'json');
      await preferencesManager.set('search.maxResults', 50);
      
      // Reset all
      await preferencesManager.reset();
      
      expect(preferencesManager.get('display.defaultFormat')).toBe('table');
      expect(preferencesManager.get('search.maxResults')).toBe(20);
    });

    it('should reset specific category to defaults', async () => {
      // Change preferences in multiple categories
      await preferencesManager.set('display.defaultFormat', 'json');
      await preferencesManager.set('search.maxResults', 50);
      
      // Reset only display category
      await preferencesManager.reset('display');
      
      expect(preferencesManager.get('display.defaultFormat')).toBe('table');
      expect(preferencesManager.get('search.maxResults')).toBe(50); // unchanged
    });
  });

  describe('convenience methods', () => {
    it('should get and set default format', async () => {
      expect(preferencesManager.getDefaultFormat()).toBe('table');
      
      await preferencesManager.setDefaultFormat('markdown');
      expect(preferencesManager.getDefaultFormat()).toBe('markdown');
    });

    it('should get and set default project', async () => {
      expect(preferencesManager.getDefaultProject()).toBeUndefined();
      
      await preferencesManager.setDefaultProject('my-project');
      expect(preferencesManager.getDefaultProject()).toBe('my-project');
    });

    it('should check exhaustive mode', () => {
      expect(preferencesManager.isExhaustiveByDefault()).toBe(false);
    });

    it('should get max results', () => {
      expect(preferencesManager.getMaxResults()).toBe(20);
    });
  });

  describe('getAll', () => {
    it('should return all preferences', () => {
      const allPrefs = preferencesManager.getAll();
      
      expect(allPrefs).toHaveProperty('display');
      expect(allPrefs).toHaveProperty('search');
      expect(allPrefs).toHaveProperty('performance');
      expect(allPrefs.display.defaultFormat).toBe('table');
    });
  });
});