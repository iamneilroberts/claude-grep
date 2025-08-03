import { SearchResult } from './types.js';

export interface ResultProcessorOptions {
  maxResults?: number;
  minScore?: number;
  deduplicateBySession?: boolean;
  groupByProject?: boolean;
  highlightKeywords?: string[];
}

export interface ProcessedResults {
  results: SearchResult[];
  totalMatches: number;
  projectCounts: Record<string, number>;
  searchStats: SearchStatistics;
}

export interface SearchStatistics {
  totalConversationsSearched: number;
  totalMatchesFound: number;
  averageScore: number;
  searchDuration?: number;
  projectDistribution: Record<string, number>;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
}

export class ResultProcessor {
  /**
   * Process and enhance search results
   */
  processResults(
    results: SearchResult[],
    options: ResultProcessorOptions = {}
  ): ProcessedResults {
    let processed = [...results];

    // Filter by minimum score
    if (options.minScore !== undefined) {
      processed = processed.filter(r => r.score >= options.minScore!);
    }

    // Deduplicate by session if requested
    if (options.deduplicateBySession) {
      processed = this.deduplicateResults(processed);
    }

    // Apply result limit
    const totalMatches = processed.length;
    if (options.maxResults && processed.length > options.maxResults) {
      processed = processed.slice(0, options.maxResults);
    }

    // Calculate statistics
    const stats = this.calculateStatistics(results, processed);

    // Group by project if requested
    const projectCounts = this.countByProject(processed);

    return {
      results: processed,
      totalMatches,
      projectCounts,
      searchStats: stats,
    };
  }

  /**
   * Deduplicate results by session ID, keeping highest score
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const sessionMap = new Map<string, SearchResult>();

    for (const result of results) {
      const existing = sessionMap.get(result.sessionId);
      if (!existing || result.score > existing.score) {
        sessionMap.set(result.sessionId, result);
      }
    }

    return Array.from(sessionMap.values());
  }

  /**
   * Count results by project
   */
  private countByProject(results: SearchResult[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const result of results) {
      const project = result.projectName || 'unknown';
      counts[project] = (counts[project] || 0) + 1;
    }

    return counts;
  }

  /**
   * Calculate search statistics
   */
  private calculateStatistics(
    allResults: SearchResult[],
    matchedResults: SearchResult[]
  ): SearchStatistics {
    const scores = matchedResults.map(r => r.score);
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    const dates = matchedResults.map(r => r.timestamp);
    const dateRange = {
      earliest: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(),
      latest: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date(),
    };

    const projectDistribution = this.countByProject(matchedResults);

    return {
      totalConversationsSearched: allResults.length,
      totalMatchesFound: matchedResults.length,
      averageScore,
      projectDistribution,
      dateRange,
    };
  }

  /**
   * Rank results using additional context
   */
  rankResults(results: SearchResult[], context?: RankingContext): SearchResult[] {
    return results.map(result => {
      let adjustedScore = result.score;

      if (context) {
        // Boost recent conversations
        if (context.preferRecent) {
          const ageInDays = (Date.now() - result.timestamp.getTime()) / (1000 * 60 * 60 * 24);
          const recencyBoost = Math.exp(-ageInDays / 7); // Stronger decay over a week
          adjustedScore *= (1 + recencyBoost * 0.2);
        }

        // Boost current project
        if (context.currentProject && result.projectName === context.currentProject) {
          adjustedScore *= 1.1;
        }

        // Boost conversations with errors if searching for fixes
        if (context.searchingForErrors && result.metadata?.hasErrors) {
          adjustedScore *= 1.15;
        }

        // Boost by file relevance
        if (context.recentFiles && result.files.length > 0) {
          const fileBoost = result.files.filter(f => 
            context.recentFiles!.includes(f)
          ).length / result.files.length;
          adjustedScore *= (1 + fileBoost * 0.1);
        }
      }

      return {
        ...result,
        score: Math.min(1, adjustedScore), // Cap at 1.0
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Highlight keywords in matched content
   */
  highlightMatches(
    results: SearchResult[],
    keywords: string[]
  ): SearchResult[] {
    return results.map(result => ({
      ...result,
      matchedContent: this.highlightText(result.matchedContent, keywords),
    }));
  }

  /**
   * Highlight keywords in text
   */
  private highlightText(text: string, keywords: string[]): string {
    if (keywords.length === 0) return text;

    let highlighted = text;
    for (const keyword of keywords) {
      const regex = new RegExp(`(${this.escapeRegex(keyword)})`, 'gi');
      highlighted = highlighted.replace(regex, '**$1**');
    }

    return highlighted;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Group results by time period
   */
  groupByTimePeriod(results: SearchResult[]): Record<string, SearchResult[]> {
    const groups: Record<string, SearchResult[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    for (const result of results) {
      const resultDate = new Date(result.timestamp);
      
      if (resultDate >= today) {
        groups.today.push(result);
      } else if (resultDate >= yesterday) {
        groups.yesterday.push(result);
      } else if (resultDate >= weekAgo) {
        groups.thisWeek.push(result);
      } else if (resultDate >= monthAgo) {
        groups.thisMonth.push(result);
      } else {
        groups.older.push(result);
      }
    }

    return groups;
  }
}

export interface RankingContext {
  currentProject?: string;
  preferRecent?: boolean;
  searchingForErrors?: boolean;
  recentFiles?: string[];
  currentBranch?: string;
}

/**
 * Convenience function for processing results
 */
export function processSearchResults(
  results: SearchResult[],
  options?: ResultProcessorOptions
): ProcessedResults {
  const processor = new ResultProcessor();
  return processor.processResults(results, options);
}