'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '@/types/chat';
import { Message } from './Message';
import { ChatInput } from './ChatInput';
import { useRealTimePresence } from '@/hooks/useRealTimePresence';
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages';
import { Virtuoso } from 'react-virtuoso';
import { cn, generateId } from '@/lib/utils';
import { Users, Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Avatar } from '@/components/ui/Avatar';

interface ChatInterfaceProps {
  conversationId: string;
  projectId?: string;
  currentUser: User;
  initialMessages?: ChatMessage[];
  onMessageSend?: (message: ChatMessage) => void;
  className?: string;
}

export function ChatInterface({
  conversationId,
  projectId,
  currentUser,
  initialMessages = [],
  onMessageSend,
  className,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('smart-router');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const virtuosoRef = useRef<any>(null);

  // Real-time features
  const {
    typingUsers,
    presenceUsers,
    sendTyping,
    isConnected
  } = useRealTimePresence(conversationId, currentUser.id);

  const {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
  } = useRealTimeMessages(conversationId, initialMessages);

  // Typing indicator timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Send typing indicator
    sendTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 3000);
  };

  const handleSend = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    // Stop typing indicator
    sendTyping(false);

    const newMessage: ChatMessage = {
      id: generateId(),
      conversationId,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatar,
      content: inputValue,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add attachments if any
    if (attachments.length > 0) {
      // In a real app, you'd upload files first and get URLs
      newMessage.attachments = attachments.map((file, index) => ({
        id: `${newMessage.id}-attachment-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Temporary URL for demo
        uploadedAt: new Date(),
        uploadedBy: currentUser.id,
      }));
    }

    // Send via real-time
    sendMessage(newMessage);

    // Callback for parent component
    if (onMessageSend) {
      onMessageSend(newMessage);
    }

    // Clear input
    setInputValue('');
    setAttachments([]);

    // Scroll to bottom
    setTimeout(() => {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length,
        behavior: 'smooth',
      });
    }, 100);

    // Simulate AI response (in real app, this would be handled by your backend)
    if (!isStreaming) {
      setIsStreaming(true);
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: generateId(),
          conversationId,
          userId: 'assistant',
          userName: 'AI Assistant',
          content: `This is a simulated response to: "${inputValue}"\n\nIn a real application, this would be replaced with actual AI-generated content.`,
          role: 'assistant',
          model: selectedModel,
          tokens: {
            input: inputValue.length / 4,
            output: 50,
          },
          cost: 0.0001,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        sendMessage(aiMessage);
        setIsStreaming(false);
      }, 1000);
    }
  };

  const handleEdit = (messageId: string, content: string) => {
    editMessage(messageId, content);
  };

  const handleDelete = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
  };

  const handleAttachmentAdd = (files: File[]) => {
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleAttachmentRemove = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Chat</h2>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          >
            <option value="smart-router">Smart Router</option>
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3">Claude 3</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>

          <Tooltip content="Search messages">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-5 h-5" />
            </Button>
          </Tooltip>

          <Tooltip content="Participants">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="w-5 h-5" />
            </Button>
          </Tooltip>

          <Tooltip content="Settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Participants panel */}
      {showParticipants && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-sm font-medium mb-2">
            Active Users ({presenceUsers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {presenceUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2">
                <Avatar user={user} size="sm" showStatus />
                <span className="text-sm">{user.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          itemContent={(index, message) => (
            <Message
              key={message.id}
              message={message}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReaction={handleReaction}
            />
          )}
          followOutput="smooth"
          alignToBottom
        />
      </div>

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500">
          <TypingIndicator users={typingUsers} />
        </div>
      )}

      {/* Input area */}
      <ChatInput
        value={inputValue}
        onChange={handleInputChange}
        onSend={handleSend}
        attachments={attachments}
        onAttachmentAdd={handleAttachmentAdd}
        onAttachmentRemove={handleAttachmentRemove}
        isStreaming={isStreaming}
        mentions={presenceUsers}
        placeholder="Type a message..."
      />
    </div>
  );
}

function TypingIndicator({ users }: { users: User[] }) {
  const displayText =
    users.length === 1
      ? `${users[0].displayName} is typing`
      : users.length === 2
      ? `${users[0].displayName} and ${users[1].displayName} are typing`
      : `${users[0].displayName} and ${users.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2">
      <span>{displayText}</span>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
      </div>
    </div>
  );
}
