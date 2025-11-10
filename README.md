# Nexus AI - Chat Interface & Real-Time Communication System

A comprehensive, production-ready chat interface with advanced real-time collaboration features built for Nexus AI.

## 🚀 Features

### Advanced Chat Interface
- ✅ **Rich Message Support**: Text, code, images, files, and artifacts
- ✅ **Message Management**: Edit, delete, react, reply, bookmark, and share messages
- ✅ **Real-time Collaboration**: Live typing indicators, presence awareness, and shared cursors
- ✅ **Advanced Input**: Rich text editing with Markdown, code syntax highlighting, and auto-complete
- ✅ **File Handling**: Drag-and-drop uploads, paste images, multiple file support
- ✅ **Voice Features**: Voice recording and transcription capabilities
- ✅ **Emoji Support**: Built-in emoji picker for reactions and messages
- ✅ **@Mentions**: Tag and notify team members in conversations
- ✅ **Thread Replies**: Organize discussions with threaded conversations
- ✅ **Message Search**: Advanced search with filtering by user, date, model, and content type
- ✅ **Virtual Scrolling**: Optimized performance for thousands of messages
- ✅ **Accessibility**: WCAG 2.1 compliant with keyboard shortcuts and screen reader support
- ✅ **Mobile Responsive**: Fully responsive design that works on all devices

### Real-Time Communication
- ✅ **WebSocket Manager**: Robust WebSocket connection with auto-reconnect
- ✅ **Presence System**: Track online users and their status
- ✅ **Typing Indicators**: See when others are typing in real-time
- ✅ **Live Updates**: Messages appear instantly across all connected clients
- ✅ **Heartbeat Monitoring**: Automatic connection health checks
- ✅ **Event System**: Comprehensive event handling for all real-time features

### Developer Experience
- ✅ **TypeScript**: Fully typed for better development experience
- ✅ **Component Library**: Reusable UI components (Button, Input, Avatar, Tooltip, etc.)
- ✅ **Custom Hooks**: React hooks for real-time features, voice recording, and more
- ✅ **Modular Architecture**: Clean separation of concerns
- ✅ **Extensible**: Easy to add new features and customize

## 📦 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Real-time**: WebSocket with custom manager
- **UI Components**: Custom component library with shadcn/ui patterns
- **Markdown**: react-markdown with syntax highlighting
- **Virtual Scrolling**: react-virtuoso for performance
- **Emoji**: emoji-picker-react
- **Voice**: Web Audio API with MediaRecorder

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page with chat demo
│   └── globals.css              # Global styles and animations
├── components/
│   ├── chat/                    # Chat-specific components
│   │   ├── ChatInterface.tsx   # Main chat component
│   │   ├── ChatInput.tsx       # Advanced input with features
│   │   ├── Message.tsx         # Message display with actions
│   │   ├── MessageContent.tsx  # Content renderer (markdown, artifacts)
│   │   └── ChatSearch.tsx      # Search and filtering
│   └── ui/                      # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Avatar.tsx
│       └── Tooltip.tsx
├── hooks/                        # Custom React hooks
│   ├── useRealTimePresence.ts  # Presence and typing indicators
│   ├── useRealTimeMessages.ts  # Message real-time updates
│   └── useVoiceRecording.ts    # Voice recording functionality
├── lib/
│   ├── realtime/
│   │   └── websocket.ts        # WebSocket manager
│   └── utils.ts                 # Utility functions
└── types/
    └── chat.ts                  # TypeScript interfaces and types
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- A modern browser with WebSocket support

### Installation

1. **Install dependencies**:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. **Run the development server**:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 💻 Usage

### Basic Usage

```typescript
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatPage() {
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
          // Handle message send
          console.log('New message:', message);
        }}
      />
    </div>
  );
}
```

### Using Real-Time Hooks

```typescript
import { useRealTimePresence } from '@/hooks/useRealTimePresence';

function MyComponent({ conversationId, userId }) {
  const {
    typingUsers,
    presenceUsers,
    sendTyping,
    isConnected
  } = useRealTimePresence(conversationId, userId);

  // Use the real-time data in your component
  return (
    <div>
      <p>Online users: {presenceUsers.length}</p>
      {typingUsers.length > 0 && <p>Someone is typing...</p>}
    </div>
  );
}
```

## 🎨 Customization

### Theming

The application supports light and dark modes using CSS variables. Customize colors in `src/app/globals.css`:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... */
}
```

### Adding Custom Message Types

Extend the `MessageContent` type in `src/types/chat.ts`:

```typescript
interface MessageContent {
  type: 'text' | 'image' | 'code' | 'artifact' | 'file' | 'mcp_result' | 'your-custom-type';
  content: string;
  metadata?: any;
}
```

Then update the renderer in `MessageContent.tsx`.

## 🔌 WebSocket Server

The chat interface expects a WebSocket server at the URL specified in `NEXT_PUBLIC_WS_URL`. The server should handle these message types:

- `user_typing` / `user_stopped_typing`
- `user_joined` / `user_left`
- `message_created` / `message_updated` / `message_deleted`
- `cursor_moved` / `selection_changed`
- `heartbeat`

Example message format:
```typescript
{
  type: 'message_created',
  conversationId: 'conv-1',
  userId: 'user-1',
  data: { /* message data */ },
  timestamp: 1234567890
}
```

## 📱 Mobile Support

The interface is fully responsive and optimized for mobile devices:
- Touch-friendly UI elements
- Swipe gestures support
- Adaptive layouts
- Optimized for small screens

## ♿ Accessibility

- WCAG 2.1 Level AA compliant
- Full keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Focus indicators
- ARIA labels and roles

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure these are set in your production environment:
- `NEXT_PUBLIC_WS_URL`: Your production WebSocket server URL
- `NEXT_PUBLIC_API_URL`: Your production API URL

## 📄 License

This project is part of the Nexus AI system.

## 🤝 Contributing

This is an internal project. For questions or issues, contact the development team.

## 🎯 Roadmap

### Implemented ✅
- Core chat interface with all features
- Real-time communication system
- Voice recording
- File attachments
- Message search
- Reactions and mentions
- Virtual scrolling
- Accessibility features

### Future Enhancements 🔮
- End-to-end encryption
- Video/audio calling
- Screen sharing
- Message translation
- AI-powered search
- Custom slash commands
- Integration with external tools
- Analytics and insights

## 📚 Documentation

For more detailed documentation, see:
- [Component API Reference](./docs/components.md) (coming soon)
- [WebSocket Protocol](./docs/websocket.md) (coming soon)
- [Customization Guide](./docs/customization.md) (coming soon)

## 💡 Tips

1. **Performance**: Use virtual scrolling for conversations with 1000+ messages
2. **Real-time**: Ensure WebSocket server is running for real-time features
3. **Accessibility**: Test with keyboard navigation and screen readers
4. **Mobile**: Test on actual devices, not just browser dev tools
5. **Dark Mode**: Ensure all custom components support dark mode

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Check that `NEXT_PUBLIC_WS_URL` is correctly set
- Ensure your WebSocket server is running
- Check browser console for connection errors

### Performance Issues
- Enable virtual scrolling for large message lists
- Reduce the number of re-renders by memoizing components
- Use production build for better performance

### Styling Issues
- Clear browser cache
- Check Tailwind CSS configuration
- Ensure dark mode class is applied correctly

---

Built with ❤️ for Nexus AI
