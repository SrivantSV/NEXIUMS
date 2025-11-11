# MCP Framework Examples

This document provides practical examples of using the Nexus AI MCP Integration Framework.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [GitHub Integration](#github-integration)
3. [Slack Integration](#slack-integration)
4. [Multi-Service Workflows](#multi-service-workflows)
5. [Custom Workflows](#custom-workflows)
6. [Error Handling](#error-handling)

## Basic Usage

### Simple Request Processing

```typescript
import { MCPOrchestrator } from '@/lib/mcp/orchestrator';

const orchestrator = new MCPOrchestrator();

// Process a natural language request
const result = await orchestrator.processUserRequest(
  "Find my repositories on GitHub",
  "user-123",
  {
    userId: "user-123",
    conversationId: "conv-456",
    history: []
  }
);

if (result.success) {
  console.log('Repositories:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## GitHub Integration

### Search Code

```typescript
const result = await orchestrator.processUserRequest(
  "Search for 'authentication' in my TypeScript files",
  userId,
  context
);
```

### Create Issue

```typescript
const result = await orchestrator.processUserRequest(
  'Create an issue titled "Fix login bug" in repo owner/project',
  userId,
  context
);
```

### Create Pull Request

```typescript
const result = await orchestrator.processUserRequest(
  'Create a PR from feature-branch to main in my-repo with title "Add new feature"',
  userId,
  context
);
```

### Direct API Usage

```typescript
import { GitHubMCPServerImpl } from '@/lib/mcp/servers/github';

const github = new GitHubMCPServerImpl(
  config,
  userId,
  { type: 'oauth', accessToken: 'ghp_...' }
);

// List repositories
const repos = await github.listRepositories({
  type: 'owner',
  sort: 'updated',
  per_page: 10
});

// Search code
const results = await github.searchCode({
  query: 'authentication',
  language: 'typescript',
  extension: 'ts'
});

// Create issue
const issue = await github.createIssue({
  repo: 'owner/project',
  title: 'Bug Report',
  body: 'Description of the bug...',
  labels: ['bug', 'high-priority']
});
```

## Slack Integration

### Send Message

```typescript
const result = await orchestrator.processUserRequest(
  'Send a message to #general saying "Deployment completed successfully"',
  userId,
  context
);
```

### Search Messages

```typescript
const result = await orchestrator.processUserRequest(
  'Search for messages containing "API" in Slack',
  userId,
  context
);
```

### Direct API Usage

```typescript
import { SlackMCPServerImpl } from '@/lib/mcp/servers/slack';

const slack = new SlackMCPServerImpl(
  config,
  userId,
  { type: 'oauth', accessToken: 'xoxb-...' }
);

// Send message
const message = await slack.sendMessage({
  channel: '#general',
  text: 'Hello from Nexus AI!',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Deployment Status*\n✅ Successfully deployed to production'
      }
    }
  ]
});

// Search messages
const results = await slack.searchMessages({
  query: 'error',
  sort: 'timestamp',
  sort_dir: 'desc',
  count: 20
});

// Upload file
const file = await slack.uploadFile({
  channels: '#general',
  file: Buffer.from('file content'),
  filename: 'report.txt',
  title: 'Daily Report'
});
```

## Multi-Service Workflows

### Deploy and Notify

This workflow deploys to Vercel and notifies the team on Slack:

```typescript
const result = await orchestrator.processUserRequest(
  'Deploy my app to production and notify #deploys channel',
  userId,
  context
);

// Result structure:
// {
//   success: true,
//   workflowId: 'wf_123',
//   results: [
//     { stepId: 'deploy', success: true, output: {...} },
//     { stepId: 'notify', success: true, output: {...} }
//   ],
//   summary: 'Workflow completed: 2/2 steps successful'
// }
```

### Create Feature Branch

This workflow creates a Linear issue, GitHub branch, and notifies the team:

```typescript
const result = await orchestrator.processUserRequest(
  'Start new feature "User Authentication" for team Engineering',
  userId,
  context
);

// Executes:
// 1. Create Linear issue
// 2. Create GitHub branch from the issue
// 3. Send Slack notification
```

### Bug Report

Report a bug across multiple services:

```typescript
const result = await orchestrator.processUserRequest(
  'Report bug: "Login fails on Safari" with high priority',
  userId,
  context
);

// Creates:
// 1. Linear issue (high priority)
// 2. GitHub issue (with bug label)
// 3. Slack notification to #bugs
```

## Custom Workflows

### Define Custom Template

```typescript
import { WorkflowEngine } from '@/lib/mcp/workflow-engine';

const engine = new WorkflowEngine();

// Add custom template
engine.addTemplate({
  id: 'code-review-flow',
  name: 'Code Review Workflow',
  intent: 'request-code-review',
  description: 'Create PR and request reviews',
  steps: [
    {
      id: 'create-pr',
      serverId: 'github',
      action: 'createPullRequest',
      parameters: {
        repo: 'my-org/my-repo',
        base: 'main'
      },
      required: true,
      timeout: 10000
    },
    {
      id: 'notify-reviewers',
      serverId: 'slack',
      action: 'sendMessage',
      parameters: {
        channel: '#code-reviews'
      },
      required: true,
      dependsOn: ['create-pr'],
      timeout: 5000
    },
    {
      id: 'update-linear',
      serverId: 'linear',
      action: 'updateIssue',
      parameters: {
        status: 'In Review'
      },
      required: false,
      dependsOn: ['create-pr'],
      timeout: 5000
    }
  ]
});

// Use the workflow
const result = await orchestrator.processUserRequest(
  'Request code review for my changes',
  userId,
  context
);
```

### Execute Workflow Programmatically

```typescript
import { MCPOrchestrator } from '@/lib/mcp/orchestrator';

const orchestrator = new MCPOrchestrator();
const connectionManager = orchestrator.getConnectionManager();

// Get user's connections
const connections = await connectionManager.getUserConnections(userId);

// Create and execute workflow
const workflow = {
  id: 'custom-workflow',
  name: 'Custom Workflow',
  intent: {
    primary: 'custom',
    confidence: 1.0,
    entities: [],
    keywords: [],
    isMultiStep: true,
    requiredServers: ['github', 'slack'],
    parameters: {}
  },
  steps: [
    {
      id: 'step1',
      serverId: 'github',
      action: 'searchCode',
      parameters: { query: 'TODO' },
      required: true
    },
    {
      id: 'step2',
      serverId: 'slack',
      action: 'sendMessage',
      parameters: {
        channel: '#dev',
        text: 'Found TODO items'
      },
      required: false,
      dependsOn: ['step1']
    }
  ],
  createdAt: new Date()
};

// Execute each step
const results = [];
let context = {};

for (const step of workflow.steps) {
  const connection = connections.find(c => c.serverId === step.serverId);
  if (!connection) continue;

  const server = await connectionManager.createServerInstance(connection);
  const result = await (server as any)[step.action](step.parameters);

  results.push({
    stepId: step.id,
    success: true,
    output: result,
    timestamp: new Date()
  });

  context = { ...context, [step.id]: result };
}
```

## Error Handling

### Handling Connection Errors

```typescript
try {
  const result = await orchestrator.processUserRequest(
    "Search GitHub repositories",
    userId,
    context
  );

  if (!result.success) {
    if (result.error?.includes('not connected')) {
      // Redirect to connections page
      window.location.href = '/integrations';
    } else {
      // Show error message
      console.error('Operation failed:', result.error);
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Handling Rate Limits

```typescript
import { MCPRateLimitError } from '@/types/mcp';

try {
  const result = await github.searchCode({ query: 'test' });
} catch (error) {
  if (error instanceof MCPRateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
    const result = await github.searchCode({ query: 'test' });
  }
}
```

### Handling Authentication Errors

```typescript
import { MCPAuthError } from '@/types/mcp';

try {
  const result = await slack.sendMessage({ channel: '#general', text: 'Hi' });
} catch (error) {
  if (error instanceof MCPAuthError) {
    // Token expired, refresh or re-authenticate
    await connectionManager.refreshConnection(userId, connectionId);

    // Retry operation
    const result = await slack.sendMessage({ channel: '#general', text: 'Hi' });
  }
}
```

### Graceful Workflow Failures

```typescript
// Workflow with optional steps
const workflow = {
  steps: [
    {
      id: 'critical-step',
      serverId: 'github',
      action: 'createIssue',
      required: true // Will fail workflow if this fails
    },
    {
      id: 'notification',
      serverId: 'slack',
      action: 'sendMessage',
      required: false // Workflow continues if this fails
    }
  ]
};

const result = await orchestrator.executeWorkflow(...);

// Check individual step results
result.results.forEach(stepResult => {
  if (!stepResult.success) {
    console.log(`Step ${stepResult.stepId} failed: ${stepResult.error}`);
  }
});
```

## Advanced Examples

### Context-Aware Requests

```typescript
const context = {
  userId: 'user-123',
  conversationId: 'conv-456',
  history: [
    {
      role: 'user',
      content: 'Show me my repositories',
      timestamp: new Date()
    },
    {
      role: 'assistant',
      content: 'Found 5 repositories',
      timestamp: new Date()
    }
  ]
};

// This request uses context from previous messages
const result = await orchestrator.processUserRequest(
  'Create an issue in the first one',
  userId,
  context
);
```

### Conditional Workflows

```typescript
// Execute step conditionally based on previous result
const step2Result = await executeStep(step2, context, userId);

if (step2Result.output?.status === 'success') {
  // Execute success notification
  await executeStep(successNotificationStep, context, userId);
} else {
  // Execute failure notification
  await executeStep(failureNotificationStep, context, userId);
}
```

### Parallel Execution

```typescript
// Execute multiple independent operations in parallel
const [githubResult, slackResult, notionResult] = await Promise.all([
  github.listRepositories(),
  slack.listChannels(),
  notion.searchPages({ query: 'project' })
]);
```

## Testing

### Mock MCP Server

```typescript
import { BaseMCPServer } from '@/lib/mcp/base-server';

class MockGitHubServer extends BaseMCPServer {
  async validateConnection(): Promise<boolean> {
    return true;
  }

  async listRepositories() {
    return [
      { id: 1, name: 'test-repo', fullName: 'user/test-repo' }
    ];
  }
}

// Use in tests
const mockServer = new MockGitHubServer(config, userId, credentials);
const repos = await mockServer.listRepositories();
expect(repos).toHaveLength(1);
```

---

For more examples and detailed API documentation, visit the [full documentation](https://docs.nexusai.dev).
