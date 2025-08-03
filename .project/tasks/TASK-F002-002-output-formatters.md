# TASK-005: Implement Output Formatters

## Status: TODO
## Priority: MEDIUM
## Assignee: Unassigned
## Created: 2025-08-02

## Description
Create a comprehensive set of output formatters that transform search results into various formats (table, list, CSV, markdown, JSON) for different use cases and user preferences.

## Acceptance Criteria
- [ ] Implement all five output formats
- [ ] Ensure consistent data representation across formats
- [ ] Support both terminal and file output
- [ ] Handle special characters and escaping properly
- [ ] Make formatters reusable across CLI, MCP, and Web interfaces
- [ ] Support streaming for large result sets

## Implementation Checklist

### 1. Base Formatter Interface (`src/core/formatters/base.ts`)
- [ ] Define formatter interface
- [ ] Create abstract base class
- [ ] Define common formatting utilities
- [ ] Handle result pagination
- [ ] Support streaming output

### 2. Table Formatter (`src/core/formatters/table.ts`)
- [ ] Format results as ASCII table
- [ ] Auto-adjust column widths
- [ ] Truncate long content with ellipsis
- [ ] Support color highlighting (optional)
- [ ] Handle empty results gracefully

### 3. List Formatter (`src/core/formatters/list.ts`)
- [ ] Format as numbered list
- [ ] Include all relevant details
- [ ] Support indentation for readability
- [ ] Handle long content appropriately
- [ ] Add visual separators

### 4. CSV Formatter (`src/core/formatters/csv.ts`)
- [ ] Proper CSV escaping
- [ ] Include headers
- [ ] Support custom delimiters
- [ ] Handle newlines in content
- [ ] Follow RFC 4180 standard

### 5. Markdown Formatter (`src/core/formatters/markdown.ts`)
- [ ] Format as readable markdown
- [ ] Include clickable session links
- [ ] Syntax highlight code snippets
- [ ] Support GitHub-flavored markdown
- [ ] Include summary statistics

### 6. JSON Formatter (`src/core/formatters/json.ts`)
- [ ] Output valid JSON
- [ ] Support pretty printing
- [ ] Include all metadata
- [ ] Handle special characters
- [ ] Support streaming JSON arrays

## Format Examples

### Table Format
```
┌──────────────────────┬──────────────┬────────────────────────────────┬─────────────────────┐
│ Session              │ Time         │ Match Preview                  │ Files               │
├──────────────────────┼──────────────┼────────────────────────────────┼─────────────────────┤
│ 4dK92La_conversati...│ 17 hours ago │ ...dealing with TypeScript e...│ src/types.ts       │
│ 9mN31Pb_conversati...│ 2 days ago   │ ...fixed the async/await iss...│ lib/async.js       │
└──────────────────────┴──────────────┴────────────────────────────────┴─────────────────────┘
Found 2 matches in 0.3s
```

### List Format
```
Search Results for "TypeScript error" (2 matches)

1. Session 4dK92La_conversation (17 hours ago)
   Project: travel-agent
   Files: src/types.ts, src/index.ts
   Match: "...when dealing with TypeScript errors in the type system, we need to..."
   
2. Session 9mN31Pb_conversation (2 days ago)
   Project: travel-agent
   Files: lib/async.js
   Match: "...successfully fixed the async/await issue by adding proper error types..."

Search completed in 0.3s
```

### CSV Format
```csv
"Session ID","Timestamp","Project","Files","Match Preview"
"4dK92La_conversation","2025-08-01T10:30:00Z","travel-agent","src/types.ts;src/index.ts","...dealing with TypeScript errors..."
"9mN31Pb_conversation","2025-07-31T14:20:00Z","travel-agent","lib/async.js","...fixed the async/await issue..."
```

### Markdown Format
```markdown
# Search Results: "TypeScript error"

**Found 2 matches in project `travel-agent`** *(searched in 0.3s)*

## Results

### 1. Session [4dK92La_conversation](conversation://4dK92La_conversation) 
*17 hours ago*

**Files:** `src/types.ts`, `src/index.ts`

> ...when dealing with TypeScript errors in the type system, we need to ensure proper type guards...

---

### 2. Session [9mN31Pb_conversation](conversation://9mN31Pb_conversation)
*2 days ago*

**Files:** `lib/async.js`

> ...successfully fixed the async/await issue by adding proper error types to the Promise chain...

## Summary
- Total conversations searched: 45
- Matches found: 2
- Search mode: Normal
```

### JSON Format
```json
{
  "query": "TypeScript error",
  "project": "travel-agent",
  "results": [
    {
      "sessionId": "4dK92La_conversation",
      "timestamp": "2025-08-01T10:30:00Z",
      "project": "travel-agent",
      "files": ["src/types.ts", "src/index.ts"],
      "matchPreview": "...dealing with TypeScript errors...",
      "score": 0.95
    },
    {
      "sessionId": "9mN31Pb_conversation",
      "timestamp": "2025-07-31T14:20:00Z",
      "project": "travel-agent",
      "files": ["lib/async.js"],
      "matchPreview": "...fixed the async/await issue...",
      "score": 0.87
    }
  ],
  "metadata": {
    "totalSearched": 45,
    "totalMatches": 2,
    "searchTime": 0.3,
    "exhaustive": false
  }
}
```

## Common Utilities

### Content Truncation
```typescript
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength - 3) + '...';
}
```

### Time Formatting
```typescript
function formatRelativeTime(date: Date): string {
  // "17 hours ago", "2 days ago", etc.
}

function formatAbsoluteTime(date: Date): string {
  // ISO 8601 for JSON/CSV, readable for others
}
```

## Testing Requirements
- [ ] Test each formatter with various result sizes
- [ ] Test special character handling
- [ ] Test empty result formatting
- [ ] Test streaming capabilities
- [ ] Test format validity (CSV, JSON)
- [ ] Test terminal width handling

## Performance Considerations
- Stream large result sets instead of buffering
- Lazy format only visible results (pagination)
- Minimize memory allocation
- Support cancellation for long operations

## Integration
- Formatters should be pure functions
- No direct console output (return strings)
- Support both sync and async operation
- Work with all interfaces (CLI, MCP, Web)