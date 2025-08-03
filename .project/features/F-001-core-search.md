# Feature: Core Search Functionality

## Status: Planning
## Priority: High
## Owner: TBD

## Description
Implement the core search engine that can parse Claude conversation files and search through them efficiently and thoroughly.

## Requirements

### Functional
- Parse JSONL conversation files with error recovery
- Search by keywords with fuzzy matching
- Filter by date range
- Filter by git branch
- Match file patterns
- Rank results by relevance
- Handle malformed JSON gracefully
- Support exhaustive search modes

### Non-Functional
- Handle files >100MB without memory issues
- Process entire conversation history thoroughly
- Prioritize completeness over speed
- Memory usage scales reasonably with data size
- Provide progress feedback for long operations

## User Stories

### As a developer
- I want to find all conversations about a specific topic
- I want to see when I last worked on a particular file
- I want to find how I solved similar problems in the past
- I want to export search results for documentation

### As a researcher
- I want to analyze conversation patterns over time
- I want to extract decisions and reasoning
- I want to build knowledge graphs from conversations

## Tasks
- TASK-001.1: JSONL streaming parser with error recovery
- TASK-001.2: Search algorithm implementation with fuzzy matching
- TASK-001.3: Multi-factor relevance scoring
- TASK-001.4: File pattern matching with regex support
- TASK-001.5: Performance optimization and memory management
- TASK-001.6: Progress reporting for long searches

## Technical Design

### Search Engine Interface
```typescript
interface SearchEngine {
  index(conversations: AsyncIterable<Conversation>): Promise<void>;
  search(query: SearchQuery): AsyncIterable<SearchResult>;
  rank(results: SearchResult[], context: SearchContext): SearchResult[];
}

interface SearchQuery {
  keywords: string[];
  dateRange?: { start: Date; end: Date };
  branch?: string;
  filePattern?: string;
  exhaustive?: boolean;
  fuzzyThreshold?: number;
  projectFilter?: string;  // Limit to specific project
  searchAllProjects?: boolean;  // Override project filter
}
```

### Performance Strategy
- Stream processing to handle large files
- Lazy evaluation for memory efficiency
- Optional indexing for repeated searches
- Progress callbacks for user feedback
- Graceful degradation for corrupted data

## Success Criteria
- [ ] Parse all conversation files without crashes
- [ ] Find all relevant matches (high recall)
- [ ] Rank results meaningfully
- [ ] Handle edge cases gracefully
- [ ] Provide clear progress feedback
- [ ] Memory usage remains reasonable