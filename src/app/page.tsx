'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatMessage, User } from '@/types/chat';
import { useState } from 'react';

// Mock data for demo
const mockUser: User = {
  id: 'user-1',
  email: 'demo@nexus.ai',
  displayName: 'Demo User',
  status: 'online',
};

const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    userId: 'user-1',
    userName: 'Demo User',
    content: 'Hello! Can you help me understand how the chat interface works?',
    role: 'user',
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    userId: 'assistant',
    userName: 'AI Assistant',
    content: `# Welcome to Nexus AI Chat Interface!

I'd be happy to explain the features:

## Core Features
- **Real-time messaging** with WebSocket support
- **Rich text editing** with Markdown support
- **File attachments** and drag-and-drop uploads
- **Voice recording** capabilities
- **Emoji picker** for reactions
- **@mentions** for collaboration
- **Message editing and deletion**
- **Threaded conversations**
- **Search functionality**

## Advanced Features
- Virtual scrolling for performance
- Typing indicators
- Presence awareness
- Message reactions
- Code syntax highlighting
- Artifact embedding

Try typing \`@\` to mention someone or click the attachment button to upload files!`,
    role: 'assistant',
    model: 'smart-router',
    tokens: {
      input: 20,
      output: 150,
    },
    cost: 0.0012,
    createdAt: new Date(Date.now() - 3500000),
    updatedAt: new Date(Date.now() - 3500000),
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    userId: 'user-1',
    userName: 'Demo User',
    content: 'That looks amazing! Can you show me a code example?',
    role: 'user',
    createdAt: new Date(Date.now() - 3000000),
    updatedAt: new Date(Date.now() - 3000000),
  },
  {
    id: 'msg-4',
    conversationId: 'conv-1',
    userId: 'assistant',
    userName: 'AI Assistant',
    content: `Sure! Here's a simple example of how to use the ChatInterface component:

\`\`\`typescript
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Page() {
  const currentUser = {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'John Doe',
    status: 'online',
  };

  return (
    <div className="h-screen">
      <ChatInterface
        conversationId="conv-1"
        currentUser={currentUser}
        onMessageSend={(message) => {
          console.log('New message:', message);
        }}
      />
    </div>
  );
}
\`\`\`

The component handles all the real-time features, message rendering, and user interactions automatically!`,
    role: 'assistant',
    model: 'smart-router',
    tokens: {
      input: 15,
      output: 120,
    },
    cost: 0.001,
    artifacts: [
      {
        id: 'artifact-1',
        type: 'code',
        title: 'ChatInterface Usage Example',
        content: `import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Page() {
  const currentUser = {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'John Doe',
    status: 'online',
  };

  return (
    <div className="h-screen">
      <ChatInterface
        conversationId="conv-1"
        currentUser={currentUser}
        onMessageSend={(message) => {
          console.log('New message:', message);
        }}
      />
    </div>
  );
}`,
        language: 'typescript',
        createdAt: new Date(),
      },
    ],
    createdAt: new Date(Date.now() - 2500000),
    updatedAt: new Date(Date.now() - 2500000),
  },
];

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);

  const handleMessageSend = (message: ChatMessage) => {
    console.log('Message sent:', message);
    // In a real app, you'd send this to your backend
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Nexus AI Chat Interface</h1>
          <p className="text-blue-100">
            A world-class chat experience with advanced collaboration features
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="h-full max-w-7xl mx-auto">
          <ChatInterface
            conversationId="conv-demo"
            currentUser={mockUser}
            initialMessages={messages}
            onMessageSend={handleMessageSend}
            className="h-full shadow-lg"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Built with Next.js, TypeScript, Tailwind CSS, and WebSocket for real-time
            communication
          </p>
        </div>
      </footer>
    </div>
  );
}
