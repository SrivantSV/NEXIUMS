'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  Paperclip, Mic, Send, Smile, Loader2, X, File, Image as ImageIcon
} from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import EmojiPicker from 'emoji-picker-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Attachment, User } from '@/types/chat';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  attachments?: File[];
  onAttachmentAdd?: (files: File[]) => void;
  onAttachmentRemove?: (index: number) => void;
  isStreaming?: boolean;
  mentions?: User[];
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  attachments = [],
  onAttachmentAdd,
  onAttachmentRemove,
  isStreaming = false,
  mentions = [],
  placeholder = 'Type a message...',
  disabled = false,
}: ChatInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showMentions, setShowMentions] = React.useState(false);
  const [mentionFilter, setMentionFilter] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    error: recordingError,
  } = useVoiceRecording();

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  // Handle mentions detection
  React.useEffect(() => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex === textBeforeCursor.length - 1) {
      setShowMentions(true);
      setMentionFilter('');
    } else if (lastAtIndex !== -1) {
      const filter = textBeforeCursor.slice(lastAtIndex + 1);
      if (!filter.includes(' ')) {
        setShowMentions(true);
        setMentionFilter(filter);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) {
        onSend();
      }
    }

    // Close emoji picker on Escape
    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
      setShowMentions(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onAttachmentAdd) {
      onAttachmentAdd(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const cursorPosition = textareaRef.current?.selectionStart || value.length;
    const newValue =
      value.slice(0, cursorPosition) + emoji + value.slice(cursorPosition);
    onChange(newValue);
    setShowEmojiPicker(false);

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleMentionSelect = (user: User) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const newValue =
        value.slice(0, lastAtIndex) +
        `@${user.displayName} ` +
        value.slice(cursorPosition);
      onChange(newValue);
      setShowMentions(false);

      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      await stopRecording();
      // Here you would upload the audio and convert to text
    } else {
      await startRecording();
    }
  };

  const filteredMentions = mentions.filter((user) =>
    user.displayName.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <AttachmentPreview
                key={index}
                file={file}
                onRemove={() => onAttachmentRemove?.(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-3 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                Recording: {formatTime(recordingTime)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={cancelRecording}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleVoiceRecord}>
                Stop & Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main input area */}
      <div className="flex items-end gap-2 p-4">
        {/* Attachment button */}
        <Tooltip content="Attach files">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
        </Tooltip>

        {/* Voice recording button */}
        <Tooltip
          content={isRecording ? 'Stop recording' : 'Voice message'}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceRecord}
            disabled={disabled}
            className={cn(
              'flex-shrink-0',
              isRecording && 'text-red-500 hover:text-red-600'
            )}
          >
            <Mic className="w-5 h-5" />
          </Button>
        </Tooltip>

        {/* Main text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isRecording}
            className="w-full min-h-[44px] max-h-[200px] p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
          />

          {/* Emoji picker button */}
          <div className="absolute right-2 bottom-2">
            <Tooltip content="Add emoji">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
              >
                <Smile className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>

          {/* Mention dropdown */}
          {showMentions && filteredMentions.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredMentions.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleMentionSelect(user)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <span className="text-sm">{user.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={onSend}
          disabled={disabled || isStreaming || (!value.trim() && attachments.length === 0)}
          className="flex-shrink-0"
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full right-4 mb-2 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFileUpload}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.json,.csv"
      />

      {/* Recording error */}
      {recordingError && (
        <div className="px-4 pb-2 text-sm text-red-500">{recordingError}</div>
      )}
    </div>
  );
}

function AttachmentPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [file, isImage]);

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {isImage && preview ? (
          <img src={preview} alt={file.name} className="w-10 h-10 object-cover rounded" />
        ) : (
          <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-medium">
            {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
