/**
 * Unified Content Pipeline
 * Orchestrates the flow: Files → Processing → AI → Artifacts → MCP
 */

import { createFile, updateFile, createFileProcessingResult } from './files';
import { createArtifact, linkArtifactToConversation } from './artifacts';
import { executeMCPAction, classifyIntent, getUserMCPConnections, getMCPServers } from './mcp';
import {
  inferArtifactType,
  extractCodeFromText,
  generateArtifactTitle,
} from './ai-helpers';
import type {
  ContentPipelineInput,
  ContentPipelineResult,
  File,
  Artifact,
  MCPExecutionResult,
  FileCategory,
} from '@/types/content';

/**
 * Main content pipeline processor
 * Handles the complete flow from input to artifacts and MCP execution
 */
export async function processContent(
  input: ContentPipelineInput
): Promise<ContentPipelineResult> {
  const startTime = Date.now();

  try {
    let file: File | undefined;
    let fileProcessing: any | undefined;
    let artifact: Artifact | undefined;
    let mcpResults: MCPExecutionResult[] = [];

    // Step 1: Handle file upload and processing
    if (input.type === 'file') {
      const fileSource = input.source as File;

      // Create file record
      file = await createFile({
        userId: input.userId,
        fileName: fileSource.fileName,
        fileType: fileSource.fileType,
        fileSize: fileSource.fileSize,
        category: fileSource.category,
        extension: fileSource.extension,
        storageUrl: fileSource.storageUrl,
        checksum: fileSource.checksum,
      });

      // Process file (simplified - in production, use background workers)
      fileProcessing = await processFile(file, input.options);

      // Update file with processing results
      await updateFile(file.id, {
        textContent: fileProcessing.textContent,
        thumbnailUrl: fileProcessing.thumbnailUrl,
        status: 'completed',
      });
    }

    // Step 2: Generate artifact from processed content (if enabled)
    if (input.options?.generateArtifact) {
      const content =
        input.type === 'file'
          ? fileProcessing?.textContent || ''
          : input.type === 'text'
          ? (input.source as string)
          : '';

      if (content) {
        const artifactType = inferArtifactType(content);
        const code = extractCodeFromText(content);
        const title = generateArtifactTitle(content, artifactType);

        artifact = await createArtifact({
          userId: input.userId,
          title,
          description: `Generated from ${input.type}`,
          type: artifactType,
          language: getLanguageForType(artifactType),
          content: code || content,
          isPublic: false,
        });

        // Link to conversation if provided
        if (input.conversationId && artifact) {
          await linkArtifactToConversation(artifact.id, input.conversationId);
        }
      }
    }

    // Step 3: Trigger MCP operations (if specified)
    if (input.options?.triggerMCP && input.options.triggerMCP.length > 0) {
      const connections = await getUserMCPConnections(input.userId);

      for (const serverId of input.options.triggerMCP) {
        const connection = connections.find((c) => c.serverId === serverId);

        if (connection) {
          const result = await executeMCPAction({
            serverId,
            action: 'process-content',
            parameters: {
              content: artifact?.content || fileProcessing?.textContent || '',
              metadata: {
                fileName: file?.fileName,
                artifactId: artifact?.id,
              },
            },
            userId: input.userId,
          });

          mcpResults.push(result);
        }
      }
    }

    return {
      success: true,
      file,
      fileProcessing,
      artifact,
      mcpResults: mcpResults.length > 0 ? mcpResults : undefined,
      processingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Content processing failed',
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * AI-powered content understanding
 * Analyzes content and generates artifacts based on context
 */
export async function analyzeContentWithAI(params: {
  content: string;
  userId: string;
  conversationId?: string;
  files?: File[];
  contextArtifacts?: Artifact[];
}): Promise<{
  summary?: string;
  suggestedArtifacts?: Array<{ type: string; title: string; content: string }>;
  mcpActions?: Array<{ serverId: string; action: string; reason: string }>;
}> {
  // In production, this would call actual AI models
  // For now, return structured suggestions

  const analysis = {
    summary: `Analyzed content: ${params.content.substring(0, 100)}...`,
    suggestedArtifacts: [] as Array<{ type: string; title: string; content: string }>,
    mcpActions: [] as Array<{ serverId: string; action: string; reason: string }>,
  };

  // Detect code patterns and suggest artifacts
  if (params.content.includes('function') || params.content.includes('const')) {
    analysis.suggestedArtifacts.push({
      type: 'javascript',
      title: 'Extracted JavaScript Code',
      content: extractCodeFromText(params.content),
    });
  }

  // Detect MCP triggers
  const servers = await getMCPServers();
  const intents = classifyIntent(params.content, servers);

  for (const intent of intents) {
    if (intent.confidence > 0.7) {
      analysis.mcpActions.push({
        serverId: intent.serverId,
        action: intent.action,
        reason: `Detected intent with ${(intent.confidence * 100).toFixed(0)}% confidence`,
      });
    }
  }

  return analysis;
}

/**
 * Smart routing - determines best AI model for content
 */
export function selectAIModel(params: {
  content: string;
  hasCode: boolean;
  hasFiles: boolean;
  hasMCP: boolean;
}): string {
  // Code-heavy content
  if (params.hasCode) {
    return 'gpt-4-turbo'; // Good for code
  }

  // File analysis
  if (params.hasFiles) {
    return 'claude-3-opus'; // Good for document analysis
  }

  // MCP operations
  if (params.hasMCP) {
    return 'gpt-4'; // Good for structured operations
  }

  // Default
  return 'gpt-3.5-turbo';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Process file (simplified version)
 * In production, this would call specialized processors based on file type
 */
async function processFile(
  file: File,
  options?: any
): Promise<{
  textContent?: string;
  thumbnailUrl?: string;
  analysis?: any;
}> {
  // Simplified processing
  const result: any = {
    textContent: null,
    thumbnailUrl: null,
    analysis: {
      category: file.category,
      fileType: file.fileType,
    },
  };

  // In production, call appropriate processor based on category
  switch (file.category) {
    case 'document':
      result.textContent = 'Extracted text from document...';
      break;
    case 'image':
      result.thumbnailUrl = file.storageUrl;
      result.analysis.imageAnalysis = {
        labels: ['detected', 'objects'],
      };
      break;
    case 'code':
      result.textContent = 'Source code content...';
      result.analysis.codeAnalysis = {
        language: file.extension,
        functions: 10,
      };
      break;
  }

  return result;
}

function getLanguageForType(type: string): any {
  const map: Record<string, string> = {
    'python-script': 'python',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'react-component': 'tsx',
  };
  return map[type] || 'javascript';
}
