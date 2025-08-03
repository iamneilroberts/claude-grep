# Technical Stack

## Core Technologies

### Backend
- **Node.js 18+**: Modern JavaScript runtime
- **TypeScript 5.3**: Type safety and better DX
- **Commander.js**: CLI argument parsing
- **@modelcontextprotocol/sdk**: MCP integration

### Web UI
- **Express.js**: Lightweight web server
- **React 18**: UI components
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling

### Testing
- **Jest**: Unit and integration tests
- **Playwright**: E2E testing for web UI

### Development
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Conventional Commits**: Standardized commits

## Decision Rationale

### Why TypeScript?
- Type safety for complex search algorithms
- Better IDE support for developers
- Self-documenting code
- Catch errors at compile time

### Why React for Web UI?
- Familiar to most developers
- Rich ecosystem
- Good performance for data-heavy UIs
- Component reusability

### Why Express over Fastify?
- Simpler for MCP proxy implementation
- More middleware available
- Adequate performance for local use
- Better documentation

### Why Node.js?
- Same language for all components
- Rich ecosystem for file processing
- Good streaming support for large files
- Easy deployment and distribution

## Build Tools

### TypeScript Configuration
- Strict mode enabled
- ES2022 target for modern features
- Path mapping for clean imports
- Source maps for debugging

### Bundling Strategy
- No bundling for server code (direct TypeScript compilation)
- Vite for web UI bundling
- Tree shaking for optimal bundle size
- Separate chunks for better caching