/**
 * Content Pipeline - Unified Integration Layer
 * Coordinates all systems (Files, Artifacts, AI, MCP, Projects, Teams, Analytics, Billing)
 */

export interface ContentPipelineOptions {
  userId: string;
  projectId?: string;
  teamId?: string;
  conversationId?: string;

  // Feature flags
  generateArtifact?: boolean;
  analyzeWithAI?: boolean;
  triggerMCP?: string[]; // MCP servers to trigger
  saveToProject?: boolean;
  notifyTeam?: boolean;
  trackAnalytics?: boolean;
  trackBilling?: boolean;
}

export interface PipelineResult {
  success: boolean;
  file?: any;
  artifact?: any;
  aiAnalysis?: string;
  mcpResults?: Array<{ server: string; result: any }>;
  projectMemory?: any;
  cost?: number;
  error?: string;
}

/**
 * Process uploaded file through complete pipeline
 */
export async function processFileUpload(
  file: File,
  options: ContentPipelineOptions
): Promise<PipelineResult> {
  const result: PipelineResult = { success: false };

  try {
    // 1. Upload and store file
    const formData = new FormData();
    formData.append('file', file);
    if (options.projectId) formData.append('projectId', options.projectId);
    if (options.conversationId) formData.append('conversationId', options.conversationId);

    const fileResponse = await fetch('/api/files', {
      method: 'POST',
      body: formData,
    });

    if (!fileResponse.ok) {
      throw new Error('File upload failed');
    }

    const fileData = await fileResponse.json();
    result.file = fileData.data;

    let totalCost = 0;

    // 2. AI Analysis (if enabled)
    if (options.analyzeWithAI && result.file) {
      const analysisResponse = await fetch(`/api/files/${result.file.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: options.projectId,
        }),
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        result.aiAnalysis = analysisData.data?.analysis;
        totalCost += analysisData.data?.cost || 0;
      }
    }

    // 3. Generate Artifact (if enabled and file is code/document)
    if (options.generateArtifact && result.file && shouldGenerateArtifact(result.file)) {
      const artifactResponse = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Generated from ${result.file.fileName}`,
          type: inferArtifactType(result.file),
          language: inferLanguage(result.file),
          content: result.aiAnalysis || '',
          sourceFileId: result.file.id,
          projectId: options.projectId,
        }),
      });

      if (artifactResponse.ok) {
        const artifactData = await artifactResponse.json();
        result.artifact = artifactData.data;
      }
    }

    // 4. Trigger MCP Operations (if specified)
    if (options.triggerMCP && options.triggerMCP.length > 0) {
      result.mcpResults = [];

      for (const server of options.triggerMCP) {
        const mcpResponse = await fetch('/api/mcp/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverId: server,
            action: 'process-file',
            parameters: {
              fileId: result.file.id,
              fileName: result.file.fileName,
              analysis: result.aiAnalysis,
            },
          }),
        });

        if (mcpResponse.ok) {
          const mcpData = await mcpResponse.json();
          result.mcpResults.push({
            server,
            result: mcpData.data,
          });
        }
      }
    }

    // 5. Save to Project Memory (if project specified)
    if (options.saveToProject && options.projectId && result.file) {
      await fetch(`/api/projects/${options.projectId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `File uploaded: ${result.file.fileName}. ${result.aiAnalysis || ''}`,
          type: 'context',
          importance: 0.8,
          metadata: {
            fileId: result.file.id,
            artifactId: result.artifact?.id,
          },
        }),
      });
    }

    // 6. Notify Team (if team specified)
    if (options.notifyTeam && options.teamId) {
      await fetch(`/api/workspaces/${options.teamId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'file_uploaded',
          message: `${file.name} has been uploaded and processed`,
          metadata: {
            fileId: result.file.id,
            artifactId: result.artifact?.id,
          },
        }),
      });
    }

    // 7. Track Analytics
    if (options.trackAnalytics) {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{
            event: 'file_processed',
            properties: {
              fileType: result.file.fileType,
              fileSize: result.file.fileSize,
              hasAIAnalysis: !!result.aiAnalysis,
              hasArtifact: !!result.artifact,
              mcpServersUsed: options.triggerMCP?.length || 0,
            },
          }],
        }),
      });
    }

    // 8. Track Billing
    if (options.trackBilling && totalCost > 0) {
      await fetch('/api/billing/usage/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: options.userId,
          type: 'file_processing',
          cost: totalCost,
          metadata: {
            fileId: result.file.id,
            operations: {
              aiAnalysis: !!result.aiAnalysis,
              artifactGeneration: !!result.artifact,
              mcpOperations: result.mcpResults?.length || 0,
            },
          },
        }),
      });
    }

    result.cost = totalCost;
    result.success = true;
  } catch (error: any) {
    result.error = error.message;
    result.success = false;
  }

  return result;
}

/**
 * Process chat message through complete pipeline
 */
export async function processChatMessage(
  message: string,
  options: ContentPipelineOptions
): Promise<PipelineResult> {
  const result: PipelineResult = { success: false };

  try {
    // 1. Detect code in message and create artifact
    if (containsCode(message) && options.generateArtifact) {
      const code = extractCode(message);
      const language = detectLanguage(code);

      const artifactResponse = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Code from chat`,
          type: inferTypeFromLanguage(language),
          language,
          content: code,
          projectId: options.projectId,
        }),
      });

      if (artifactResponse.ok) {
        const artifactData = await artifactResponse.json();
        result.artifact = artifactData.data;
      }
    }

    // 2. Detect intents and trigger MCP
    if (options.triggerMCP) {
      const intents = await detectIntents(message);

      result.mcpResults = [];

      for (const intent of intents) {
        if (intent.confidence > 0.7 && options.triggerMCP.includes(intent.server)) {
          const mcpResponse = await fetch('/api/mcp/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serverId: intent.server,
              action: intent.action,
              parameters: intent.parameters,
            }),
          });

          if (mcpResponse.ok) {
            const mcpData = await mcpResponse.json();
            result.mcpResults.push({
              server: intent.server,
              result: mcpData.data,
            });
          }
        }
      }
    }

    // 3. Save to project memory
    if (options.saveToProject && options.projectId) {
      await fetch(`/api/projects/${options.projectId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          type: 'context',
          importance: 0.6,
          metadata: {
            artifactId: result.artifact?.id,
            mcpResults: result.mcpResults?.length,
          },
        }),
      });
    }

    result.success = true;
  } catch (error: any) {
    result.error = error.message;
    result.success = false;
  }

  return result;
}

// Helper functions
function shouldGenerateArtifact(file: any): boolean {
  const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php'];
  const docExtensions = ['.md', '.txt', '.doc', '.docx'];

  return codeExtensions.some(ext => file.fileName.endsWith(ext)) ||
         docExtensions.some(ext => file.fileName.endsWith(ext));
}

function inferArtifactType(file: any): string {
  const ext = file.fileName.split('.').pop()?.toLowerCase();

  const typeMap: Record<string, string> = {
    'js': 'javascript-code',
    'ts': 'typescript-code',
    'py': 'python-script',
    'java': 'java-code',
    'md': 'markdown-document',
    'txt': 'text-document',
  };

  return typeMap[ext || ''] || 'text-document';
}

function inferLanguage(file: any): string {
  const ext = file.fileName.split('.').pop()?.toLowerCase();

  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust',
  };

  return langMap[ext || ''] || 'plaintext';
}

function containsCode(message: string): boolean {
  return /```[\s\S]*```/.test(message) || /`[^`]+`/.test(message);
}

function extractCode(message: string): string {
  const codeBlockMatch = message.match(/```(?:\w+)?\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }

  const inlineCodeMatch = message.match(/`([^`]+)`/);
  if (inlineCodeMatch) {
    return inlineCodeMatch[1];
  }

  return message;
}

function detectLanguage(code: string): string {
  if (code.includes('function') || code.includes('const') || code.includes('let')) return 'javascript';
  if (code.includes('def ') || code.includes('import ')) return 'python';
  if (code.includes('public class') || code.includes('private ')) return 'java';
  if (code.includes('package main') || code.includes('func ')) return 'go';

  return 'plaintext';
}

function inferTypeFromLanguage(language: string): string {
  const typeMap: Record<string, string> = {
    'javascript': 'javascript-code',
    'typescript': 'typescript-code',
    'python': 'python-script',
    'java': 'java-code',
  };

  return typeMap[language] || 'text-document';
}

async function detectIntents(message: string): Promise<Array<{
  server: string;
  action: string;
  parameters: any;
  confidence: number;
}>> {
  // Simple intent detection - in production, use ML model
  const intents = [];

  if (message.toLowerCase().includes('github') || message.toLowerCase().includes('repository')) {
    intents.push({
      server: 'github',
      action: 'search-code',
      parameters: { query: message },
      confidence: 0.8,
    });
  }

  if (message.toLowerCase().includes('slack') || message.toLowerCase().includes('message')) {
    intents.push({
      server: 'slack',
      action: 'send-message',
      parameters: { text: message },
      confidence: 0.75,
    });
  }

  return intents;
}
