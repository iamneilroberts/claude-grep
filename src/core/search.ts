import { 
  SearchOptions, 
  SearchResult, 
  ParsedMessage,
  SearchProgress,
  RankingWeights,
  DEFAULT_RANKING_WEIGHTS,
  ConversationFile
} from './types.js';
import { ConversationParser } from './parser.js';
import { ConversationScanner } from './scanner.js';
import { ProgressTracker } from './progress.js';

export class SearchEngine {
  private parser: ConversationParser;
  private scanner: ConversationScanner;
  private rankingWeights: RankingWeights;
  private progressTracker?: ProgressTracker;

  constructor(
    basePath?: string,
    rankingWeights: Partial<RankingWeights> = {},
    progressTracker?: ProgressTracker
  ) {
    this.parser = new ConversationParser();
    this.scanner = new ConversationScanner(basePath);
    this.rankingWeights = { ...DEFAULT_RANKING_WEIGHTS, ...rankingWeights };
    this.progressTracker = progressTracker;
  }

  /**
   * Main search method with streaming support
   */
  async *search(options: SearchOptions): AsyncGenerator<SearchResult> {
    const keywords = this.extractKeywords(options.query);
    
    // Get conversation files to search
    const files = await this.scanner.scanConversations({
      projectFilter: options.projectContext,
      startDate: options.timeRange?.start,
      endDate: options.timeRange?.end,
      onProgress: (progress) => this.reportProgress(progress),
    });

    let filesProcessed = 0;
    const totalFiles = files.length;
    let totalMatches = 0;
    
    // Determine if we need to buffer results for sorting
    const needsSorting = options.sortBy === 'relevance' || (!options.sortBy && !options.exhaustive);
    const results: SearchResult[] = [];

    // Process each conversation file
    for (const file of files) {
      const fileStartTime = Date.now();
      
      try {
        const result = await this.searchConversation(file, keywords, options);
        
        if (result && result.score > 0) {
          totalMatches++;
          
          if (needsSorting) {
            // Buffer results for sorting
            results.push(result);
          } else {
            // Yield immediately for streaming
            yield result;
          }
          
          // Stop if we've reached the limit (unless exhaustive mode)
          if (!options.exhaustive && options.limit && totalMatches >= options.limit) {
            break;
          }
        }

        const processingTime = Date.now() - fileStartTime;
        this.progressTracker?.fileProcessed(processingTime);
      } catch (error) {
        this.progressTracker?.reportError(error as Error);
      }

      filesProcessed++;
      this.reportProgress({
        filesProcessed,
        totalFiles,
        currentFile: file.path,
        stage: 'searching',
      });
    }

    // If we buffered results, sort and yield them
    if (needsSorting) {
      // Sort by score descending by default
      results.sort((a, b) => b.score - a.score);
      
      // Apply limit if specified
      const limitedResults = options.limit ? results.slice(0, options.limit) : results;
      
      for (const result of limitedResults) {
        yield result;
      }
    }

    // Complete progress tracking
    this.progressTracker?.complete(totalMatches);
  }

  /**
   * Search within a single conversation file
   */
  private async searchConversation(
    file: ConversationFile,
    keywords: string[],
    options: SearchOptions
  ): Promise<SearchResult | null> {
    const matches: ParsedMessage[] = [];
    let messageCount = 0;
    let hasErrors = false;
    let hasToolCalls = false;
    const allFiles = new Set<string>();

    try {
      // Parse conversation with streaming
      for await (const message of this.parser.parseConversation(file.path)) {
        messageCount++;

        // Check if message matches search criteria
        if (this.messageMatches(message, keywords, options)) {
          matches.push(message);
          
          // Collect files from matched messages
          message.files.forEach(f => allFiles.add(f));
        }

        // Track errors and tool calls
        if (message.hasError) hasErrors = true;
        if (message.hasToolCall) hasToolCalls = true;

        // Add all files if we're searching for file patterns
        if (options.filePatterns) {
          message.files.forEach(f => allFiles.add(f));
        }
      }

      // Check if conversation matches file patterns
      if (options.filePatterns && !this.matchesFilePatterns(Array.from(allFiles), options.filePatterns)) {
        return null;
      }

      if (matches.length === 0) {
        return null;
      }

      // Calculate relevance score
      const score = this.calculateScore(matches, messageCount, file, keywords, options);

      // Build result
      const result: SearchResult = {
        sessionId: file.sessionId,
        timestamp: file.lastModified,
        matchedContent: this.buildPreview(matches),
        files: Array.from(allFiles),
        score,
        projectName: file.projectName || 'unknown',
        branch: matches[0]?.branch,
        matchCount: matches.length,
        metadata: {
          totalMessages: messageCount,
          hasErrors,
          gitBranch: matches[0]?.branch,
          projectPath: file.projectName,
        },
      };

      return result;
    } catch (error) {
      console.error(`Error searching conversation ${file.path}: ${error}`);
      return null;
    }
  }

  /**
   * Check if a message matches search criteria
   */
  private messageMatches(
    message: ParsedMessage,
    keywords: string[],
    options: SearchOptions
  ): boolean {
    // Check keyword matches
    if (keywords.length > 0) {
      const content = message.content.toLowerCase();
      const matchesKeywords = keywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      if (!matchesKeywords) return false;
    }

    // Check error filter
    if (options.includeErrors !== undefined) {
      if (options.includeErrors !== message.hasError) return false;
    }

    // Check tool call filter
    if (options.includeToolCalls !== undefined) {
      if (options.includeToolCalls !== message.hasToolCall) return false;
    }

    // Check role/message type filter
    if (options.messageTypes && options.messageTypes.length > 0) {
      const messageType = message.role === 'user' ? 'user' : 'assistant';
      if (!options.messageTypes.includes(messageType)) return false;
    }

    // Check time range filter
    if (options.timeRange) {
      const messageTime = message.timestamp.getTime();
      if (options.timeRange.start && messageTime < options.timeRange.start.getTime()) {
        return false;
      }
      if (options.timeRange.end && messageTime > options.timeRange.end.getTime()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if files match the specified patterns
   */
  private matchesFilePatterns(files: string[], patterns: string[]): boolean {
    if (patterns.length === 0) return true;

    return patterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
      return files.some(file => regex.test(file));
    });
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateScore(
    matches: ParsedMessage[],
    totalMessages: number,
    file: ConversationFile,
    keywords: string[],
    options: SearchOptions
  ): number {
    let score = 0;

    // Keyword match score
    if (keywords.length > 0) {
      const keywordScore = this.calculateKeywordScore(matches, keywords);
      score += this.rankingWeights.keywordMatch * keywordScore;
    }

    // Recency score
    const recencyScore = this.calculateRecencyScore(file.lastModified);
    score += this.rankingWeights.recency * recencyScore;

    // Match density score (matches per message)
    const densityScore = matches.length / totalMessages;
    score += this.rankingWeights.messageTypeMatch * densityScore;

    // Error presence bonus
    if (options.includeErrors && matches.some(m => m.hasError)) {
      score += this.rankingWeights.errorPresence;
    }

    // Tool call presence bonus
    if (options.includeToolCalls && matches.some(m => m.hasToolCall)) {
      score += this.rankingWeights.toolCallPresence;
    }

    return Math.min(1, score); // Cap at 1.0
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordScore(matches: ParsedMessage[], keywords: string[]): number {
    let totalScore = 0;
    
    for (const match of matches) {
      const content = match.content.toLowerCase();
      let messageScore = 0;
      
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        const occurrences = (content.match(new RegExp(keywordLower, 'g')) || []).length;
        messageScore += occurrences;
      }
      
      totalScore += messageScore / keywords.length;
    }
    
    return Math.min(1, totalScore / matches.length);
  }

  /**
   * Calculate recency score (decay over time)
   */
  private calculateRecencyScore(date: Date): number {
    const ageInDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    // Use exponential decay
    // Score is 1 for today, ~0.5 for 30 days ago, ~0.25 for 60 days ago
    return Math.exp(-ageInDays / 30);
  }

  /**
   * Build preview text from matched messages
   */
  private buildPreview(matches: ParsedMessage[], maxLength: number = 200): string {
    if (matches.length === 0) return '';

    // Take the most relevant match (first one for now)
    const preview = matches[0].content;
    
    if (preview.length <= maxLength) {
      return preview;
    }

    // Find the first keyword match and show context around it
    const keywords = this.extractKeywords(preview);
    if (keywords.length > 0) {
      const keywordIndex = preview.toLowerCase().indexOf(keywords[0].toLowerCase());
      if (keywordIndex >= 0) {
        const start = Math.max(0, keywordIndex - 50);
        const end = Math.min(preview.length, keywordIndex + maxLength - 50);
        return '...' + preview.substring(start, end) + '...';
      }
    }

    return preview.substring(0, maxLength) + '...';
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Simple tokenization - could be enhanced with better NLP
    return query
      .split(/\s+/)
      .filter(word => word.length > 2) // Skip short words
      .filter(word => !['the', 'and', 'or', 'but', 'for', 'with'].includes(word.toLowerCase()));
  }

  /**
   * Report progress if tracker is available
   */
  private reportProgress(progress: SearchProgress): void {
    this.progressTracker?.reportProgress(progress);
  }

  /**
   * Get a specific conversation by session ID
   */
  async getConversationById(sessionId: string): Promise<SearchResult | null> {
    const files = await this.scanner.scanConversations({});
    
    for (const file of files) {
      if (file.sessionId === sessionId) {
        const messages: ParsedMessage[] = [];
        let totalMessages = 0;
        let firstTimestamp: Date | null = null;
        let lastTimestamp: Date | null = null;
        
        // Parse the entire conversation
        for await (const message of this.parser.parseConversation(file.path)) {
          messages.push(message);
          totalMessages++;
          
          if (!firstTimestamp) {
            firstTimestamp = message.timestamp;
          }
          lastTimestamp = message.timestamp;
        }
        
        if (messages.length > 0) {
          // Build full conversation content
          const content = messages.map(msg => {
            let msgText = '';
            if (msg.role) {
              msgText += `[${msg.role.toUpperCase()}] ${msg.timestamp.toLocaleString()}\n`;
            }
            if (msg.content) {
              msgText += msg.content + '\n';
            }
            if (msg.files && msg.files.length > 0) {
              msgText += `Files: ${msg.files.join(', ')}\n`;
            }
            return msgText;
          }).join('\n---\n\n');
          
          return {
            sessionId: file.sessionId || sessionId,
            timestamp: firstTimestamp!,
            matchedContent: this.buildPreview(messages),
            files: Array.from(new Set(messages.flatMap(m => m.files || []))),
            score: 1.0,
            projectName: file.projectName || 'unknown',
            branch: messages[0]?.branch,
            matchCount: messages.length,
            metadata: {
              totalMessages,
              hasErrors: messages.some(m => m.hasError),
            },
            content, // Add full conversation content
          } as any;
        }
      }
    }
    
    return null;
  }
}

/**
 * Convenience function for searching conversations
 */
export async function searchConversations(
  options: SearchOptions,
  basePath?: string
): Promise<SearchResult[]> {
  const engine = new SearchEngine(basePath);
  const results: SearchResult[] = [];
  
  for await (const result of engine.search(options)) {
    results.push(result);
  }
  
  // Sort results by score
  results.sort((a, b) => {
    if (options.sortBy === 'date') {
      return options.sortOrder === 'asc' 
        ? a.timestamp.getTime() - b.timestamp.getTime()
        : b.timestamp.getTime() - a.timestamp.getTime();
    }
    // Default to relevance sorting
    return options.sortOrder === 'asc' ? a.score - b.score : b.score - a.score;
  });
  
  return results;
}