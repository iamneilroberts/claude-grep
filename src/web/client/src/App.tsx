import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { SearchBar } from './components/SearchBar.js';
import { ResultsView } from './components/ResultsView.js';
import { ConversationModal } from './components/ConversationModal.js';
import { useApi } from './hooks/useApi.js';
import type { SearchResult, SearchOptions, ProjectContext, OutputFormat } from './types.js';
import './App.css';

export function App() {
  const api = useApi();
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('table');

  useEffect(() => {
    loadProjectContext();
  }, []);

  const loadProjectContext = async () => {
    try {
      const context = await api.getProjectContext();
      setProjectContext(context);
    } catch (error) {
      console.error('Failed to load project context:', error);
    }
  };

  const handleSearch = async (query: string, options: Partial<SearchOptions>) => {
    setIsSearching(true);
    setSearchResults([]);
    setSearchMetadata(null);

    try {
      const response = await api.search({
        query,
        format: outputFormat,
        ...options,
      });

      if (typeof response.results === 'string') {
        // Formatted results (non-JSON)
        setSearchResults([]);
      } else {
        setSearchResults(response.results);
      }
      setSearchMetadata(response.metadata);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed: ' + (error as Error).message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProjectSwitch = async (project: string) => {
    try {
      const context = await api.switchProject(project);
      setProjectContext(context);
      // Clear search results when switching projects
      setSearchResults([]);
      setSearchMetadata(null);
    } catch (error) {
      console.error('Failed to switch project:', error);
      alert('Failed to switch project: ' + (error as Error).message);
    }
  };

  const handleConversationSelect = (sessionId: string) => {
    setSelectedConversation(sessionId);
  };

  const handleConversationClose = () => {
    setSelectedConversation(null);
  };

  const handleFormatChange = (format: OutputFormat) => {
    setOutputFormat(format);
  };

  const handleExport = async () => {
    if (searchResults.length === 0) return;

    const blob = new Blob([JSON.stringify(searchResults, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <Header
        projectContext={projectContext}
        onProjectSwitch={handleProjectSwitch}
      />
      
      <main className="main-content">
        <div className="container">
          <SearchBar
            onSearch={handleSearch}
            isSearching={isSearching}
            currentProject={projectContext?.currentProject}
          />
          
          <ResultsView
            results={searchResults}
            metadata={searchMetadata}
            format={outputFormat}
            onFormatChange={handleFormatChange}
            onSelectConversation={handleConversationSelect}
            onExport={handleExport}
            isSearching={isSearching}
          />
        </div>
      </main>

      {selectedConversation && (
        <ConversationModal
          sessionId={selectedConversation}
          onClose={handleConversationClose}
        />
      )}
    </div>
  );
}