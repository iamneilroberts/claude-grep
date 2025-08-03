# Contributing to Claude Grep

Thank you for your interest in contributing to Claude Grep! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in the [issue tracker](https://github.com/iamneilroberts/claude-grep/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (if applicable)
   - Expected vs actual behavior
   - Your environment (OS, Node.js version, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes with a clear message
7. Push to your fork
8. Open a pull request with a detailed description

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/claude-grep.git
cd claude-grep

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build the project
npm run build
```

### Code Style

- We use TypeScript with strict mode enabled
- Follow the existing code style
- Run `npm run lint` before committing
- Add JSDoc comments for public APIs

### Testing

- Write unit tests for new functionality
- Ensure existing tests still pass
- Aim for good test coverage
- Test edge cases and error conditions

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb in present tense
- Keep the first line under 72 characters
- Reference issues when applicable (e.g., "Fix #123")

### Areas for Contribution

- **Bug fixes**: Help fix reported issues
- **Features**: Implement new search capabilities or output formats
- **Documentation**: Improve README, add examples, fix typos
- **Tests**: Increase test coverage
- **Performance**: Optimize search algorithms
- **Accessibility**: Improve web UI accessibility

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming environment for all contributors.

## Questions?

Feel free to open an issue for any questions about contributing.

## License

By contributing to Claude Grep, you agree that your contributions will be licensed under the MIT License.