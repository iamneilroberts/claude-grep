import { SearchResult } from '../../core/types.js';
import { Formatter, FormatOptions } from './index.js';

export class JsonFormatter implements Formatter {
  format(results: SearchResult[], options: FormatOptions = {}): string {
    const output: any = {
      results: results.map(result => ({
        sessionId: result.sessionId,
        timestamp: result.timestamp,
        projectName: result.projectName,
        branch: result.branch,
        score: result.score,
        matchCount: result.matchCount || 1,
        files: result.files,
        matchedContent: result.matchedContent,
        metadata: result.metadata
      }))
    };

    if (options.includeStats && options.searchStats) {
      output.statistics = {
        totalConversationsSearched: options.searchStats.totalConversationsSearched,
        totalMatchesFound: options.searchStats.totalMatchesFound,
        averageScore: options.searchStats.averageScore,
        searchDuration: options.searchStats.searchDuration,
        dateRange: options.searchStats.dateRange,
        projectDistribution: options.searchStats.projectDistribution
      };
    }

    return JSON.stringify(output, null, 2);
  }
}