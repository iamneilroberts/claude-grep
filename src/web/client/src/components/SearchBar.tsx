import React, { useState, useCallback } from 'react';
import { debounce } from '../utils/debounce.js';
import type { SearchOptions } from '../types.js';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string, options: Partial<SearchOptions>) => void;
  isSearching: boolean;
  currentProject?: string;
}

export function SearchBar({ onSearch, isSearching, currentProject }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<Partial<SearchOptions>>({
    exhaustive: false,
    includeErrors: false,
    includeToolCalls: false,
    searchAllProjects: false,
    maxResults: 20,
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchOptions: Partial<SearchOptions>) => {
      if (searchQuery.trim()) {
        onSearch(searchQuery, searchOptions);
      }
    }, 300),
    [onSearch]
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery, options);
  };

  const handleOptionChange = (key: keyof SearchOptions, value: any) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    
    // Trigger search if query exists
    if (query.trim()) {
      debouncedSearch(query, newOptions);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isSearching) {
      onSearch(query, options);
    }
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder={`Search in ${options.searchAllProjects ? 'all projects' : (currentProject || 'current project')}...`}
            value={query}
            onChange={handleQueryChange}
            autoFocus
          />
          <button
            type="button"
            className="search-options-toggle"
            onClick={() => setShowOptions(!showOptions)}
            title="Search options"
          >
            ⚙️
          </button>
          <button
            type="submit"
            className="search-submit primary"
            disabled={!query.trim() || isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {showOptions && (
        <div className="search-options">
          <div className="option-group">
            <label className="option">
              <input
                type="checkbox"
                checked={options.exhaustive || false}
                onChange={(e) => handleOptionChange('exhaustive', e.target.checked)}
              />
              <span>Exhaustive search (slower, more thorough)</span>
            </label>
            
            <label className="option">
              <input
                type="checkbox"
                checked={options.searchAllProjects || false}
                onChange={(e) => handleOptionChange('searchAllProjects', e.target.checked)}
              />
              <span>Search all projects</span>
            </label>
            
            <label className="option">
              <input
                type="checkbox"
                checked={options.includeErrors || false}
                onChange={(e) => handleOptionChange('includeErrors', e.target.checked)}
              />
              <span>Only show conversations with errors</span>
            </label>
            
            <label className="option">
              <input
                type="checkbox"
                checked={options.includeToolCalls || false}
                onChange={(e) => handleOptionChange('includeToolCalls', e.target.checked)}
              />
              <span>Only show conversations with tool calls</span>
            </label>
          </div>
          
          <div className="option-group">
            <label className="option">
              <span>Max results:</span>
              <input
                type="number"
                className="option-input"
                value={options.maxResults || 20}
                onChange={(e) => handleOptionChange('maxResults', parseInt(e.target.value, 10))}
                min="1"
                max="1000"
              />
            </label>
            
            <label className="option">
              <span>Time range:</span>
              <select
                className="option-select"
                value={options.timeRange || ''}
                onChange={(e) => handleOptionChange('timeRange', e.target.value || undefined)}
              >
                <option value="">All time</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="1y">Last year</option>
              </select>
            </label>
            
            <label className="option">
              <span>File patterns:</span>
              <input
                type="text"
                className="option-input"
                placeholder="e.g., *.ts, *.tsx"
                value={options.filePatterns || ''}
                onChange={(e) => handleOptionChange('filePatterns', e.target.value || undefined)}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}