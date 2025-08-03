# Development Guidelines

## Philosophy
- **Depth Over Speed**: Always prioritize complete results over fast responses
- **User First**: Design for actual Claude Code users, not hypothetical use cases
- **Minimal Design**: Clean, functional interfaces without unnecessary features
- **Local Only**: All data processing happens on user's machine

## Code Standards

### TypeScript
- Use strict mode
- Prefer interfaces over types
- Document complex types
- Use descriptive variable names

### Error Handling
- Never swallow errors silently
- Provide actionable error messages
- Include context in error logs
- Gracefully handle corrupted data

### Testing
- Write tests for edge cases
- Test with real conversation data
- Include performance tests
- Test all output formats

## Architecture Principles

### Modularity
- Keep core search logic separate from interfaces
- Use dependency injection
- Avoid tight coupling between components
- Make components independently testable

### Performance
- Stream large files instead of loading into memory
- Use async iterators for result sets
- Provide progress feedback for long operations
- Cache only when necessary

### Project Context
- Always respect project boundaries
- Make project context explicit in UI
- Default to current project in Claude Code
- Allow override when appropriate

## Pull Request Standards

### Before Submitting
- Run all tests
- Update documentation
- Check for console.log statements
- Verify error handling

### PR Description Should Include
- What changed and why
- Testing performed
- Breaking changes (if any)
- Screenshots for UI changes

## Common Patterns

### File Processing
```typescript
// Good: Stream processing
async function* processFile(path: string) {
  const stream = createReadStream(path);
  for await (const line of readline(stream)) {
    yield parseLine(line);
  }
}

// Bad: Loading entire file
const content = fs.readFileSync(path, 'utf-8');
const lines = content.split('\n');
```

### Error Recovery
```typescript
// Good: Continue processing on error
try {
  const parsed = JSON.parse(line);
  yield parsed;
} catch (error) {
  console.warn(`Skipping malformed line: ${error.message}`);
  continue;
}

// Bad: Fail entire operation
const parsed = JSON.parse(line); // Throws on error
```