'use client';

/**
 * Content Context
 * Unified context for Artifacts, Files, and MCP integrations
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// ARTIFACTS
// ============================================================================

export interface Artifact {
  id: string;
  userId: string;
  title: string;
  type: string;
  language: string;
  content: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactExecution {
  id: string;
  artifactId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  executionTime?: number;
  createdAt: string;
  completedAt?: string;
}

// ============================================================================
// FILES
// ============================================================================

export interface FileUpload {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  storageUrl: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface FileProcessingResult {
  id: string;
  fileId: string;
  processedContent: any;
  extractedText?: string;
  metadata: Record<string, any>;
  processingTime: number;
  createdAt: string;
}

// ============================================================================
// MCP (Model Context Protocol)
// ============================================================================

export interface MCPServer {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  status: 'available' | 'unavailable';
  description: string;
}

export interface MCPConnection {
  id: string;
  userId: string;
  serverId: string;
  status: 'connected' | 'disconnected' | 'error';
  credentials?: Record<string, any>;
  lastUsed?: string;
  createdAt: string;
}

export interface MCPExecution {
  id: string;
  userId: string;
  serverId: string;
  action: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  status: 'pending' | 'completed' | 'failed';
  executionTime?: number;
  createdAt: string;
}

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

interface ContentContextType {
  // === ARTIFACTS ===
  artifacts: Artifact[];
  loadingArtifacts: boolean;
  createArtifact: (data: Omit<Artifact, 'id' | 'userId' | 'version' | 'createdAt' | 'updatedAt'>) => Promise<Artifact | null>;
  updateArtifact: (id: string, data: Partial<Artifact>) => Promise<boolean>;
  deleteArtifact: (id: string) => Promise<boolean>;
  executeArtifact: (id: string) => Promise<ArtifactExecution | null>;
  getArtifactExecution: (executionId: string) => Promise<ArtifactExecution | null>;

  // === FILES ===
  files: FileUpload[];
  loadingFiles: boolean;
  uploadFile: (file: File, metadata?: Record<string, any>) => Promise<FileUpload | null>;
  deleteFile: (id: string) => Promise<boolean>;
  processFile: (id: string, options?: Record<string, any>) => Promise<FileProcessingResult | null>;
  getFileProcessingResult: (fileId: string) => Promise<FileProcessingResult | null>;

  // === MCP ===
  mcpServers: MCPServer[];
  mcpConnections: MCPConnection[];
  loadingMCP: boolean;
  connectMCPServer: (serverId: string, credentials?: Record<string, any>) => Promise<MCPConnection | null>;
  disconnectMCPServer: (connectionId: string) => Promise<boolean>;
  executeMCPAction: (serverId: string, action: string, parameters: Record<string, any>) => Promise<MCPExecution | null>;
  getMCPExecution: (executionId: string) => Promise<MCPExecution | null>;

  // === UNIFIED SEARCH ===
  searchContent: (query: string, types?: ('artifact' | 'file' | 'mcp')[]) => Promise<any[]>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  // State
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(true);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [mcpServers, setMCPServers] = useState<MCPServer[]>([]);
  const [mcpConnections, setMCPConnections] = useState<MCPConnection[]>([]);
  const [loadingMCP, setLoadingMCP] = useState(true);

  const supabase = createClient();

  // ========================================================================
  // ARTIFACTS
  // ========================================================================

  const loadArtifacts = useCallback(async () => {
    try {
      setLoadingArtifacts(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading artifacts:', error);
        return;
      }

      setArtifacts((data || []).map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        title: a.title,
        type: a.type,
        language: a.language,
        content: a.content,
        version: a.version,
        status: a.status,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })));
    } catch (error) {
      console.error('Error in loadArtifacts:', error);
    } finally {
      setLoadingArtifacts(false);
    }
  }, [supabase]);

  const createArtifact = useCallback(async (data: Omit<Artifact, 'id' | 'userId' | 'version' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) return null;

      const { data: artifact } = await response.json();
      setArtifacts(prev => [artifact, ...prev]);
      return artifact;
    } catch (error) {
      console.error('Error creating artifact:', error);
      return null;
    }
  }, []);

  const updateArtifact = useCallback(async (id: string, data: Partial<Artifact>) => {
    try {
      const response = await fetch(`/api/artifacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) return false;

      const { data: updated } = await response.json();
      setArtifacts(prev => prev.map(a => a.id === id ? updated : a));
      return true;
    } catch (error) {
      console.error('Error updating artifact:', error);
      return false;
    }
  }, []);

  const deleteArtifact = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/artifacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) return false;

      setArtifacts(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting artifact:', error);
      return false;
    }
  }, []);

  const executeArtifact = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/artifacts/${id}/execute`, {
        method: 'POST',
      });

      if (!response.ok) return null;

      const { data: execution } = await response.json();
      return execution;
    } catch (error) {
      console.error('Error executing artifact:', error);
      return null;
    }
  }, []);

  const getArtifactExecution = useCallback(async (executionId: string) => {
    try {
      const response = await fetch(`/api/artifacts/executions/${executionId}`);

      if (!response.ok) return null;

      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting execution:', error);
      return null;
    }
  }, []);

  // ========================================================================
  // FILES
  // ========================================================================

  const loadFiles = useCallback(async () => {
    try {
      setLoadingFiles(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading files:', error);
        return;
      }

      setFiles((data || []).map((f: any) => ({
        id: f.id,
        userId: f.user_id,
        fileName: f.file_name,
        fileType: f.file_type,
        fileSize: f.file_size,
        category: f.category,
        storageUrl: f.storage_url,
        status: f.status,
        metadata: f.metadata,
        createdAt: f.created_at,
      })));
    } catch (error) {
      console.error('Error in loadFiles:', error);
    } finally {
      setLoadingFiles(false);
    }
  }, [supabase]);

  const uploadFile = useCallback(async (file: File, metadata?: Record<string, any>) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) return null;

      const { data: uploaded } = await response.json();
      setFiles(prev => [uploaded, ...prev]);
      return uploaded;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }, []);

  const deleteFile = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) return false;

      setFiles(prev => prev.filter(f => f.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }, []);

  const processFile = useCallback(async (id: string, options?: Record<string, any>) => {
    try {
      const response = await fetch(`/api/files/${id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      });

      if (!response.ok) return null;

      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing file:', error);
      return null;
    }
  }, []);

  const getFileProcessingResult = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/processing`);

      if (!response.ok) return null;

      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting processing result:', error);
      return null;
    }
  }, []);

  // ========================================================================
  // MCP
  // ========================================================================

  const loadMCPServers = useCallback(async () => {
    try {
      const response = await fetch('/api/mcp/servers');

      if (!response.ok) return;

      const { data } = await response.json();
      setMCPServers(data || []);
    } catch (error) {
      console.error('Error loading MCP servers:', error);
    }
  }, []);

  const loadMCPConnections = useCallback(async () => {
    try {
      setLoadingMCP(true);
      const response = await fetch('/api/mcp/connections');

      if (!response.ok) return;

      const { data } = await response.json();
      setMCPConnections(data || []);
    } catch (error) {
      console.error('Error loading MCP connections:', error);
    } finally {
      setLoadingMCP(false);
    }
  }, []);

  const connectMCPServer = useCallback(async (serverId: string, credentials?: Record<string, any>) => {
    try {
      const response = await fetch('/api/mcp/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, credentials }),
      });

      if (!response.ok) return null;

      const { data: connection } = await response.json();
      setMCPConnections(prev => [connection, ...prev]);
      return connection;
    } catch (error) {
      console.error('Error connecting MCP server:', error);
      return null;
    }
  }, []);

  const disconnectMCPServer = useCallback(async (connectionId: string) => {
    try {
      const response = await fetch(`/api/mcp/connections/${connectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) return false;

      setMCPConnections(prev => prev.filter(c => c.id !== connectionId));
      return true;
    } catch (error) {
      console.error('Error disconnecting MCP server:', error);
      return false;
    }
  }, []);

  const executeMCPAction = useCallback(async (serverId: string, action: string, parameters: Record<string, any>) => {
    try {
      const response = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, action, parameters }),
      });

      if (!response.ok) return null;

      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error executing MCP action:', error);
      return null;
    }
  }, []);

  const getMCPExecution = useCallback(async (executionId: string) => {
    try {
      const response = await fetch(`/api/mcp/executions/${executionId}`);

      if (!response.ok) return null;

      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting MCP execution:', error);
      return null;
    }
  }, []);

  // ========================================================================
  // UNIFIED SEARCH
  // ========================================================================

  const searchContent = useCallback(async (query: string, types?: ('artifact' | 'file' | 'mcp')[]) => {
    try {
      const params = new URLSearchParams({ q: query });
      if (types && types.length > 0) {
        params.append('types', types.join(','));
      }

      const response = await fetch(`/api/search?${params}`);

      if (!response.ok) return [];

      const { data } = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error searching content:', error);
      return [];
    }
  }, []);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    loadArtifacts();
    loadFiles();
    loadMCPServers();
    loadMCPConnections();
  }, [loadArtifacts, loadFiles, loadMCPServers, loadMCPConnections]);

  // ========================================================================
  // VALUE
  // ========================================================================

  const value: ContentContextType = {
    artifacts,
    loadingArtifacts,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    executeArtifact,
    getArtifactExecution,
    files,
    loadingFiles,
    uploadFile,
    deleteFile,
    processFile,
    getFileProcessingResult,
    mcpServers,
    mcpConnections,
    loadingMCP,
    connectMCPServer,
    disconnectMCPServer,
    executeMCPAction,
    getMCPExecution,
    searchContent,
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}
