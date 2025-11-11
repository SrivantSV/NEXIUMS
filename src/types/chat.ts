// Core chat types and interfaces

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  status?: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

export interface MessageContent {
  type: 'text' | 'image' | 'code' | 'artifact' | 'file' | 'mcp_result';
  content: string;
  metadata?: Record<string, any>;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Artifact {
  id: string;
  type: 'code' | 'document' | 'design' | 'data';
  title: string;
  content: string;
  language?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface Mention {
  id: string;
  userId: string;
  userName: string;
  position: number;
}

export interface MessageMetadata {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  [key: string]: any;
}

export interface ThreadReply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string | MessageContent[];
  role: 'user' | 'assistant' | 'system';
  model?: string;
  tokens?: {
    input: number;
    output: number;
  };
  cost?: number;
  attachments?: Attachment[];
  artifacts?: Artifact[];
  reactions?: Reaction[];
  mentions?: Mention[];
  metadata?: MessageMetadata;
  threadReplies?: ThreadReply[];
  parentMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

export interface Conversation {
  id: string;
  projectId?: string;
  title: string;
  participants: User[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  metadata?: Record<string, any>;
}

export interface ChatInterfaceFeatures {
  // Message Features
  messageEditing: boolean;
  messageDeleting: boolean;
  messageReactions: boolean;
  messageMentions: boolean;
  messageThreads: boolean;
  messageBookmarks: boolean;
  messageSearch: boolean;

  // Input Features
  richTextEditing: boolean;
  markdownSupport: boolean;
  codeBlocks: boolean;
  fileDragDrop: boolean;
  voiceInput: boolean;
  pasteImageSupport: boolean;
  autoComplete: boolean;
  slashCommands: boolean;

  // Collaboration
  realTimeTyping: boolean;
  presenceIndicators: boolean;
  sharedCursors: boolean;
  collaborativeEditing: boolean;
  commentThreads: boolean;

  // Advanced
  messageTemplates: boolean;
  customThemes: boolean;
  keyboardShortcuts: boolean;
  accessibilityFeatures: boolean;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  line: number;
  column: number;
  color?: string;
}

export interface WebSocketMessage {
  type: 'user_typing' | 'user_stopped_typing' | 'user_joined' | 'user_left' |
        'message_created' | 'message_updated' | 'message_deleted' |
        'cursor_moved' | 'selection_changed' | 'heartbeat';
  conversationId?: string;
  userId?: string;
  userName?: string;
  data?: any;
  timestamp: number;
}

export interface SearchFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  model?: string;
  messageType?: 'user' | 'assistant' | 'system';
  hasAttachments?: boolean;
  hasArtifacts?: boolean;
}

export interface SearchResult {
  message: ChatMessage;
  score: number;
  highlights: string[];
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
}

export interface SlashCommand {
  id: string;
  trigger: string;
  title: string;
  description: string;
  category: string;
  action: (args?: string[]) => void | Promise<void>;
  icon?: string;
}
