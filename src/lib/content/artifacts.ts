/**
 * Artifact Management Utilities
 * Provides server-side functions for artifact creation, execution, and management
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Artifact,
  ArtifactType,
  Language,
  ExecutionInput,
  ExecutionResult,
  ExecutionStatus,
  ArtifactVersion,
} from '@/types/content';

/**
 * Create a new artifact
 */
export async function createArtifact(data: {
  userId: string;
  title: string;
  description?: string;
  type: ArtifactType;
  language: Language;
  content: string;
  dependencies?: string[];
  metadata?: any;
  tags?: string[];
  isPublic?: boolean;
}): Promise<Artifact> {
  const supabase = await createClient();

  const { data: artifact, error } = await supabase
    .from('artifacts')
    .insert({
      user_id: data.userId,
      title: data.title,
      description: data.description,
      type: data.type,
      language: data.language,
      content: data.content,
      dependencies: data.dependencies || [],
      metadata: data.metadata || {},
      tags: data.tags || [],
      is_public: data.isPublic || false,
      version: 1,
    })
    .select()
    .single();

  if (error) throw error;

  return transformArtifact(artifact);
}

/**
 * Get artifact by ID
 */
export async function getArtifact(id: string): Promise<Artifact | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  return transformArtifact(data);
}

/**
 * List artifacts with filters
 */
export async function listArtifacts(params: {
  userId?: string;
  type?: ArtifactType;
  search?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ items: Artifact[]; total: number }> {
  const supabase = await createClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase.from('artifacts').select('*', { count: 'exact' });

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  if (params.type) {
    query = query.eq('type', params.type);
  }

  if (params.isPublic !== undefined) {
    query = query.eq('is_public', params.isPublic);
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    items: data.map(transformArtifact),
    total: count || 0,
  };
}

/**
 * Update artifact
 */
export async function updateArtifact(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    content: string;
    dependencies: string[];
    metadata: any;
    tags: string[];
    isPublic: boolean;
    versionMessage: string;
  }>
): Promise<Artifact> {
  const supabase = await createClient();

  // Get current artifact
  const existing = await getArtifact(id);
  if (!existing) throw new Error('Artifact not found');

  const updateData: any = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.dependencies !== undefined) updateData.dependencies = updates.dependencies;
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

  // If content changed, create new version
  if (updates.content && updates.content !== existing.content) {
    const newVersion = existing.version + 1;
    updateData.content = updates.content;
    updateData.version = newVersion;

    // Create version record
    await supabase.from('artifact_versions').insert({
      artifact_id: id,
      version: newVersion,
      content: updates.content,
      message: updates.versionMessage || 'Update',
      created_by: existing.userId,
    });
  }

  const { data, error } = await supabase
    .from('artifacts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return transformArtifact(data);
}

/**
 * Delete artifact
 */
export async function deleteArtifact(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('artifacts').delete().eq('id', id);

  if (error) throw error;
}

/**
 * Get artifact versions
 */
export async function getArtifactVersions(artifactId: string): Promise<ArtifactVersion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*')
    .eq('artifact_id', artifactId)
    .order('version', { ascending: false });

  if (error) throw error;

  return data.map(transformArtifactVersion);
}

/**
 * Revert artifact to a specific version
 */
export async function revertArtifactVersion(
  artifactId: string,
  versionId: string
): Promise<Artifact> {
  const supabase = await createClient();

  // Get the version to revert to
  const { data: version, error: versionError } = await supabase
    .from('artifact_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (versionError) throw versionError;

  // Get current artifact
  const artifact = await getArtifact(artifactId);
  if (!artifact) throw new Error('Artifact not found');

  // Create new version with reverted content
  const newVersion = artifact.version + 1;

  await supabase.from('artifact_versions').insert({
    artifact_id: artifactId,
    version: newVersion,
    content: version.content,
    message: `Reverted to version ${version.version}`,
    created_by: artifact.userId,
  });

  // Update artifact
  const { data: updated, error: updateError } = await supabase
    .from('artifacts')
    .update({
      content: version.content,
      version: newVersion,
    })
    .eq('id', artifactId)
    .select()
    .single();

  if (updateError) throw updateError;

  return transformArtifact(updated);
}

/**
 * Execute artifact
 */
export async function executeArtifact(
  artifactId: string,
  userId: string,
  input?: ExecutionInput
): Promise<ExecutionResult> {
  const supabase = await createClient();

  // Create execution record
  const { data: execution, error } = await supabase
    .from('executions')
    .insert({
      artifact_id: artifactId,
      user_id: userId,
      status: 'queued' as ExecutionStatus,
      input: input || {},
    })
    .select()
    .single();

  if (error) throw error;

  // In a real implementation, this would trigger background processing
  // For now, return the queued execution
  return transformExecution(execution);
}

/**
 * Get execution result
 */
export async function getExecution(id: string): Promise<ExecutionResult | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('executions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  return transformExecution(data);
}

/**
 * List executions for an artifact
 */
export async function listExecutions(params: {
  artifactId?: string;
  userId?: string;
  status?: ExecutionStatus;
  page?: number;
  limit?: number;
}): Promise<{ items: ExecutionResult[]; total: number }> {
  const supabase = await createClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase.from('executions').select('*', { count: 'exact' });

  if (params.artifactId) {
    query = query.eq('artifact_id', params.artifactId);
  }

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error, count } = await query
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    items: data.map(transformExecution),
    total: count || 0,
  };
}

/**
 * Link artifact to conversation
 */
export async function linkArtifactToConversation(
  artifactId: string,
  conversationId: string
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('conversation_artifacts').insert({
    conversation_id: conversationId,
    artifact_id: artifactId,
  });
}

/**
 * Get artifacts for conversation
 */
export async function getConversationArtifacts(conversationId: string): Promise<Artifact[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('conversation_artifacts')
    .select('artifact_id, artifacts(*)')
    .eq('conversation_id', conversationId);

  if (error) throw error;

  return data.map((item: any) => transformArtifact(item.artifacts));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformArtifact(data: any): Artifact {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description,
    type: data.type as ArtifactType,
    language: data.language as Language,
    content: data.content,
    dependencies: data.dependencies || [],
    metadata: data.metadata || {},
    version: data.version,
    tags: data.tags || [],
    isPublic: data.is_public,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function transformArtifactVersion(data: any): ArtifactVersion {
  return {
    id: data.id,
    artifactId: data.artifact_id,
    version: data.version,
    content: data.content,
    diff: data.diff,
    message: data.message,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
  };
}

function transformExecution(data: any): ExecutionResult {
  return {
    id: data.id,
    artifactId: data.artifact_id,
    userId: data.user_id,
    status: data.status as ExecutionStatus,
    output: data.output,
    error: data.error,
    exitCode: data.exit_code,
    stdout: data.stdout,
    stderr: data.stderr,
    duration: data.duration,
    resourceUsage: data.resource_usage,
    startedAt: new Date(data.started_at),
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
  };
}
