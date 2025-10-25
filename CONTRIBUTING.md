# Contributing to Redis Explorer

Thank you for your interest in contributing to Redis Explorer! We welcome contributions from the community and are pleased to have you join us.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, browser, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the behavior you expected**
- **Explain why this enhancement would be useful**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `yarn install`
3. **Make your changes** following our coding standards
4. **Add tests** if applicable
5. **Run the test suite**: `yarn test`
6. **Run linting**: `yarn lint`
7. **Run type checking**: `yarn type-check`
8. **Ensure the build passes**: `yarn build`
9. **Update documentation** if needed
10. **Submit your pull request**

## Development Setup

1. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/redis-explorer.git
   cd redis-explorer
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Start development server**:
   ```bash
   yarn dev
   ```

4. **Set up Redis for testing**:
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:latest
   
   # Or install locally
   # macOS: brew install redis
   # Ubuntu: sudo apt-get install redis-server
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use strict mode settings

### Code Style

- Use Prettier for code formatting: `yarn format`
- Follow ESLint rules: `yarn lint`
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use proper prop types
- Implement error boundaries where appropriate

### Redux

- Use Redux Toolkit for state management
- Create typed slices and selectors
- Use async thunks for API calls
- Keep state normalized

### File Organization

```
src/
├── components/         # Reusable UI components
├── pages/             # Next.js pages (if using pages router)
├── app/               # Next.js app router
├── services/          # Business logic and API calls
├── store/             # Redux store and slices
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── hooks/             # Custom React hooks
└── theme/             # MUI theme configuration
```

### Naming Conventions

- **Files**: Use PascalCase for components, camelCase for utilities
- **Components**: Use PascalCase
- **Functions**: Use camelCase
- **Constants**: Use UPPER_SNAKE_CASE
- **Types/Interfaces**: Use PascalCase with descriptive names

## Testing

- Write unit tests for utility functions
- Write integration tests for components
- Write E2E tests for critical user flows
- Maintain test coverage above 80%

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments for public APIs
- Update type definitions
- Include examples in documentation

## Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(dashboard): add real-time metrics chart
fix(connection): handle connection timeout errors
docs(readme): update installation instructions
```

## Release Process

We use **Semantic Release** for automated versioning and releases:

1. **Make your changes** following conventional commit format
2. **Create a pull request** to `main` branch
3. **After merge**, GitHub Actions will automatically:
   - Analyze commits to determine version bump
   - Generate CHANGELOG.md
   - Create GitHub release with notes
   - Build and push Docker image to Docker Hub
   - Tag the release with semantic version

**No manual version updates needed!** The CI/CD pipeline handles everything based on commit messages.

## Getting Help

- Check existing issues and discussions
- Join our community Discord (if available)
- Ask questions in GitHub Discussions
- Contact maintainers directly for security issues

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to Redis Explorer! 🚀
