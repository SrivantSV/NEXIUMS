'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { MessageContent as MessageContentType, Artifact, Attachment } from '@/types/chat';
import { cn } from '@/lib/utils';

interface MessageContentProps {
  content: string | MessageContentType[];
  artifacts?: Artifact[];
  attachments?: Attachment[];
}

export function MessageContent({ content, artifacts, attachments }: MessageContentProps) {
  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <div className="markdown-content prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {content.map((item, index) => (
          <div key={index}>
            {item.type === 'text' && (
              <div className="markdown-content prose dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                >
                  {item.content}
                </ReactMarkdown>
              </div>
            )}
            {item.type === 'code' && (
              <CodeBlock
                code={item.content}
                language={item.metadata?.language || 'text'}
              />
            )}
            {item.type === 'image' && (
              <img
                src={item.content}
                alt={item.metadata?.alt || 'Image'}
                className="max-w-full rounded-lg"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {renderContent()}

      {/* Artifacts */}
      {artifacts && artifacts.length > 0 && (
        <div className="space-y-2">
          {artifacts.map((artifact) => (
            <ArtifactEmbed key={artifact.id} artifact={artifact} />
          ))}
        </div>
      )}

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <AttachmentEmbed key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

function ArtifactEmbed({ artifact }: { artifact: Artifact }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{artifact.title}</h4>
        <span className="text-xs text-gray-500 capitalize">{artifact.type}</span>
      </div>
      {artifact.type === 'code' && (
        <CodeBlock code={artifact.content} language={artifact.language || 'text'} />
      )}
      {artifact.type !== 'code' && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {artifact.content}
        </div>
      )}
    </div>
  );
}

function AttachmentEmbed({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.type.startsWith('image/');

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
      {isImage ? (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-w-full rounded"
        />
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white font-medium">
            {attachment.name.split('.').pop()?.toUpperCase() || 'FILE'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{attachment.name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(attachment.size)}
            </p>
          </div>
          <a
            href={attachment.url}
            download={attachment.name}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
