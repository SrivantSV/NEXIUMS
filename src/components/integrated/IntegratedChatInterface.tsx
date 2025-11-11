'use client';

/**
 * Integrated Chat Interface
 * Combines Authentication + AI Models + Chat
 *
 * Features:
 * - Authenticated chat with user context
 * - Model selection UI
 * - Cost tracking display
 * - Streaming AI responses
 * - Quota monitoring
 * - Real-time updates
 */

import React, { useState, useEffect, useRef } from 'react';
import { useUser, useAI, useChat } from '@/contexts/AppProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/Avatar';

export function IntegratedChatInterface() {
  const { user, profile, subscription, quotas, signOut } = useUser();
  const {
    selectedModel,
    availableModels,
    setSelectedModel,
    useSmartRouter,
    setUseSmartRouter,
    sessionCost,
    totalCost,
    loadingModels,
  } = useAI();
  const {
    messages,
    inputValue,
    setInputValue,
    sendMessage,
    isStreaming,
    streamingContent,
    isConnected,
    typingUsers,
    loading,
    error,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;
    await sendMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show authentication required message
  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to start chatting with AI models
          </p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto">
      {/* Header with user info and controls */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar
              user={{
                id: user.id,
                displayName: profile?.display_name || user.email || 'User',
                avatar: profile?.avatar_url,
              }}
              size="md"
              showStatus={true}
            />
            <div>
              <div className="font-semibold">
                {profile?.display_name || user.email}
              </div>
              <div className="text-sm text-gray-500">
                {subscription?.tier === 'free' ? '🆓 Free' :
                 subscription?.tier === 'pro' ? '⭐ Pro' :
                 subscription?.tier === 'team' ? '👥 Team' : '🏢 Enterprise'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Quota display */}
            {quotas && (
              <div className="text-sm">
                <span className="text-gray-500">Quota:</span>{' '}
                <span className={quotas.remaining < 10 ? 'text-red-500 font-semibold' : 'text-gray-700'}>
                  {quotas.remaining}
                </span>
                <span className="text-gray-400">/{quotas.api_quota_limit}</span>
              </div>
            )}

            {/* Cost display */}
            <div className="text-sm">
              <span className="text-gray-500">Session:</span>{' '}
              <span className="text-gray-700">${sessionCost.toFixed(4)}</span>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Sign out */}
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Model selection */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smart-router"
              checked={useSmartRouter}
              onChange={(e) => setUseSmartRouter(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="smart-router" className="text-sm text-gray-700">
              Smart Router
            </label>
          </div>

          {!useSmartRouter && (
            <div className="relative flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModelSelector(!showModelSelector)}
                disabled={loadingModels}
              >
                {loadingModels ? 'Loading...' : selectedModel || 'Select Model'}
              </Button>

              {showModelSelector && (
                <div className="absolute top-full mt-2 left-0 bg-white border rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto w-96">
                  <div className="font-semibold mb-2">Available Models</div>
                  <div className="space-y-1">
                    {availableModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                          selectedModel === model.id ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-gray-500">
                          {model.provider} • ${model.pricing.inputTokenCost}/M in
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {useSmartRouter && (
            <div className="text-sm text-gray-500">
              AI will automatically select the best model for each request
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
            <p>Ask anything, and AI will help you out!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role !== 'user' && (
              <Avatar
                user={{
                  id: message.userId,
                  displayName: message.userName,
                  avatar: message.userAvatar,
                }}
                size="sm"
              />
            )}

            <div
              className={`max-w-2xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border'
              }`}
            >
              {message.role !== 'user' && (
                <div className="text-xs text-gray-500 mb-1">
                  {message.model || message.userName}
                  {message.cost && ` • $${message.cost.toFixed(4)}`}
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>

            {message.role === 'user' && (
              <Avatar
                user={{
                  id: message.userId,
                  displayName: message.userName,
                  avatar: message.userAvatar,
                }}
                size="sm"
              />
            )}
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3 justify-start">
            <Avatar
              user={{
                id: 'ai',
                displayName: 'AI',
              }}
              size="sm"
            />
            <div className="max-w-2xl rounded-lg p-4 bg-white border">
              <div className="text-xs text-gray-500 mb-1">Streaming...</div>
              <div className="whitespace-pre-wrap">{streamingContent}</div>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Typing indicators */}
        {typingUsers.length > 0 && !isStreaming && (
          <div className="text-sm text-gray-500 italic">
            {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-white p-4">
        {error && (
          <div className="mb-2 text-sm text-red-500 bg-red-50 border border-red-200 rounded p-2">
            Error: {error.message}
          </div>
        )}

        {quotas && quotas.remaining === 0 && (
          <div className="mb-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
            ⚠️ You've reached your monthly quota. <a href="/pricing" className="underline">Upgrade</a> to continue.
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isStreaming || loading || (quotas?.remaining === 0)}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming || loading || (quotas?.remaining === 0)}
          >
            {isStreaming ? 'Sending...' : 'Send'}
          </Button>
        </div>

        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>
            {useSmartRouter
              ? 'Using Smart Router'
              : selectedModel
              ? `Using ${selectedModel}`
              : 'Select a model'}
          </span>
          <span>
            Total cost: ${totalCost.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
