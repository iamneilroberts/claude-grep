# Decision: Prioritize Depth Over Speed

## Date: 2025-01-31
## Status: Accepted
## Context

When designing the search functionality, we had to choose between:
1. Fast, indexed searches that might miss some results
2. Thorough, complete searches that take longer

## Decision

We will prioritize depth and completeness over speed. The search engine will:
- Process every conversation file
- Parse every line, even malformed ones
- Use fuzzy matching to catch variations
- Provide exhaustive search options

## Rationale

Claude Code users need to find:
- That one conversation where they solved a tricky problem
- All instances of a particular error
- Every mention of a specific file or pattern

Missing results is worse than slow results. Users can:
- See progress indicators during long searches
- Use filters to narrow scope when speed matters
- Run searches in background while working

## Consequences

### Positive
- Users can trust search results are complete
- No need for complex indexing infrastructure
- Simpler implementation and maintenance
- Works reliably with corrupted data

### Negative
- Initial searches may take 30-60 seconds
- Cannot provide instant results
- May use more CPU during searches

## Alternatives Considered

1. **SQLite FTS Index**: Would be fast but requires maintaining index
2. **Elasticsearch**: Overkill for local tool, complex setup
3. **In-memory Index**: Would limit dataset size

## References
- User feedback requesting "find everything" capability
- Similar tools (grep, ripgrep) prioritize completeness