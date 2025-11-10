# Nexus AI - MCP Integration Framework

A comprehensive Model Context Protocol (MCP) integration framework that connects to 50+ external services, enabling seamless AI-powered workflows across productivity tools, communication platforms, development services, and more.

## 🚀 Features

### Core Capabilities

- **50+ Integrations**: Connect to major services including:
  - **Productivity**: Notion, Linear, Jira, Asana, Trello, Airtable, ClickUp
  - **Communication**: Slack, Discord, Microsoft Teams, Gmail
  - **Development**: GitHub, GitLab, Vercel, Netlify, Docker, AWS
  - **Design**: Figma, Canva
  - **Storage**: Google Drive, Dropbox, OneDrive
  - **Business**: Salesforce, HubSpot, Stripe
  - And many more!

- **Intelligent Orchestration**:
  - Natural language intent classification
  - Automatic tool selection
  - Multi-step workflow execution
  - Context-aware parameter extraction

- **Enterprise-Ready**:
  - OAuth 2.0 authentication
  - Encrypted credential storage
  - Rate limiting and quota management
  - Webhook support
  - Usage analytics

## 📦 Project Structure

```
nexus-ai/
├── src/
│   ├── types/
│   │   └── mcp.ts                    # Core MCP type definitions
│   ├── lib/
│   │   ├── mcp/
│   │   │   ├── orchestrator.ts       # Main orchestration engine
│   │   │   ├── intent-classifier.ts  # NLP-based intent classification
│   │   │   ├── workflow-engine.ts    # Multi-step workflow management
│   │   │   ├── connection-manager.ts # Connection lifecycle management
│   │   │   ├── server-registry.ts    # Available servers registry
│   │   │   ├── base-server.ts        # Base server implementation
│   │   │   └── servers/             # Individual server implementations
│   │   │       ├── github.ts
│   │   │       ├── slack.ts
│   │   │       ├── notion.ts
│   │   │       ├── linear.ts
│   │   │       └── google-drive.ts
│   │   └── auth/
│   │       ├── oauth.ts              # OAuth flow management
│   │       └── encryption.ts         # Credential encryption
│   ├── components/
│   │   ├── mcp/
│   │   │   └── MCPManager.tsx       # Main UI component
│   │   └── ui/                      # Shared UI components
│   └── app/
│       ├── api/
│       │   ├── mcp/
│       │   │   ├── connections/     # Connection CRUD
│       │   │   ├── execute/         # Execute MCP operations
│       │   │   └── servers/         # Available servers
│       │   └── auth/
│       │       ├── oauth/           # OAuth initiation
│       │       └── callback/        # OAuth callback
│       ├── integrations/            # MCP Manager page
│       └── page.tsx                 # Home page
```

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/nexus-ai.git
   cd nexus-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API credentials for the services you want to use.

4. **Generate encryption key**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Add the output to `ENCRYPTION_KEY` in `.env`.

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

Required variables in `.env`:

```env
# Application
APP_URL=http://localhost:3000
NODE_ENV=development

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key-base64

# GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Slack
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret

# Notion
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret

# Linear
LINEAR_CLIENT_ID=your-linear-client-id
LINEAR_CLIENT_SECRET=your-linear-client-secret

# Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### OAuth Setup

For each service you want to integrate:

1. **Register your application** with the service provider
2. **Set redirect URI** to `{APP_URL}/api/auth/callback/{service-id}`
3. **Add credentials** to `.env`
4. **Configure scopes** in `src/lib/mcp/server-registry.ts`

## 📚 Usage

### Connecting Services

1. Navigate to `/integrations`
2. Browse available integrations
3. Click "Connect" on desired service
4. Complete OAuth flow
5. Service is now connected!

### Using MCP in Code

```typescript
import { MCPOrchestrator } from '@/lib/mcp/orchestrator';

const orchestrator = new MCPOrchestrator();

// Execute a natural language request
const result = await orchestrator.processUserRequest(
  "Search for recent commits in my repository",
  userId,
  context
);

console.log(result);
// {
//   success: true,
//   data: [...commits],
//   summary: "Found 10 recent commits"
// }
```

### Creating Custom Workflows

```typescript
import { WorkflowEngine } from '@/lib/mcp/workflow-engine';

const engine = new WorkflowEngine();

// Add custom workflow template
engine.addTemplate({
  id: 'deploy-and-notify',
  name: 'Deploy and Notify Team',
  intent: 'deploy-and-notify',
  steps: [
    {
      id: 'deploy',
      serverId: 'vercel',
      action: 'deploy',
      parameters: { project: 'my-app' },
      required: true,
    },
    {
      id: 'notify',
      serverId: 'slack',
      action: 'send-message',
      parameters: { channel: '#deploys' },
      required: false,
      dependsOn: ['deploy'],
    },
  ],
});
```

### Adding New MCP Servers

1. **Create server implementation**:

```typescript
// src/lib/mcp/servers/myservice.ts
import { BaseMCPServer } from '../base-server';

export class MyServiceMCPServer extends BaseMCPServer {
  async validateConnection(): Promise<boolean> {
    // Implement validation
  }

  async myCustomAction(params: any): Promise<any> {
    return this.executeOperation('myCustomAction', async () => {
      // Implement action
    });
  }
}
```

2. **Register in server registry**:

```typescript
// src/lib/mcp/server-registry.ts
{
  id: 'myservice',
  name: 'My Service',
  description: 'Integration with My Service',
  category: 'productivity',
  icon: '/icons/myservice.svg',
  color: '#FF0000',
  authType: 'oauth',
  capabilities: [...],
}
```

3. **Add to connection manager**:

```typescript
// src/lib/mcp/connection-manager.ts
case 'myservice':
  return (await import('./servers/myservice')).MyServiceMCPServer;
```

## 🔐 Security

- **Encrypted Credentials**: All sensitive data is encrypted at rest using AES-256-GCM
- **OAuth 2.0**: Secure authorization flows for all supported services
- **State Verification**: CSRF protection on OAuth flows
- **Rate Limiting**: Built-in rate limiting per service
- **No Credential Exposure**: API routes never return sensitive credentials

## 📖 API Reference

### REST Endpoints

#### Get Connections
```
GET /api/mcp/connections
Headers: x-user-id: string
Response: { success: boolean, connections: MCPConnection[] }
```

#### Create Connection
```
POST /api/mcp/connections
Headers: x-user-id: string
Body: { serverId: string, credentials: MCPCredentials }
Response: { success: boolean, connection: MCPConnection }
```

#### Execute MCP Operation
```
POST /api/mcp/execute
Headers: x-user-id: string
Body: { userRequest: string, conversationContext?: object }
Response: MCPResponse
```

#### Get Available Servers
```
GET /api/mcp/servers
Response: { success: boolean, servers: MCPServerConfig[] }
```

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 🚢 Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Deploy to your platform**:
   - Vercel: `vercel --prod`
   - Netlify: `netlify deploy --prod`
   - Docker: `docker build -t nexus-ai .`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Components from [Radix UI](https://www.radix-ui.com/)
- Integrations powered by official SDKs

## 📞 Support

For questions and support:
- Create an issue on GitHub
- Email: support@nexusai.dev
- Discord: [Join our community](https://discord.gg/nexusai)

---

**Built with ❤️ by the Nexus AI team**
