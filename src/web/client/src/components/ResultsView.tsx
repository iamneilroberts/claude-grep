import React from 'react';
import type { SearchResult, OutputFormat } from '../types.js';
import './ResultsView.css';

interface ResultsViewProps {
  results: SearchResult[];
  metadata: any;
  format: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  onSelectConversation: (sessionId: string) => void;
  onExport: () => void;
  isSearching: boolean;
}

export function ResultsView({
  results,
  metadata,
  format,
  onFormatChange,
  onSelectConversation,
  onExport,
  isSearching,
}: ResultsViewProps) {
  const formats: OutputFormat[] = ['table', 'list', 'csv', 'markdown', 'json'];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderStats = () => {
    if (!metadata) return null;

    return (
      <div className="results-stats">
        <span>Found {metadata.totalMatches} matches</span>
        <span className="separator">•</span>
        <span>Searched {metadata.totalSearched} files</span>
        <span className="separator">•</span>
        <span>{metadata.searchTime}ms</span>
        <span className="separator">•</span>
        <span>Project: {metadata.project}</span>
        {metadata.exhaustive && (
          <>
            <span className="separator">•</span>
            <span className="exhaustive-badge">Exhaustive</span>
          </>
        )}
      </div>
    );
  };

  const renderTableView = () => (
    <div className="results-table-wrapper">
      <table className="results-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Project</th>
            <th>Preview</th>
            <th>Messages</th>
            <th>Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.sessionId}>
              <td className="time-cell">
                <div>{formatDate(result.timestamp)}</div>
              </td>
              <td>{result.projectName}</td>
              <td className="preview-cell">
                <div className="preview-text">{result.matchedContent || result.preview}</div>
                {(result.metadata?.hasErrors || result.hasErrors || result.hasToolCalls) && (
                  <div className="preview-badges">
                    {(result.metadata?.hasErrors || result.hasErrors) && <span className="badge error">Error</span>}
                    {result.hasToolCalls && <span className="badge tool">Tool</span>}
                  </div>
                )}
              </td>
              <td className="center">{result.metadata?.totalMessages || result.matchCount || '-'}</td>
              <td className="center">{(result.score * 100).toFixed(0)}%</td>
              <td>
                <button
                  className="view-button"
                  onClick={() => onSelectConversation(result.sessionId)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderListView = () => (
    <div className="results-list">
      {results.map((result) => (
        <div key={result.sessionId} className="result-item">
          <div className="result-header">
            <div className="result-meta">
              <span className="result-project">{result.projectName}</span>
              <span className="result-time">{formatDate(result.timestamp)}</span>
              <span className="result-score">Score: {(result.score * 100).toFixed(0)}%</span>
            </div>
            <button
              className="view-button"
              onClick={() => onSelectConversation(result.sessionId)}
            >
              View
            </button>
          </div>
          <div className="result-preview">{result.matchedContent || result.preview}</div>
          <div className="result-footer">
            <span>{result.metadata?.totalMessages || result.matchCount || 0} messages</span>
            {(result.metadata?.hasErrors || result.hasErrors) && <span className="badge error">Error</span>}
            {result.hasToolCalls && <span className="badge tool">Tool</span>}
          </div>
        </div>
      ))}
    </div>
  );

  const renderResults = () => {
    if (isSearching) {
      return <div className="results-loading">Searching...</div>;
    }

    if (!metadata) {
      return <div className="results-empty">Enter a search query to begin</div>;
    }

    if (results.length === 0) {
      return <div className="results-empty">No results found</div>;
    }

    switch (format) {
      case 'table':
        return renderTableView();
      case 'list':
        return renderListView();
      default:
        // For other formats, we'll show a preview
        return (
          <pre className="results-formatted">
            {JSON.stringify(results, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="results-view">
      <div className="results-header">
        <div className="results-header-left">
          {renderStats()}
        </div>
        <div className="results-header-right">
          <div className="format-selector">
            <label>Format:</label>
            <select
              value={format}
              onChange={(e) => onFormatChange(e.target.value as OutputFormat)}
            >
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {results.length > 0 && (
            <button className="export-button secondary" onClick={onExport}>
              Export
            </button>
          )}
        </div>
      </div>
      
      <div className="results-content">
        {renderResults()}
      </div>
    </div>
  );
}