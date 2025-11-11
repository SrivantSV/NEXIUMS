/**
 * React Hooks for Artifacts Management
 */

'use client';

import { useState, useEffect } from 'react';
import type {
  Artifact,
  ArtifactType,
  ExecutionResult,
  ExecutionInput,
  ArtifactVersion,
} from '@/types/content';

/**
 * Hook to fetch and manage a single artifact
 */
export function useArtifact(id: string | null) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchArtifact = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/artifacts/${id}`);
        const result = await response.json();

        if (result.success) {
          setArtifact(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch artifact');
      } finally {
        setLoading(false);
      }
    };

    fetchArtifact();
  }, [id]);

  return { artifact, loading, error };
}

/**
 * Hook to fetch list of artifacts
 */
export function useArtifacts(params?: {
  type?: ArtifactType;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    const fetchArtifacts = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (params?.type) queryParams.set('type', params.type);
        if (params?.search) queryParams.set('search', params.search);
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.limit) queryParams.set('limit', params.limit.toString());

        const response = await fetch(`/api/artifacts?${queryParams}`);
        const result = await response.json();

        if (result.success) {
          setArtifacts(result.data.items);
          setMeta(result.data.meta);
        } else {
          setError(result.error.message);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch artifacts');
      } finally {
        setLoading(false);
      }
    };

    fetchArtifacts();
  }, [params?.type, params?.search, params?.page, params?.limit]);

  return { artifacts, loading, error, meta };
}

/**
 * Hook to create an artifact
 */
export function useCreateArtifact() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createArtifact = async (data: {
    title: string;
    description?: string;
    type: ArtifactType;
    language: string;
    content: string;
    dependencies?: string[];
    metadata?: any;
    tags?: string[];
    isPublic?: boolean;
  }): Promise<Artifact | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        setError(result.error.message);
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create artifact');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createArtifact, loading, error };
}

/**
 * Hook to update an artifact
 */
export function useUpdateArtifact(id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateArtifact = async (updates: {
    title?: string;
    description?: string;
    content?: string;
    dependencies?: string[];
    metadata?: any;
    tags?: string[];
    isPublic?: boolean;
    versionMessage?: string;
  }): Promise<Artifact | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/artifacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        setError(result.error.message);
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update artifact');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateArtifact, loading, error };
}

/**
 * Hook to execute an artifact
 */
export function useExecuteArtifact(id: string) {
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [execution, setExecution] = useState<ExecutionResult | null>(null);

  const executeArtifact = async (input?: ExecutionInput): Promise<ExecutionResult | null> => {
    setExecuting(true);
    setError(null);

    try {
      const response = await fetch(`/api/artifacts/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      const result = await response.json();

      if (result.success) {
        setExecution(result.data);
        return result.data;
      } else {
        setError(result.error.message);
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute artifact');
      return null;
    } finally {
      setExecuting(false);
    }
  };

  return { executeArtifact, executing, execution, error };
}

/**
 * Hook to poll execution status
 */
export function useExecutionStatus(executionId: string | null, pollInterval = 2000) {
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!executionId) return;

    let intervalId: NodeJS.Timeout;

    const fetchExecution = async () => {
      try {
        const response = await fetch(`/api/executions/${executionId}`);
        const result = await response.json();

        if (result.success) {
          setExecution(result.data);

          // Stop polling if execution is complete
          if (['completed', 'failed', 'timeout', 'cancelled'].includes(result.data.status)) {
            clearInterval(intervalId);
          }
        } else {
          setError(result.error.message);
          clearInterval(intervalId);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch execution status');
        clearInterval(intervalId);
      }
    };

    // Initial fetch
    setLoading(true);
    fetchExecution().finally(() => setLoading(false));

    // Poll for updates
    intervalId = setInterval(fetchExecution, pollInterval);

    return () => clearInterval(intervalId);
  }, [executionId, pollInterval]);

  return { execution, loading, error };
}

/**
 * Hook to manage artifact versions
 */
export function useArtifactVersions(artifactId: string | null) {
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artifactId) return;

    const fetchVersions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/artifacts/${artifactId}/versions`);
        const result = await response.json();

        if (result.success) {
          setVersions(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch versions');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [artifactId]);

  return { versions, loading, error };
}
