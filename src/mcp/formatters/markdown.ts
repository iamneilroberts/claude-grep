import { SearchResult } from '../../core/types.js';
import { Formatter, FormatOptions } from './index.js';

export class MarkdownFormatter implements Formatter {
  format(results: SearchResult[], options: FormatOptions = {}): string {
    if (results.length === 0) {
      return '## No results found';
    }

    let output = `# Search Results\n\n`;
    output += `**Found ${results.length} matches**\n\n`;

    // Group results by project if multiple projects
    const projects = new Set(results.map(r => r.projectName));
    
    if (projects.size > 1) {
      // Group by project
      const grouped = this.groupByProject(results);
      
      for (const [project, projectResults] of Object.entries(grouped)) {
        output += `## Project: ${project}\n\n`;
        output += this.formatResults(projectResults);
        output += '\n';
      }
    } else {
      // Single project or no grouping needed
      output += this.formatResults(results);
    }

    if (options.includeStats && options.searchStats) {
      output += '\n' + this.formatStats(options.searchStats);
    }

    return output;
  }

  private formatResults(results: SearchResult[]): string {
    let output = '';

    results.forEach((result, index) => {
      output += `### ${index + 1}. Session \`${result.sessionId}\`\n\n`;
      
      output += `- **Time:** ${this.formatTime(result.timestamp)}\n`;
      output += `- **Score:** ${result.score.toFixed(3)}\n`;
      
      if (result.branch) {
        output += `- **Branch:** ${result.branch}\n`;
      }
      
      if (result.files && result.files.length > 0) {
        output += `- **Files:** ${result.files.map(f => `\`${f}\``).join(', ')}\n`;
      }
      
      output += `- **Matches:** ${result.matchCount || 1}\n\n`;
      
      // Preview with blockquote
      const preview = result.matchedContent
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');
      
      output += `**Preview:**\n${preview}\n\n`;
      
      // Add divider between results
      if (index < results.length - 1) {
        output += '---\n\n';
      }
    });

    return output;
  }

  private groupByProject(results: SearchResult[]): Record<string, SearchResult[]> {
    const grouped: Record<string, SearchResult[]> = {};
    
    for (const result of results) {
      const project = result.projectName || 'unknown';
      if (!grouped[project]) {
        grouped[project] = [];
      }
      grouped[project].push(result);
    }
    
    return grouped;
  }

  private formatTime(timestamp: Date | string): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  }

  private formatStats(stats: any): string {
    let output = '## Search Statistics\n\n';
    
    output += '| Metric | Value |\n';
    output += '|--------|-------|\n';
    output += `| Conversations Searched | ${stats.totalConversationsSearched} |\n`;
    output += `| Total Matches | ${stats.totalMatchesFound} |\n`;
    output += `| Average Score | ${stats.averageScore.toFixed(3)} |\n`;
    
    if (stats.searchDuration) {
      output += `| Search Time | ${this.formatDuration(stats.searchDuration)} |\n`;
    }
    
    if (stats.projectDistribution && Object.keys(stats.projectDistribution).length > 0) {
      output += '\n### Results by Project\n\n';
      for (const [project, count] of Object.entries(stats.projectDistribution)) {
        output += `- **${project}**: ${count} matches\n`;
      }
    }
    
    return output;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }
}