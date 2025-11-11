'use client';

import * as React from 'react';
import { ChatMessage, Reaction } from '@/types/chat';
import { Avatar } from '@/components/ui/Avatar';
import { MessageContent } from './MessageContent';
import { formatDate, formatTime, cn } from '@/lib/utils';
import {
  Edit2, Trash2, Heart, MessageCircle, Bookmark,
  Share2, Copy, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';

interface MessageProps {
  message: ChatMessage;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onReaction?: (id: string, emoji: string) => void;
  onReply?: (id: string) => void;
  onBookmark?: (id: string) => void;
}

export function Message({
  message,
  onEdit,
  onDelete,
  onReaction,
  onReply,
  onBookmark,
}: MessageProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [showActions, setShowActions] = React.useState(false);
  const [editContent, setEditContent] = React.useState(
    typeof message.content === 'string' ? message.content : ''
  );
  const [showReactions, setShowReactions] = React.useState(false);

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(message.id, editContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(typeof message.content === 'string' ? message.content : '');
    setIsEditing(false);
  };

  const handleCopy = async () => {
    const text = typeof message.content === 'string' ? message.content : '';
    await navigator.clipboard.writeText(text);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share message:', message.id);
  };

  if (message.deletedAt) {
    return (
      <div className="px-4 py-2 text-gray-400 italic text-sm">
        This message was deleted
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors message-appear',
        message.role === 'assistant' && 'bg-gray-50/50 dark:bg-gray-800/30'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar
          user={{
            displayName: message.userName,
            avatar: message.userAvatar,
            email: message.userName,
          }}
          size="sm"
          className="flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{message.userName}</span>
            {message.model && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                {message.model}
              </span>
            )}
            <Tooltip content={formatDate(message.createdAt)}>
              <span className="text-xs text-gray-500">
                {formatTime(message.createdAt)}
              </span>
            </Tooltip>
            {message.editedAt && (
              <span className="text-xs text-gray-500">(edited)</span>
            )}
          </div>

          {/* Message content */}
          <div className="mt-1">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[100px] p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <MessageContent
                content={message.content}
                artifacts={message.artifacts}
                attachments={message.attachments}
              />
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <MessageReactions
              reactions={message.reactions}
              onReactionClick={(emoji) => onReaction?.(message.id, emoji)}
            />
          )}

          {/* Thread preview */}
          {message.threadReplies && message.threadReplies.length > 0 && (
            <ThreadPreview
              replies={message.threadReplies}
              onViewThread={() => console.log('View thread:', message.id)}
            />
          )}

          {/* Token usage info */}
          {message.tokens && (
            <div className="mt-2 text-xs text-gray-500">
              {message.tokens.input + message.tokens.output} tokens
              {message.cost && ` • $${message.cost.toFixed(4)}`}
            </div>
          )}
        </div>
      </div>

      {/* Message actions */}
      {showActions && !isEditing && (
        <div className="absolute right-4 top-2 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1">
          <Tooltip content="Add reaction">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowReactions(!showReactions)}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </Tooltip>
          {onReply && (
            <Tooltip content="Reply in thread">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onReply(message.id)}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}
          {message.role === 'user' && onEdit && (
            <Tooltip content="Edit message">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Copy message">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </Tooltip>
          {onBookmark && (
            <Tooltip content="Bookmark">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onBookmark(message.id)}
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Share">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </Tooltip>
          {onDelete && (
            <Tooltip content="Delete message">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600"
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}
        </div>
      )}

      {/* Reaction picker */}
      {showReactions && (
        <div className="absolute right-4 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-10">
          <div className="flex gap-1">
            {['👍', '❤️', '😊', '🎉', '🤔', '👀'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReaction?.(message.id, emoji);
                  setShowReactions(false);
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 text-xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageReactions({
  reactions,
  onReactionClick,
}: {
  reactions: Reaction[];
  onReactionClick: (emoji: string) => void;
}) {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
        <Tooltip
          key={emoji}
          content={reactionList.map((r) => r.userName).join(', ')}
        >
          <button
            onClick={() => onReactionClick(emoji)}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm transition-colors reaction-pop"
          >
            <span>{emoji}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {reactionList.length}
            </span>
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

function ThreadPreview({
  replies,
  onViewThread,
}: {
  replies: any[];
  onViewThread: () => void;
}) {
  return (
    <button
      onClick={onViewThread}
      className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
    >
      <MessageCircle className="w-4 h-4" />
      {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
    </button>
  );
}
