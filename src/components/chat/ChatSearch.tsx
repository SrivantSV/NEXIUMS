'use client';

import * as React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SearchFilters, SearchResult, ChatMessage } from '@/types/chat';
import { Search, X, Filter, Calendar, User as UserIcon } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface ChatSearchProps {
  conversationId: string;
  messages: ChatMessage[];
  onMessageSelect?: (messageId: string) => void;
  onClose?: () => void;
}

export function ChatSearch({
  conversationId,
  messages,
  onMessageSelect,
  onClose,
}: ChatSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    // Simple client-side search (in production, this would be a backend API call)
    const searchResults: SearchResult[] = messages
      .filter((message) => {
        // Text search
        const contentMatch =
          typeof message.content === 'string' &&
          message.content.toLowerCase().includes(query.toLowerCase());

        // Apply filters
        if (filters.userId && message.userId !== filters.userId) return false;
        if (filters.model && message.model !== filters.model) return false;
        if (filters.messageType && message.role !== filters.messageType) return false;
        if (filters.hasAttachments && (!message.attachments || message.attachments.length === 0))
          return false;
        if (filters.hasArtifacts && (!message.artifacts || message.artifacts.length === 0))
          return false;
        if (filters.startDate && new Date(message.createdAt) < filters.startDate) return false;
        if (filters.endDate && new Date(message.createdAt) > filters.endDate) return false;

        return contentMatch;
      })
      .map((message) => {
        // Calculate relevance score
        const content = typeof message.content === 'string' ? message.content : '';
        const matches = content.toLowerCase().split(query.toLowerCase()).length - 1;

        // Generate highlights
        const highlights: string[] = [];
        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();
        let index = lowerContent.indexOf(lowerQuery);

        while (index !== -1 && highlights.length < 3) {
          const start = Math.max(0, index - 40);
          const end = Math.min(content.length, index + query.length + 40);
          highlights.push(content.slice(start, end));
          index = lowerContent.indexOf(lowerQuery, index + 1);
        }

        return {
          message,
          score: matches,
          highlights,
        };
      })
      .sort((a, b) => b.score - a.score);

    setResults(searchResults);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const uniqueUsers = Array.from(
    new Set(messages.map((m) => JSON.stringify({ id: m.userId, name: m.userName })))
  ).map((str) => JSON.parse(str));

  const uniqueModels = Array.from(
    new Set(messages.filter((m) => m.model).map((m) => m.model))
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold">Search Messages</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Search input */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className={cn('w-4 h-4', showFilters && 'text-blue-500')} />
            </Button>
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">User</label>
              <select
                value={filters.userId || ''}
                onChange={(e) =>
                  setFilters({ ...filters, userId: e.target.value || undefined })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="">All users</option>
                {uniqueUsers.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <select
                value={filters.model || ''}
                onChange={(e) =>
                  setFilters({ ...filters, model: e.target.value || undefined })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="">All models</option>
                {uniqueModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message Type</label>
              <select
                value={filters.messageType || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    messageType: (e.target.value as any) || undefined,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="">All types</option>
                <option value="user">User</option>
                <option value="assistant">Assistant</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments || false}
                  onChange={(e) =>
                    setFilters({ ...filters, hasAttachments: e.target.checked || undefined })
                  }
                  className="rounded"
                />
                Has attachments
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.hasArtifacts || false}
                  onChange={(e) =>
                    setFilters({ ...filters, hasArtifacts: e.target.checked || undefined })
                  }
                  className="rounded"
                />
                Has artifacts
              </label>
            </div>

            <Button size="sm" onClick={handleSearch} className="w-full">
              Apply Filters
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((result) => (
              <SearchResultItem
                key={result.message.id}
                result={result}
                query={query}
                onSelect={() => onMessageSelect?.(result.message.id)}
              />
            ))}
          </div>
        ) : query ? (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages found</p>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Enter a search query to find messages</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultItem({
  result,
  query,
  onSelect,
}: {
  result: SearchResult;
  query: string;
  onSelect: () => void;
}) {
  const { message, highlights } = result;

  const highlightText = (text: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <button
      onClick={onSelect}
      className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-sm">{message.userName}</span>
        {message.model && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
            {message.model}
          </span>
        )}
        <span className="text-xs text-gray-500 ml-auto">
          {formatDate(message.createdAt)}
        </span>
      </div>
      {highlights.length > 0 && (
        <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {highlightText(highlights[0])}...
        </div>
      )}
    </button>
  );
}
