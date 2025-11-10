/**
 * File Preview Component
 * Displays file previews for all supported file types
 */

'use client';

import React from 'react';
import { FileProcessingResult, FilePreview as FilePreviewType } from '@/types/files';
import { FileText, Image as ImageIcon, Film, Music, Code, FileArchive, File as FileIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatFileSize } from '@/types/files';

export interface FilePreviewProps {
  file: FileProcessingResult;
  onClose?: () => void;
  className?: string;
}

export function FilePreview({ file, onClose, className }: FilePreviewProps) {
  const preview = file.preview;
  const metadata = file.originalFile;
  const analysis = file.analysis;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <FileIcon className="w-8 h-8 text-muted-foreground flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{metadata.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary">{metadata.extension}</Badge>
                <Badge variant="outline">{metadata.category}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(metadata.size)}
                </span>
              </div>
            </div>
          </div>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <PreviewContent preview={preview} file={file} />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <AnalysisContent analysis={analysis} file={file} />
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <MetadataContent metadata={metadata} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PreviewContent({ preview, file }: { preview: FilePreviewType; file: FileProcessingResult }) {
  if (preview.type === 'error') {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <div className="text-center">
          <FileIcon className="w-12 h-12 mx-auto mb-2" />
          <p>{preview.content}</p>
        </div>
      </div>
    );
  }

  if (preview.type === 'image') {
    return (
      <div className="space-y-4">
        <img
          src={preview.content}
          alt={file.originalFile.name}
          className="w-full rounded-lg border"
        />
        {preview.thumbnail && preview.thumbnail !== preview.content && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Thumbnail:</p>
            <img
              src={preview.thumbnail}
              alt="Thumbnail"
              className="w-32 h-32 object-cover rounded border"
            />
          </div>
        )}
      </div>
    );
  }

  if (preview.type === 'video') {
    return (
      <div className="space-y-4">
        <video
          src={preview.content}
          poster={preview.thumbnail}
          controls
          className="w-full rounded-lg border"
        >
          Your browser does not support the video tag.
        </video>
        {preview.duration && (
          <p className="text-sm text-muted-foreground">
            Duration: {formatDuration(preview.duration)}
          </p>
        )}
      </div>
    );
  }

  if (preview.type === 'audio') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
          <Music className="w-16 h-16 text-muted-foreground" />
        </div>
        <audio src={preview.content} controls className="w-full">
          Your browser does not support the audio tag.
        </audio>
        {preview.duration && (
          <p className="text-sm text-muted-foreground">
            Duration: {formatDuration(preview.duration)}
          </p>
        )}
      </div>
    );
  }

  if (preview.type === 'pdf') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
          <FileText className="w-16 h-16 text-muted-foreground" />
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-sm">{preview.content}</pre>
        </div>
        {preview.pageCount && (
          <p className="text-sm text-muted-foreground">
            Pages: {preview.pageCount}
          </p>
        )}
      </div>
    );
  }

  if (preview.type === 'code') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium">Code Preview</span>
        </div>
        <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto">
          <code>{preview.content}</code>
        </pre>
      </div>
    );
  }

  // Text preview
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <pre className="whitespace-pre-wrap text-sm">{preview.content}</pre>
    </div>
  );
}

function AnalysisContent({ analysis, file }: { analysis: any; file: FileProcessingResult }) {
  if (!analysis || Object.keys(analysis).length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No analysis available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Text Analysis */}
      {analysis.textAnalysis && (
        <div>
          <h4 className="font-medium mb-3">Text Analysis</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatItem label="Words" value={analysis.textAnalysis.wordCount} />
            <StatItem label="Characters" value={analysis.textAnalysis.characterCount} />
            <StatItem label="Sentences" value={analysis.textAnalysis.sentenceCount} />
            <StatItem label="Paragraphs" value={analysis.textAnalysis.paragraphCount} />
          </div>

          {analysis.textAnalysis.keywords && analysis.textAnalysis.keywords.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.textAnalysis.keywords.slice(0, 10).map((kw: any) => (
                  <Badge key={kw.word} variant="secondary">
                    {kw.word}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Analysis */}
      {analysis.codeAnalysis && (
        <div>
          <h4 className="font-medium mb-3">Code Analysis</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatItem label="Language" value={analysis.codeAnalysis.language} />
            <StatItem
              label="Lines of Code"
              value={analysis.codeAnalysis.metrics?.linesOfCode}
            />
            <StatItem
              label="Functions"
              value={analysis.codeAnalysis.functions?.length || 0}
            />
            <StatItem
              label="Classes"
              value={analysis.codeAnalysis.classes?.length || 0}
            />
            <StatItem
              label="Complexity"
              value={analysis.codeAnalysis.metrics?.cyclomaticComplexity}
            />
            <StatItem
              label="Maintainability"
              value={analysis.codeAnalysis.metrics?.maintainabilityIndex}
            />
          </div>

          {analysis.codeAnalysis.issues && analysis.codeAnalysis.issues.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Issues:</p>
              <div className="space-y-2">
                {analysis.codeAnalysis.issues.slice(0, 5).map((issue: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm p-2 rounded bg-muted"
                  >
                    <Badge variant={issue.type === 'error' ? 'destructive' : 'secondary'}>
                      {issue.type}
                    </Badge>
                    <span className="flex-1">{issue.message}</span>
                    <span className="text-muted-foreground">Line {issue.line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Analysis */}
      {analysis.imageAnalysis && analysis.imageAnalysis.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Image Analysis</h4>
          {analysis.imageAnalysis[0].labels && (
            <div className="flex flex-wrap gap-2">
              {analysis.imageAnalysis[0].labels.slice(0, 10).map((label: any, i: number) => (
                <Badge key={i} variant="secondary">
                  {label.label} ({Math.round(label.confidence * 100)}%)
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audio/Video Analysis */}
      {(analysis.audioAnalysis || analysis.videoAnalysis) && (
        <div>
          <h4 className="font-medium mb-3">Media Analysis</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatItem
              label="Duration"
              value={formatDuration(analysis.audioAnalysis?.duration || analysis.videoAnalysis?.duration)}
            />
            {analysis.videoAnalysis && (
              <>
                <StatItem
                  label="Resolution"
                  value={`${analysis.videoAnalysis.width}x${analysis.videoAnalysis.height}`}
                />
                <StatItem
                  label="Frame Rate"
                  value={`${analysis.videoAnalysis.frameRate} fps`}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataContent({ metadata }: { metadata: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <MetadataItem label="File Name" value={metadata.name} />
        <MetadataItem label="File Size" value={formatFileSize(metadata.size)} />
        <MetadataItem label="File Type" value={metadata.type} />
        <MetadataItem label="Extension" value={metadata.extension} />
        <MetadataItem label="Category" value={metadata.category} />
        <MetadataItem
          label="Last Modified"
          value={metadata.lastModified ? new Date(metadata.lastModified).toLocaleString() : 'N/A'}
        />
        <MetadataItem
          label="Uploaded"
          value={metadata.uploadedAt ? new Date(metadata.uploadedAt).toLocaleString() : 'N/A'}
        />
      </div>

      {metadata.dimensions && (
        <div>
          <h4 className="font-medium mb-2">Dimensions</h4>
          <p className="text-sm text-muted-foreground">
            {metadata.dimensions.width} x {metadata.dimensions.height}
          </p>
        </div>
      )}

      {metadata.duration && (
        <div>
          <h4 className="font-medium mb-2">Duration</h4>
          <p className="text-sm text-muted-foreground">
            {formatDuration(metadata.duration)}
          </p>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 rounded-lg bg-muted">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value ?? 'N/A'}</p>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium truncate">{value ?? 'N/A'}</p>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return 'N/A';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
