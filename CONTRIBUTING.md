# Contributing to NEXIUMS

Thank you for your interest in contributing to NEXIUMS! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Git

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/SrivantSV/NEXIUMS.git
cd NEXIUMS
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start services with Docker**
```bash
docker-compose up -d postgres redis
```

5. **Run database migrations**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

6. **Start development servers**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Executor
cd executor && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

## Project Structure

```
NEXIUMS/
├── frontend/          # Next.js frontend application
├── backend/           # Express backend API
├── executor/          # Code execution service
├── shared/            # Shared types and utilities
└── docker/            # Docker configurations
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Urgent production fixes

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

**Example:**
```
feat(artifacts): add Python script execution support

- Implement Python runner with subprocess
- Add import validation
- Configure resource limits

Closes #123
```

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Run `npm run format` before committing
- **Linting**: Run `npm run lint` to check code quality
- **Types**: Always define proper types, avoid `any`

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for >80% code coverage

```bash
npm test
```

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, documented code
- Follow existing code patterns
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run tests
npm test

# Test locally
npm run dev
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat(scope): description"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No console.log or debugging code
- [ ] Types are properly defined

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

## Adding New Features

### Adding a New Artifact Type

1. **Update shared types** (`shared/src/types/artifacts.ts`)
```typescript
export enum ArtifactType {
  // ... existing types
  NEW_TYPE = 'new-type'
}
```

2. **Create runner** (`executor/src/runners/newtype.ts`)
```typescript
export class NewTypeRunner {
  async execute(code: string, input?: any, limits?: ResourceLimits) {
    // Implementation
  }
}
```

3. **Register runner** (`executor/src/sandbox/orchestrator.ts`)
```typescript
this.runners.set('new-type', new NewTypeRunner());
```

4. **Add frontend support** (create components as needed)

### Adding a New Language

1. **Update Language enum** (`shared/src/types/artifacts.ts`)
2. **Create language runner** (`executor/src/runners/`)
3. **Add Monaco language support** (frontend)
4. **Update documentation**

## Security

### Reporting Security Issues

**Do not open public issues for security vulnerabilities.**

Email security concerns to: security@nexiums.dev

### Security Guidelines

- Never commit secrets or API keys
- Always validate user input
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines
- Keep dependencies updated

## Documentation

### Code Documentation

- Use JSDoc comments for functions
- Document complex algorithms
- Add README files for major components
- Keep API documentation updated

### Example:

```typescript
/**
 * Executes an artifact with specified input
 *
 * @param executionId - Unique execution identifier
 * @param artifact - Artifact to execute
 * @param input - Optional execution input
 * @returns Execution result with output and status
 * @throws {ExecutionError} If execution fails
 */
async execute(executionId: string, artifact: Artifact, input?: any): Promise<ExecutionResult>
```

## Getting Help

- **Documentation**: https://docs.nexiums.dev
- **Discord**: https://discord.gg/nexiums
- **Issues**: https://github.com/SrivantSV/NEXIUMS/issues
- **Discussions**: https://github.com/SrivantSV/NEXIUMS/discussions

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior:**
- Trolling, insulting, or derogatory comments
- Public or private harassment
- Publishing others' private information
- Other unethical or unprofessional conduct

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to: conduct@nexiums.dev

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website

Thank you for contributing to NEXIUMS! 🚀
