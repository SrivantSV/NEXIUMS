/**
 * Chat with Files Integration
 * Example component showing how to integrate file system with chat
 */

'use client';

import React, { useState, useRef } from 'react';
import { FileUpload } from '@/components/files/FileUpload';
import { FilePreview } from '@/components/files/FilePreview';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  FileProcessingResult,
  formatFileSize,
  getFileExtension,
} from '@/types/files';
import { Paperclip, Send, X, File, Image as ImageIcon } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: FileProcessingResult[];
  timestamp: Date;
}

export function ChatWithFiles() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileProcessingResult[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileProcessingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (result: FileProcessingResult) => {
    setAttachedFiles(prev => [...prev, result]);
    setShowFileUpload(false);
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          files: attachedFiles.map(f => ({
            id: f.id,
            name: f.originalFile.name,
            type: f.originalFile.type,
            textContent: f.processedData.textContent,
            analysis: f.analysis,
          })),
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            onFileClick={setPreviewFile}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-pulse">●</div>
            <div className="animate-pulse delay-100">●</div>
            <div className="animate-pulse delay-200">●</div>
            <span className="ml-2">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Attach Files</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <FileUpload
              onUpload={handleFileUpload}
              maxFiles={5}
              multiple={true}
            />
          </Card>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <FilePreview
              file={previewFile}
              onClose={() => setPreviewFile(null)}
            />
          </div>
        </div>
      )}

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="border-t p-3 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Attached Files ({attachedFiles.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map(file => (
              <AttachedFileChip
                key={file.id}
                file={file}
                onRemove={() => removeAttachedFile(file.id)}
                onPreview={() => setPreviewFile(file)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFileUpload(true)}
            disabled={isLoading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />

          <Button
            onClick={handleSendMessage}
            disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onFileClick,
}: {
  message: Message;
  onFileClick: (file: FileProcessingResult) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Attached Files */}
        {message.files && message.files.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.files.map(file => (
              <button
                key={file.id}
                onClick={() => onFileClick(file)}
                className={`flex items-center gap-2 p-2 rounded border w-full text-left transition-colors ${
                  isUser
                    ? 'border-primary-foreground/20 hover:bg-primary-foreground/10'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {file.originalFile.category === 'image' ? (
                  <ImageIcon className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <File className="w-4 h-4 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.originalFile.name}
                  </p>
                  <p className="text-xs opacity-70">
                    {formatFileSize(file.originalFile.size)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-xs opacity-70 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

function AttachedFileChip({
  file,
  onRemove,
  onPreview,
}: {
  file: FileProcessingResult;
  onRemove: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
      <button
        onClick={onPreview}
        className="flex items-center gap-2 hover:underline"
      >
        {file.originalFile.category === 'image' ? (
          <ImageIcon className="w-4 h-4" />
        ) : (
          <File className="w-4 h-4" />
        )}
        <span className="max-w-[150px] truncate">
          {file.originalFile.name}
        </span>
      </button>

      <button
        onClick={onRemove}
        className="ml-1 hover:bg-muted rounded p-1 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
