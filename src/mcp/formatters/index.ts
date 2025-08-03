import { SearchResult } from '../../core/types.js';
import { TableFormatter } from './table.js';
import { ListFormatter } from './list.js';
import { CsvFormatter } from './csv.js';
import { MarkdownFormatter } from './markdown.js';
import { JsonFormatter } from './json.js';

export type OutputFormat = 'table' | 'list' | 'csv' | 'markdown' | 'json';

export interface FormatOptions {
  includeStats?: boolean;
  searchStats?: any;
  maxWidth?: number;
  truncateLength?: number;
}

export interface Formatter {
  format(results: SearchResult[], options?: FormatOptions): string;
}

// Formatter instances
const formatters: Record<string, Formatter> = {
  table: new TableFormatter(),
  list: new ListFormatter(),
  csv: new CsvFormatter(),
  markdown: new MarkdownFormatter(),
  json: new JsonFormatter(),
};

export function formatResults(
  results: SearchResult[],
  format: string,
  options?: FormatOptions
): string {
  const formatter = formatters[format];
  
  if (!formatter) {
    // Default to JSON for unknown formats
    return new JsonFormatter().format(results, options);
  }
  
  return formatter.format(results, options);
}

export { TableFormatter, ListFormatter, CsvFormatter, MarkdownFormatter, JsonFormatter };