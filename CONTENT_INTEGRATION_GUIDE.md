# Content Integration System - Implementation Guide

## Overview

This guide documents the complete content integration system for Nexus AI, which unifies:
- **Artifacts System**: Code execution and artifact management
- **File Handling**: Multimodal file processing
- **MCP Integration**: External tool connections (GitHub, Slack, etc.)
- **AI Chat**: Content-aware conversations

## Architecture

```
┌─────────────┐
│   User      │
│   Input     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│      Content Pipeline                    │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Files   │→ │    AI    │→ │Artifact││
│  └──────────┘  └──────────┘  └────────┘│
│        ↓            ↓            ↓      │
│     ┌────────────────────────────┐     │
│     │    MCP Operations          │     │
│     │  (GitHub, Slack, etc.)     │     │
│     └────────────────────────────┘     │
└─────────────────────────────────────────┘
```

## Database Schema

### Core Tables

1. **artifacts** - User-created code artifacts
2. **artifact_versions** - Version history
3. **executions** - Code execution records
4. **files** - Uploaded file metadata
5. **file_processing_results** - Processing outputs
6. **file_embeddings** - Semantic search vectors
7. **mcp_servers** - MCP server configurations
8. **mcp_connections** - User's MCP connections
9. **mcp_executions** - MCP execution history
10. **conversations** - Chat conversations
11. **chat_messages** - Chat messages
12. **conversation_artifacts** - Links artifacts to chats
13. **conversation_files** - Links files to chats
14. **conversation_mcp** - Links MCP to chats

See `/supabase/migrations/20240111_create_content_tables.sql` for complete schema.

## Type Definitions

All types are defined in `/src/types/content.ts`:

### Key Types

```typescript
// Artifacts
export interface Artifact {
  id: string;
  userId: string;
  title: string;
  type: ArtifactType;
  language: Language;
  content: string;
  version: number;
  // ...
}

// Files
export interface File {
  id: string;
  userId: string;
  fileName: string;
  category: FileCategory;
  storageUrl: string;
  status: FileStatus;
  // ...
}

// MCP
export interface MCPConnection {
  id: string;
  userId: string;
  serverId: string;
  status: 'connected' | 'disconnected' | 'error';
  // ...
}

// Chat
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: MessageContent[];
  // ...
}
```

## API Endpoints

### Artifacts

```
GET    /api/artifacts              # List artifacts
POST   /api/artifacts              # Create artifact
GET    /api/artifacts/:id          # Get artifact
PUT    /api/artifacts/:id          # Update artifact
DELETE /api/artifacts/:id          # Delete artifact
POST   /api/artifacts/:id/execute  # Execute artifact
GET    /api/artifacts/:id/versions # Get versions
```

### Files

```
GET    /api/files                  # List files
POST   /api/files                  # Upload file
GET    /api/files/:id              # Get file
DELETE /api/files/:id              # Delete file
GET    /api/files/search           # Search files
```

### MCP

```
GET    /api/mcp/servers            # List MCP servers
GET    /api/mcp/connections        # List user connections
POST   /api/mcp/connections        # Create connection
DELETE /api/mcp/connections/:id   # Delete connection
POST   /api/mcp/execute            # Execute MCP action
```

### Conversations

```
GET    /api/conversations          # List conversations
POST   /api/conversations          # Create conversation
GET    /api/conversations/:id      # Get conversation
POST   /api/conversations/:id/messages  # Send message
```

### Search

```
GET    /api/search                 # Unified content search
```

## Library Functions

### Artifacts (`/src/lib/content/artifacts.ts`)

```typescript
import { createArtifact, getArtifact, executeArtifact } from '@/lib/content/artifacts';

// Create
const artifact = await createArtifact({
  userId: user.id,
  title: 'My Script',
  type: 'python-script',
  language: 'python',
  content: 'print("Hello")',
});

// Execute
const execution = await executeArtifact(artifact.id, user.id);
```

### Files (`/src/lib/content/files.ts`)

```typescript
import { createFile, searchFiles } from '@/lib/content/files';

// Create file record
const file = await createFile({
  userId: user.id,
  fileName: 'document.pdf',
  fileType: 'application/pdf',
  fileSize: 1024000,
  category: 'document',
  extension: 'pdf',
  storageUrl: 's3://...',
  checksum: 'sha256...',
});

// Search
const results = await searchFiles({
  userId: user.id,
  query: 'invoice',
  filters: { category: 'document' },
});
```

### MCP (`/src/lib/content/mcp.ts`)

```typescript
import { getMCPServers, executeMCPAction } from '@/lib/content/mcp';

// Get available servers
const servers = await getMCPServers('development');

// Execute action
const result = await executeMCPAction({
  serverId: 'github',
  action: 'search-code',
  parameters: { query: 'function login' },
  userId: user.id,
});
```

### Unified Pipeline (`/src/lib/content/pipeline.ts`)

```typescript
import { processContent } from '@/lib/content/pipeline';

// Process uploaded file → generate artifact → trigger MCP
const result = await processContent({
  type: 'file',
  source: uploadedFile,
  userId: user.id,
  conversationId: conv.id,
  options: {
    generateArtifact: true,
    enableOCR: true,
    triggerMCP: ['github', 'slack'],
  },
});

// Result contains:
// - file: processed file record
// - artifact: generated artifact (if enabled)
// - mcpResults: MCP execution results
```

## React Hooks

### useArtifacts

```typescript
'use client';

import { useArtifacts, useCreateArtifact, useExecuteArtifact } from '@/hooks/useArtifacts';

function MyComponent() {
  const { artifacts, loading } = useArtifacts({ type: 'python-script' });
  const { createArtifact } = useCreateArtifact();
  const { executeArtifact, executing, execution } = useExecuteArtifact(artifactId);

  const handleCreate = async () => {
    const artifact = await createArtifact({
      title: 'New Script',
      type: 'python-script',
      language: 'python',
      content: 'print("Hello")',
    });
  };

  const handleExecute = async () => {
    const exec = await executeArtifact();
    // exec.status === 'queued'
  };

  return (
    <div>
      {artifacts.map(a => <div key={a.id}>{a.title}</div>)}
    </div>
  );
}
```

### useExecutionStatus

```typescript
import { useExecutionStatus } from '@/hooks/useArtifacts';

function ExecutionMonitor({ executionId }: { executionId: string }) {
  const { execution, loading } = useExecutionStatus(executionId, 2000); // poll every 2s

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div>Status: {execution?.status}</div>
      {execution?.status === 'completed' && (
        <pre>{execution.output}</pre>
      )}
    </div>
  );
}
```

## Integration Workflows

### 1. File Upload → Artifact Generation

```typescript
// Upload file
const fileResponse = await fetch('/api/files', {
  method: 'POST',
  body: formData,
});
const { data: file } = await fileResponse.json();

// Process generates artifact automatically if it's code
const processingResult = await fetch(`/api/files/${file.id}/process`, {
  method: 'POST',
  body: JSON.stringify({
    generateArtifact: true,
    conversationId: currentConversation.id,
  }),
});

// File is linked to conversation
// Artifact is created and linked to conversation
// Both appear in chat context
```

### 2. Chat Message → Artifact Creation

```typescript
// AI generates code in response
const aiResponse = await generateAIResponse(userMessage);

// Detect code in response
if (containsCode(aiResponse)) {
  const artifact = await createArtifact({
    userId: user.id,
    title: extractTitle(aiResponse),
    type: inferArtifactType(aiResponse),
    language: getLanguage(aiResponse),
    content: extractCode(aiResponse),
  });

  // Link to conversation
  await linkArtifactToConversation(artifact.id, conversationId);

  // Return artifact ID in message
  return {
    role: 'assistant',
    content: [
      { type: 'text', text: 'I created a script for you:' },
      { type: 'artifact', artifactId: artifact.id },
    ],
  };
}
```

### 3. MCP Trigger from Chat

```typescript
// Detect intent in user message
const intent = classifyIntent(userMessage, availableServers);

if (intent.confidence > 0.7) {
  // Execute MCP action
  const result = await executeMCPAction({
    serverId: intent.serverId,
    action: intent.action,
    parameters: extractParameters(userMessage),
    userId: user.id,
  });

  // Return result in chat
  return {
    role: 'assistant',
    content: [
      { type: 'text', text: `Executed ${intent.action}` },
      { type: 'mcp-result', mcpResult: result },
    ],
  };
}
```

### 4. Complete Content Pipeline

```typescript
async function handleUserMessage(message: string, files?: File[]) {
  const conversation = await getOrCreateConversation(user.id);

  // Process files if attached
  for (const file of files || []) {
    const result = await processContent({
      type: 'file',
      source: file,
      userId: user.id,
      conversationId: conversation.id,
      options: {
        generateArtifact: true,
        enableOCR: true,
        enableTranscription: true,
        generateEmbeddings: true,
      },
    });

    // Link file to conversation
    await linkFileToConversation(result.file!.id, conversation.id);

    // Artifact auto-linked if generated
  }

  // Generate AI response with full context
  const aiResponse = await generateAIResponse({
    message,
    context: {
      files: await getConversationFiles(conversation.id),
      artifacts: await getConversationArtifacts(conversation.id),
      mcpConnections: await getConversationMCPConnections(conversation.id),
    },
  });

  // Handle MCP triggers
  const mcpIntents = classifyIntent(message, await getMCPServers());
  const mcpResults = [];

  for (const intent of mcpIntents) {
    if (intent.confidence > 0.7) {
      const result = await executeMCPAction({
        serverId: intent.serverId,
        action: intent.action,
        parameters: extractParameters(message),
        userId: user.id,
      });
      mcpResults.push(result);
    }
  }

  // Create response message
  await createChatMessage({
    conversationId: conversation.id,
    userId: user.id,
    role: 'assistant',
    content: [
      { type: 'text', text: aiResponse.text },
      ...aiResponse.artifacts.map(a => ({ type: 'artifact', artifactId: a.id })),
      ...mcpResults.map(r => ({ type: 'mcp-result', mcpResult: r })),
    ],
  });
}
```

## Content-Aware Smart Routing

```typescript
import { selectAIModel } from '@/lib/content/pipeline';

const model = selectAIModel({
  content: message,
  hasCode: artifacts.length > 0,
  hasFiles: files.length > 0,
  hasMCP: mcpConnections.length > 0,
});

// Use selected model for optimal results
const response = await generateAIResponse({
  model,
  messages,
  context,
});
```

## Search Integration

```typescript
// Unified search across artifacts, files, and MCP data
const results = await fetch('/api/search', {
  method: 'GET',
  params: {
    q: 'user authentication',
    types: ['artifact', 'file', 'mcp-connection'],
    limit: 20,
  },
});

// Results are ranked and merged:
// - Artifacts with matching code
// - Files with matching content
// - MCP connections used for similar tasks
```

## Security & Permissions

### Row-Level Security (RLS)

All tables have RLS policies ensuring users can only access their own data:

```sql
-- Example: Artifacts policy
CREATE POLICY "Users can view own artifacts" ON artifacts
  FOR SELECT USING (user_id = auth.uid());
```

### API Authentication

All API routes check authentication:

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
    { status: 401 }
  );
}
```

### MCP Credentials

MCP credentials are encrypted before storage:

```typescript
// Store encrypted credentials
const encryptedCredentials = encryptCredentials(credentials);
await createMCPConnection({
  userId: user.id,
  serverId: 'github',
  credentials: encryptedCredentials,
});
```

## Environment Variables

Required environment variables:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# File Storage (AWS S3)
AWS_S3_BUCKET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# AI Models
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# MCP Servers (as needed)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
```

## Database Migration

Run the migration:

```bash
# Using Supabase CLI
npx supabase db push

# Or run directly in Supabase Dashboard SQL Editor
# Copy contents of: supabase/migrations/20240111_create_content_tables.sql
```

## Testing

### Create Test Artifact

```bash
curl -X POST http://localhost:3000/api/artifacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Script",
    "type": "python-script",
    "language": "python",
    "content": "print(\"Hello, World!\")"
  }'
```

### Execute Artifact

```bash
curl -X POST http://localhost:3000/api/artifacts/ARTIFACT_ID/execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Upload File

```bash
curl -X POST http://localhost:3000/api/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf"
```

## Next Steps

1. **Implement background processing**: Use queues (Bull/Redis) for file processing and code execution
2. **Add code executor service**: Implement sandboxed code execution (Docker containers)
3. **Enhance AI integration**: Connect to actual AI models for content understanding
4. **Add more MCP servers**: Implement additional tool integrations
5. **Build UI components**: Create React components for artifact editor, file viewer, etc.
6. **Implement WebSocket**: Add real-time updates for execution status
7. **Add analytics**: Track usage, performance, and costs

## Support

For questions or issues:
- Check type definitions in `/src/types/content.ts`
- Review library functions in `/src/lib/content/`
- See example hooks in `/src/hooks/useArtifacts.ts`
- Refer to database schema in `/supabase/migrations/`

---

**Built for Nexus AI Content Integration**
Version: 1.0.0
Date: 2024-01-11
