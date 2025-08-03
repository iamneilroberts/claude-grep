import { SearchResult } from '../../core/types.js';
import { Formatter, FormatOptions } from './index.js';

export class TableFormatter implements Formatter {
  format(results: SearchResult[], options: FormatOptions = {}): string {
    if (results.length === 0) {
      return 'No results found.';
    }

    const maxWidth = options.maxWidth || 120;
    const truncateLength = options.truncateLength || 40;

    // Column widths
    const sessionWidth = 20;
    const timeWidth = 13;
    const scoreWidth = 5;
    const filesWidth = 30;
    const previewWidth = Math.max(20, maxWidth - sessionWidth - timeWidth - scoreWidth - filesWidth - 16);

    // Header
    const headers = [
      'Session'.padEnd(sessionWidth),
      'Time'.padEnd(timeWidth),
      'Score'.padEnd(scoreWidth),
      'Files'.padEnd(filesWidth),
      'Preview'.padEnd(previewWidth),
    ];
    
    const separator = headers.map(h => '-'.repeat(h.length)).join(' | ');
    
    let output = headers.join(' | ') + '\n' + separator + '\n';

    // Rows
    for (const result of results) {
      const session = this.truncate(result.sessionId, sessionWidth);
      const time = this.formatTime(result.timestamp);
      const score = result.score.toFixed(2);
      const files = this.truncate(result.files.join(', '), filesWidth);
      const preview = this.truncate(
        result.matchedContent.replace(/\n/g, ' '),
        previewWidth
      );

      output += [
        session.padEnd(sessionWidth),
        time.padEnd(timeWidth),
        score.padEnd(scoreWidth),
        files.padEnd(filesWidth),
        preview,
      ].join(' | ') + '\n';
    }

    // Stats
    if (options.includeStats && options.searchStats) {
      output += '\n' + this.formatStats(options.searchStats);
    }

    return output;
  }

  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  private formatTime(timestamp: Date | string): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
  }

  private formatStats(stats: any): string {
    const lines = [
      `Found ${stats.totalMatchesFound} matches in ${stats.totalConversationsSearched} conversations`,
      `Search completed in ${this.formatDuration(stats.searchDuration)}`,
    ];

    if (stats.projectDistribution && Object.keys(stats.projectDistribution).length > 1) {
      lines.push(
        'Projects: ' +
        Object.entries(stats.projectDistribution)
          .map(([project, count]) => `${project} (${count})`)
          .join(', ')
      );
    }

    return lines.join('\n');
  }

  private formatDuration(ms?: number): string {
    if (!ms) return 'unknown';
    
    if (ms < 1000) {
      return `${ms}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  }
}