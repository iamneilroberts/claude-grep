import { SearchResult } from '../../core/types.js';
import { Formatter, FormatOptions } from './index.js';

export class ListFormatter implements Formatter {
  format(results: SearchResult[], options: FormatOptions = {}): string {
    if (results.length === 0) {
      return 'No results found.';
    }

    let output = `Search Results (${results.length} matches)\n\n`;

    results.forEach((result, index) => {
      output += `${index + 1}. Session ${result.sessionId} (${this.formatTime(result.timestamp)})\n`;
      output += `   Project: ${result.projectName}\n`;
      
      if (result.branch) {
        output += `   Branch: ${result.branch}\n`;
      }
      
      if (result.files && result.files.length > 0) {
        output += `   Files: ${result.files.join(', ')}\n`;
      }
      
      output += `   Score: ${result.score.toFixed(2)}\n`;
      output += `   Matches: ${result.matchCount || 1}\n`;
      
      const preview = result.matchedContent.replace(/\n/g, ' ').substring(0, 200);
      output += `   Preview: "${preview}${result.matchedContent.length > 200 ? '...' : ''}"\n`;
      
      output += '\n';
    });

    if (options.includeStats && options.searchStats) {
      output += this.formatStats(options.searchStats);
    }

    return output;
  }

  private formatTime(timestamp: Date | string): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  }

  private formatStats(stats: any): string {
    const lines = [
      '\n--- Statistics ---',
      `Total conversations searched: ${stats.totalConversationsSearched}`,
      `Total matches found: ${stats.totalMatchesFound}`,
      `Average score: ${stats.averageScore.toFixed(3)}`,
    ];

    if (stats.searchDuration) {
      lines.push(`Search time: ${this.formatDuration(stats.searchDuration)}`);
    }

    if (stats.dateRange) {
      const start = new Date(stats.dateRange.earliest).toLocaleDateString();
      const end = new Date(stats.dateRange.latest).toLocaleDateString();
      lines.push(`Date range: ${start} - ${end}`);
    }

    return lines.join('\n');
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }
}