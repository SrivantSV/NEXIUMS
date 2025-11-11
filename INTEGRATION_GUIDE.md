# Nexus AI - Core Systems Integration Guide

This guide explains how the three core systems (Authentication, AI Models, and Chat) are integrated together.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│                                                              │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐         │
│  │   User     │   │     AI     │   │    Chat    │         │
│  │  Context   │───│  Context   │───│  Context   │         │
│  └────────────┘   └────────────┘   └────────────┘         │
│                                                              │
│         ↓                 ↓                 ↓                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
         ┌─────────────────────────────────────────┐
         │      Unified API Middleware              │
         │  - Authentication Check                  │
         │  - User Context Extraction               │
         │  - Rate Limiting                         │
         │  - Quota Enforcement                     │
         └─────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                 ↓
   ┌──────────┐    ┌──────────┐     ┌──────────┐
   │   Auth   │    │    AI    │     │   Chat   │
   │  System  │    │  System  │     │  System  │
   │(Supabase)│    │ (Router) │     │(WebSocket│
   └──────────┘    └──────────┘     └──────────┘
```

## Components Created

### 1. Unified API Middleware
- **Location**: `src/lib/integration/api-middleware.ts`
- **Purpose**: Handles auth + rate limiting + quota enforcement
- **Exports**: `withAuth()`, `createAuthenticatedHandler()`, `getUserContext()`, `trackUsage()`

### 2. WebSocket Authentication
- **Location**: `src/lib/integration/websocket-auth.ts`
- **Purpose**: Secures WebSocket connections with Supabase tokens
- **Exports**: `authenticateWebSocket()`, `handleWebSocketConnection()`, `broadcastToConversation()`

### 3. React Context Providers
- **UserContext**: `src/contexts/UserContext.tsx` - Auth & profile
- **AIContext**: `src/contexts/AIContext.tsx` - Model selection & cost
- **ChatContext**: `src/contexts/ChatContext.tsx` - Messages & real-time
- **AppProvider**: `src/contexts/AppProvider.tsx` - Unified provider

### 4. Integrated Chat Interface
- **Location**: `src/components/integrated/IntegratedChatInterface.tsx`
- **Purpose**: Complete UI combining all three systems
- **Features**: Auth display, model selection, cost tracking, streaming, quotas

### 5. Integrated Chat API
- **Location**: `src/app/api/integrated/chat/route.ts`
- **Purpose**: Complete API endpoint with full integration
- **Features**: Authenticated requests, AI routing, streaming, usage tracking

## Quick Start

### 1. Wrap your app with providers

```tsx
// src/app/layout.tsx
import { AppProvider } from '@/contexts/AppProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
```

### 2. Use the integrated chat interface

```tsx
// src/app/chat/page.tsx
import { IntegratedChatInterface } from '@/components/integrated/IntegratedChatInterface';

export default function ChatPage() {
  return <IntegratedChatInterface />;
}
```

### 3. Or build custom components

```tsx
'use client';
import { useUser, useAI, useChat } from '@/contexts/AppProvider';

export function MyCustomChat() {
  const { user, subscription, quotas } = useUser();
  const { selectedModel, sessionCost } = useAI();
  const { messages, sendMessage, isStreaming } = useChat();

  return (
    <div>
      <div>User: {user?.email}</div>
      <div>Tier: {subscription?.tier}</div>
      <div>Quota: {quotas?.remaining}/{quotas?.api_quota_limit}</div>
      <div>Model: {selectedModel || 'Smart Router'}</div>
      <div>Cost: ${sessionCost.toFixed(4)}</div>
      
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      
      <button
        onClick={() => sendMessage('Hello!')}
        disabled={isStreaming}
      >
        Send
      </button>
    </div>
  );
}
```

## Rate Limits by Tier

| Tier       | Requests/Min | Monthly Quota |
|------------|-------------|---------------|
| Free       | 20          | 100           |
| Pro        | 100         | 10,000        |
| Team       | 500         | 100,000       |
| Enterprise | 10,000      | Unlimited     |

## Testing

See the integration tests and examples in the full guide above.

## Next Steps

1. Add SQL migration for `increment_user_requests()` function
2. Implement Redis-based rate limiting
3. Add comprehensive integration tests
4. Deploy WebSocket server
5. Configure production environment variables

## Support

For detailed documentation, see the individual system reports:
- Authentication: Check Agent 1 report
- AI Models: Check Agent 2 report
- Chat/Real-time: Check Agent 3 report
