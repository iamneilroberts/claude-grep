import { SearchOptions, SearchResponse, ProjectContext, Preferences, SearchResult } from '../types.js';

const API_BASE = '/api';

export function useApi() {
  const fetchJson = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  };

  return {
    async getProjects() {
      return fetchJson(`${API_BASE}/projects`);
    },

    async getProjectContext(): Promise<ProjectContext> {
      return fetchJson(`${API_BASE}/projects/current`);
    },

    async switchProject(project: string): Promise<ProjectContext> {
      return fetchJson(`${API_BASE}/projects/switch`, {
        method: 'POST',
        body: JSON.stringify({ project }),
      });
    },

    async search(options: SearchOptions): Promise<SearchResponse> {
      return fetchJson(`${API_BASE}/search`, {
        method: 'POST',
        body: JSON.stringify(options),
      });
    },

    async getConversation(sessionId: string, format: string = 'json'): Promise<SearchResult> {
      return fetchJson(`${API_BASE}/conversation/${sessionId}?format=${format}`);
    },

    async getPreferences(): Promise<Preferences> {
      return fetchJson(`${API_BASE}/preferences`);
    },

    async updatePreferences(updates: Partial<Preferences>): Promise<Preferences> {
      return fetchJson(`${API_BASE}/preferences`, {
        method: 'POST',
        body: JSON.stringify(updates),
      });
    },

    async getFormats(): Promise<{ formats: string[]; default: string }> {
      return fetchJson(`${API_BASE}/formats`);
    },
  };
}