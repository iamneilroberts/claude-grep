import { SearchResult } from '../../core/types.js';
import { Formatter, FormatOptions } from './index.js';

export class CsvFormatter implements Formatter {
  format(results: SearchResult[], options: FormatOptions = {}): string {
    if (results.length === 0) {
      return 'Session ID,Timestamp,Project,Branch,Score,Match Count,Files,Preview';
    }

    const headers = [
      'Session ID',
      'Timestamp',
      'Project',
      'Branch',
      'Score',
      'Match Count',
      'Files',
      'Preview'
    ];

    const rows = [headers.join(',')];

    for (const result of results) {
      const row = [
        this.escapeCSV(result.sessionId),
        new Date(result.timestamp).toISOString(),
        this.escapeCSV(result.projectName),
        this.escapeCSV(result.branch || ''),
        result.score.toFixed(3),
        String(result.matchCount || 1),
        this.escapeCSV(result.files.join('; ')),
        this.escapeCSV(result.matchedContent.replace(/\n/g, ' ').substring(0, 500))
      ];
      
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private escapeCSV(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
}