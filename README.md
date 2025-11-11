# Nexus AI - Projects & Memory System

A comprehensive project management system with advanced shared memory architecture for AI models. Built for the **NEXIUMS** platform.

## 🎯 Overview

This system provides:

- **Multi-layered Memory Architecture**: Shared memory across all AI models with immediate, project, user, company, semantic, and conversational layers
- **Cross-Model Memory Bridge**: Seamlessly share context between Claude, GPT, Gemini, and other AI models
- **Advanced Project Management**: 13+ project types with comprehensive tracking and analytics
- **Semantic Search**: Vector-based memory search with concept extraction and relationship mapping
- **Pattern Recognition**: AI-powered identification of usage, learning, and collaboration patterns
- **Project Templates**: Pre-configured templates for quick project initialization

## 🏗️ Architecture

### Memory Layers

1. **Immediate Context** - Current conversation messages and artifacts
2. **Project Memory** - Project-specific architecture, decisions, and insights
3. **User Memory** - Global user preferences and learning patterns
4. **Company Memory** - Shared team knowledge and collaboration insights
5. **Semantic Memory** - Vector-based concept relationships and knowledge graph
6. **Conversation Memory** - Historical insights across all conversations

### Core Components

```
src/
├── types/
│   ├── projects.ts          # 13+ project type definitions
│   └── memory.ts             # Memory system types
├── lib/
│   ├── memory/
│   │   ├── memory-manager.ts       # Main memory orchestrator
│   │   ├── vector-store.ts         # Vector similarity search
│   │   ├── semantic-processor.ts   # Concept extraction & relationships
│   │   ├── cross-model-bridge.ts   # Cross-AI model adapters
│   │   └── memory-layers.ts        # Memory layer management
│   ├── stores/
│   │   └── project-store.ts        # Zustand state management
│   └── hooks/
│       ├── use-project.ts          # Project operations hook
│       └── use-project-memory.ts   # Memory operations hook
└── components/
    └── projects/
        ├── ProjectDashboard.tsx    # Main project dashboard
        ├── ProjectMemory.tsx       # Memory visualization
        ├── ProjectAnalytics.tsx    # Analytics & insights
        ├── ProjectSettings.tsx     # Project configuration
        └── ProjectTemplates.tsx    # Template browser
```

## 🚀 Features

### Project Management

- **13 Project Types**:
  - Web Development
  - Mobile App
  - Data Science
  - Machine Learning
  - Design System
  - API Development
  - Documentation
  - Research
  - Content Creation
  - Business Analysis
  - DevOps
  - Security
  - Custom

- **Comprehensive Tracking**:
  - Goals and milestones
  - Tech stack management
  - Team collaboration
  - Budget tracking
  - Timeline visualization

### Memory System

- **Concept Extraction**: Automatically extract technical, business, and decision concepts from conversations
- **Relationship Mapping**: Build knowledge graphs of concept relationships
- **Vector Search**: Fast semantic search across all project memory
- **Pattern Identification**: Discover usage, learning, and collaboration patterns

### Cross-Model Support

Memory adapters for:
- **Claude** (Anthropic) - Structured context format
- **GPT** (OpenAI) - JSON-based conversational format
- **Gemini** (Google) - Semantic and multimodal context
- **Generic** - Fallback for any model

### Project Templates

Pre-configured templates with:
- Tech stack definitions
- Initial folder structure
- Sample goals and milestones
- Best practices

Templates include:
- Full-Stack Web App
- Data Science Project
- React Native Mobile App
- ML Model Training
- Design System
- REST API
- Documentation Site

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Database (if needed)
DATABASE_URL=postgresql://...

# AI Model APIs (optional)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📚 Usage

### Creating a Project

```typescript
import { useProjectStore } from '@/lib/stores/project-store';

const { createFromTemplate } = useProjectStore();

// Create project from template
const project = createFromTemplate(template, {
  name: 'My Web App',
  owner: 'user-id',
});
```

### Using Memory Manager

```typescript
import { sharedMemoryManager } from '@/lib/memory/memory-manager';

// Create memory context
const context = await sharedMemoryManager.createMemoryContext({
  userId: 'user-id',
  conversationId: 'conv-id',
  projectId: 'project-id',
  query: 'What architecture decisions have we made?',
});

// Update memory
await sharedMemoryManager.updateMemory(
  {
    type: 'project',
    content: architectureDecision,
    metadata: {
      userId: 'user-id',
      projectId: 'project-id',
      timestamp: new Date(),
      importance: 0.9,
    },
  },
  'user-id'
);

// Identify patterns
const patterns = await sharedMemoryManager.identifyPatterns(
  'user-id',
  'project-id',
  'month'
);
```

### Cross-Model Memory Sharing

```typescript
import { CrossModelMemoryBridge } from '@/lib/memory/cross-model-bridge';

const bridge = new CrossModelMemoryBridge();

// Share memory from Claude to GPT
const adaptedContext = await bridge.shareMemoryAcrossModels(
  'claude-3-5-sonnet',
  'gpt-4-turbo',
  memoryContext,
  'user-id'
);
```

## 🎨 UI Components

### Project Dashboard

```tsx
import { ProjectDashboard } from '@/components/projects/ProjectDashboard';

<ProjectDashboard projectId="project-id" />
```

Features:
- Overview with goals and tech stack
- Memory browser and search
- Analytics and insights
- Project settings

### Project Templates

```tsx
import { ProjectTemplates } from '@/components/projects/ProjectTemplates';

<ProjectTemplates />
```

Browse and create projects from templates.

## 🧠 Memory System Details

### Memory Context Structure

```typescript
interface MemoryContext {
  immediate: ImmediateContext;        // Current conversation
  project: ProjectMemoryContext;      // Project-specific memory
  user: UserMemoryContext;            // User preferences
  company: CompanyMemoryContext;      // Team knowledge
  semantic: SemanticMemoryContext;    // Concept relationships
  conversation: ConversationMemoryContext; // Historical insights
  relevanceScores: Record<string, number>; // Layer relevance
  combinedRelevance: number;          // Overall relevance
}
```

### Semantic Processing

1. **Concept Extraction**:
   - Technical concepts (frameworks, languages, tools)
   - Business concepts (goals, requirements, decisions)
   - Problem-solution pairs
   - Architectural decisions

2. **Relationship Identification**:
   - Dependency relationships
   - Implementation relationships
   - Related concepts
   - Problem-solution links

3. **Insight Generation**:
   - Automatically identify patterns
   - Suggest optimizations
   - Detect knowledge gaps

## 📊 Analytics

Track project performance:
- Goal completion rate
- Collaboration score
- Productivity metrics
- Memory statistics
- Popular topics
- Activity trends

## 🔐 Security & Privacy

- Private, team, or public project visibility
- Role-based permissions (owner, admin, member, viewer)
- Memory isolation per user and project
- Secure data export/import

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **UI**: React 18, Tailwind CSS, Radix UI
- **State**: Zustand
- **Type Safety**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React

## 📈 Roadmap

- [ ] Database integration (PostgreSQL + Drizzle ORM)
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] AI model API integrations
- [ ] Mobile app
- [ ] API documentation
- [ ] Testing suite

## 🤝 Contributing

This is an internal project for NEXIUMS. For questions or contributions, please contact the development team.

## 📄 License

Proprietary - NEXIUMS Platform

## 🙋 Support

For support and questions:
- **Documentation**: See `/docs` folder
- **Issues**: Report via GitHub Issues
- **Contact**: development@nexiums.ai

---

**Built with ❤️ for NEXIUMS AI Platform**

## Agent 7 Implementation

This repository represents the complete implementation of **Agent 7: Projects & Memory System** as specified in the NEXIUMS mission brief.

### Deliverables ✅

- ✅ Complete project management system with 13+ project types
- ✅ Multi-layered shared memory architecture
- ✅ Cross-model memory sharing system (Claude, GPT, Gemini)
- ✅ Semantic memory search and insights
- ✅ Project analytics and pattern recognition
- ✅ Team collaboration and permissions
- ✅ Memory export and import capabilities
- ✅ Project templates and initialization workflows
- ✅ Comprehensive UI components (Dashboard, Memory, Analytics, Settings)
- ✅ Vector-based semantic search
- ✅ Concept extraction and relationship mapping
- ✅ Cross-conversation memory consolidation

### Integration Points

Ready to integrate with:
- Chat interface for project-scoped conversations
- AI model providers for memory context sharing
- Authentication system for user/team permissions
- File system for project file organization
- MCP system for project-specific integrations
- Analytics service for project insights

### Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the system in action.
