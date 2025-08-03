import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createSearchTool(): Tool[] {
  return [{
    name: 'search_conversations',
    description: 'Search Claude conversation history. Returns matches from your conversations with context.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (keywords, phrases, or file names)'
        },
        format: {
          type: 'string',
          enum: ['table', 'list', 'csv', 'markdown', 'json'],
          description: 'Output format (default: table)'
        },
        exhaustive: {
          type: 'boolean',
          description: 'Use exhaustive search mode (slower but finds all matches)'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)'
        },
        timeRange: {
          type: 'string',
          description: 'Time range filter (e.g., "24h", "7d", "1m", "1y")'
        },
        project: {
          type: 'string',
          description: 'Search specific project (overrides current context)'
        },
        searchAllProjects: {
          type: 'boolean',
          description: 'Search across all projects instead of current one'
        },
        includeErrors: {
          type: 'boolean',
          description: 'Only show conversations that contain errors'
        },
        includeToolCalls: {
          type: 'boolean',
          description: 'Only show conversations with tool calls'
        },
        filePatterns: {
          type: 'string',
          description: 'Filter by file patterns (comma-separated, e.g., "*.ts,*.js")'
        }
      },
      required: ['query']
    }
  }];
}

export function createSearchFilesTool(): Tool[] {
  return [{
    name: 'search_for_files',
    description: 'Find conversations that mention specific files or file patterns',
    inputSchema: {
      type: 'object',
      properties: {
        filePattern: {
          type: 'string',
          description: 'File name or pattern to search for (e.g., "package.json", "*.test.ts")'
        },
        format: {
          type: 'string',
          enum: ['table', 'list', 'csv', 'markdown', 'json'],
          description: 'Output format (default: table)'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 20)'
        },
        timeRange: {
          type: 'string',
          description: 'Time range filter (e.g., "24h", "7d", "1m")'
        },
        project: {
          type: 'string',
          description: 'Search specific project'
        }
      },
      required: ['filePattern']
    }
  }];
}

export function createGetConversationTool(): Tool[] {
  return [{
    name: 'get_conversation_details',
    description: 'Get full details of a specific conversation by session ID',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session ID from search results'
        },
        format: {
          type: 'string',
          enum: ['markdown', 'json'],
          description: 'Output format (default: markdown)'
        },
        includeContext: {
          type: 'number',
          description: 'Number of messages before/after matches to include'
        },
        highlightMatches: {
          type: 'boolean',
          description: 'Highlight search terms in the output'
        }
      },
      required: ['sessionId']
    }
  }];
}

export function createProjectTools(): Tool[] {
  return [
    {
      name: 'list_projects',
      description: 'List all available Claude projects with conversation history',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_current_project',
      description: 'Get the currently detected project context',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'switch_project',
      description: 'Switch the default project for searches',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: 'Project name to switch to'
          }
        },
        required: ['project']
      }
    }
  ];
}

export function createPreferencesTools(): Tool[] {
  return [
    {
      name: 'get_preferences',
      description: 'Get current Claude Grep preferences',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'set_preferences',
      description: 'Update Claude Grep preferences',
      inputSchema: {
        type: 'object',
        properties: {
          'display.defaultFormat': {
            type: 'string',
            enum: ['table', 'list', 'csv', 'markdown', 'json'],
            description: 'Default output format'
          },
          'display.includeStats': {
            type: 'boolean',
            description: 'Include statistics in output'
          },
          'display.maxPreviewLength': {
            type: 'number',
            description: 'Maximum preview length in characters'
          },
          'search.maxResults': {
            type: 'number',
            description: 'Default maximum results'
          },
          'search.defaultDaysBack': {
            type: 'number',
            description: 'Default days to search back'
          },
          'search.exhaustive': {
            type: 'boolean',
            description: 'Use exhaustive search by default'
          },
          'search.defaultProject': {
            type: 'string',
            description: 'Default project for searches'
          }
        },
        additionalProperties: false
      }
    },
    {
      name: 'reset_preferences',
      description: 'Reset all preferences to defaults',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }
  ];
}

export function createWebTools(): Tool[] {
  return [
    {
      name: 'open_web_interface',
      description: 'Get the URL for the Claude Grep web interface (only available when MCP server is started with --with-web flag)',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }
  ];
}