#!/usr/bin/env node

import { ConversationScanner } from './dist/core/scanner.js';
import { SearchEngine } from './dist/core/search.js';
import { ResultProcessor } from './dist/core/results.js';
import { formatResults } from './dist/mcp/formatters/index.js';

async function testMCP() {
  console.log('Testing Claude Grep with real data...\n');

  // Test 1: List projects
  console.log('=== Test 1: List Projects ===');
  const scanner = new ConversationScanner();
  const projects = await scanner.listProjects();
  console.log(`Found ${projects.length} projects:`);
  projects.forEach(p => console.log(`  - ${p}`));

  // Test 2: Search conversations
  console.log('\n=== Test 2: Search Conversations ===');
  const searchEngine = new SearchEngine();
  const resultProcessor = new ResultProcessor();
  
  console.log('Searching for "test" in claude-grep project...');
  const searchResults = [];
  
  for await (const result of searchEngine.search({
    query: 'test',
    projectContext: '-home-neil-dev-claude-grep',
    limit: 5,
  })) {
    searchResults.push(result);
  }

  const processed = resultProcessor.processResults(searchResults, {
    maxResults: 5,
    highlightKeywords: ['test'],
  });

  console.log(`Found ${processed.results.length} results`);
  
  if (processed.results.length > 0) {
    console.log('\nFormatted as list:');
    const formatted = formatResults(processed.results, 'list', {
      includeStats: true,
      searchStats: processed.searchStats,
    });
    console.log(formatted);
  }

  // Test 3: Search for files
  console.log('\n=== Test 3: Search for TypeScript Files ===');
  const fileResults = [];
  
  for await (const result of searchEngine.search({
    query: '',
    projectContext: '-home-neil-dev-claude-grep',
    filePatterns: ['*.ts'],
    limit: 3,
  })) {
    fileResults.push(result);
  }

  console.log(`Found ${fileResults.length} conversations mentioning .ts files`);
  if (fileResults.length > 0) {
    const firstResult = fileResults[0];
    console.log(`  Session: ${firstResult.sessionId}`);
    console.log(`  Project: ${firstResult.projectName}`);
    console.log(`  Date: ${firstResult.lastModified}`);
  }
}

testMCP().catch(console.error);