# NEXIUMS - AI-Powered Artifacts & Code Execution Platform

A comprehensive platform for creating, executing, and sharing code artifacts with AI assistance.

## Features

- **Multi-Language Support**: Execute JavaScript, TypeScript, Python, HTML, React, Vue, Svelte, and more
- **Secure Execution**: Docker-based sandboxed environment with resource limits
- **Live Preview**: Real-time preview for web-based artifacts
- **Version Control**: Complete version history with diff viewing and rollback
- **Collaboration**: Real-time collaborative editing
- **AI Integration**: AI-powered code generation and assistance
- **Template Library**: Pre-built templates for common use cases
- **Sharing & Embedding**: Share artifacts via links or embed them

## Architecture

```
NEXIUMS/
├── frontend/      # Next.js 14 + React + TypeScript
├── backend/       # Express + Prisma + PostgreSQL
├── executor/      # Code execution service
├── shared/        # Shared types and utilities
└── docker/        # Docker configurations
```

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Monaco Editor
- Shadcn UI

### Backend
- Node.js 20
- Express
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication

### Executor
- Docker
- VM2 (JavaScript sandboxing)
- Python subprocess
- Resource limiting

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SrivantSV/NEXIUMS.git
cd NEXIUMS
```

2. Install dependencies:
```bash
# Install all dependencies
npm run install:all

# Or install individually
cd frontend && npm install
cd ../backend && npm install
cd ../executor && npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the database:
```bash
docker-compose up -d postgres redis
```

5. Run migrations:
```bash
cd backend
npx prisma migrate dev
```

6. Start the development servers:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Executor
cd executor && npm run dev
```

### Using Docker Compose

```bash
docker-compose up
```

Access the application at http://localhost:3000

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Artifacts
- `POST /api/artifacts` - Create artifact
- `GET /api/artifacts` - List artifacts
- `GET /api/artifacts/:id` - Get artifact
- `PUT /api/artifacts/:id` - Update artifact
- `DELETE /api/artifacts/:id` - Delete artifact
- `POST /api/artifacts/:id/execute` - Execute artifact
- `GET /api/artifacts/:id/versions` - Get version history
- `POST /api/artifacts/:id/share` - Create share link

## Supported Artifact Types

### Code Artifacts
- React Component
- Vue Component
- Svelte Component
- Angular Component
- HTML Page
- JavaScript/TypeScript
- Python Script
- Node.js Script
- Shell Script
- SQL Query

### Document Artifacts
- Markdown Document
- LaTeX Document
- JSON Schema
- API Specification

### Data Artifacts
- Data Table
- Chart/Visualization
- Dashboard
- CSV Data

### Design Artifacts
- SVG Graphics
- Mermaid Diagrams
- Flowcharts
- Wireframes

## Security

- Docker-based sandboxing
- Resource limits (CPU, memory, time)
- Network isolation
- Read-only file systems
- Module whitelisting
- Input validation
- JWT authentication
- CORS protection

## Development

### Project Structure

```
frontend/src/
├── app/              # Next.js pages
├── components/       # React components
│   ├── artifacts/   # Artifact UI
│   ├── editor/      # Code editor
│   └── ui/          # Reusable UI
├── lib/             # Utilities
├── hooks/           # Custom hooks
└── types/           # TypeScript types

backend/src/
├── controllers/     # Request handlers
├── models/          # Prisma models
├── routes/          # API routes
├── services/        # Business logic
├── middleware/      # Express middleware
└── types/           # TypeScript types

executor/src/
├── sandbox/         # Sandboxing logic
├── runners/         # Language runners
├── queue/           # Job queue
└── docker/          # Docker management
```

### Testing

```bash
# Run all tests
npm test

# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test

# Run executor tests
cd executor && npm test
```

### Building for Production

```bash
# Build all services
npm run build:all

# Or build individually
cd frontend && npm run build
cd backend && npm run build
cd executor && npm run build
```

## Deployment

### Using Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

See `.env.example` for all required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
