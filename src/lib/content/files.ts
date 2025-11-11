/**
 * File Management Utilities
 * Provides server-side functions for file upload, processing, and search
 */

import { createClient } from '@/lib/supabase/server';
import type {
  File,
  FileCategory,
  FileStatus,
  FileProcessingResult,
  SearchFilters,
  SearchResult,
} from '@/types/content';

/**
 * Create file record
 */
export async function createFile(data: {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: FileCategory;
  extension: string;
  storageUrl: string;
  checksum: string;
}): Promise<File> {
  const supabase = await createClient();

  const { data: file, error } = await supabase
    .from('files')
    .insert({
      user_id: data.userId,
      file_name: data.fileName,
      file_type: data.fileType,
      file_size: data.fileSize,
      category: data.category,
      extension: data.extension,
      storage_url: data.storageUrl,
      checksum: data.checksum,
      status: 'processing' as FileStatus,
    })
    .select()
    .single();

  if (error) throw error;

  return transformFile(file);
}

/**
 * Get file by ID
 */
export async function getFile(id: string): Promise<File | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  return transformFile(data);
}

/**
 * List files with filters
 */
export async function listFiles(params: {
  userId?: string;
  category?: FileCategory;
  search?: string;
  status?: FileStatus;
  page?: number;
  limit?: number;
}): Promise<{ items: File[]; total: number }> {
  const supabase = await createClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase.from('files').select('*', { count: 'exact' });

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  if (params.category) {
    query = query.eq('category', params.category);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.search) {
    query = query.or(`file_name.ilike.%${params.search}%,text_content.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    items: data.map(transformFile),
    total: count || 0,
  };
}

/**
 * Update file
 */
export async function updateFile(
  id: string,
  updates: Partial<{
    fileName: string;
    textContent: string;
    thumbnailUrl: string;
    status: FileStatus;
    error: string;
  }>
): Promise<File> {
  const supabase = await createClient();

  const updateData: any = {};
  if (updates.fileName !== undefined) updateData.file_name = updates.fileName;
  if (updates.textContent !== undefined) updateData.text_content = updates.textContent;
  if (updates.thumbnailUrl !== undefined) updateData.thumbnail_url = updates.thumbnailUrl;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.error !== undefined) updateData.error = updates.error;

  const { data, error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return transformFile(data);
}

/**
 * Delete file
 */
export async function deleteFile(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('files').delete().eq('id', id);

  if (error) throw error;
}

/**
 * Create file processing result
 */
export async function createFileProcessingResult(data: {
  fileId: string;
  processedData: any;
  analysis: any;
  preview?: any;
  securityScan: any;
  processingTime: number;
  status: FileStatus;
}): Promise<FileProcessingResult> {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from('file_processing_results')
    .insert({
      file_id: data.fileId,
      processed_data: data.processedData,
      analysis: data.analysis,
      preview: data.preview,
      security_scan: data.securityScan,
      processing_time: data.processingTime,
      status: data.status,
    })
    .select()
    .single();

  if (error) throw error;

  return transformProcessingResult(result);
}

/**
 * Get file processing result
 */
export async function getFileProcessingResult(
  fileId: string
): Promise<FileProcessingResult | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('file_processing_results')
    .select('*')
    .eq('file_id', fileId)
    .single();

  if (error) return null;

  return transformProcessingResult(data);
}

/**
 * Link file to conversation
 */
export async function linkFileToConversation(
  fileId: string,
  conversationId: string
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('conversation_files').insert({
    conversation_id: conversationId,
    file_id: fileId,
  });
}

/**
 * Get files for conversation
 */
export async function getConversationFiles(conversationId: string): Promise<File[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('conversation_files')
    .select('file_id, files(*)')
    .eq('conversation_id', conversationId);

  if (error) throw error;

  return data.map((item: any) => transformFile(item.files));
}

/**
 * Search across files (hybrid search)
 */
export async function searchFiles(params: {
  userId: string;
  query: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
}): Promise<{ results: SearchResult[]; total: number }> {
  const supabase = await createClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('files')
    .select('*', { count: 'exact' })
    .eq('user_id', params.userId);

  // Apply filters
  if (params.filters?.fileType) {
    query = query.eq('file_type', params.filters.fileType);
  }

  if (params.filters?.category) {
    query = query.eq('category', params.filters.category);
  }

  if (params.filters?.dateFrom) {
    query = query.gte('created_at', params.filters.dateFrom.toISOString());
  }

  if (params.filters?.dateTo) {
    query = query.lte('created_at', params.filters.dateTo.toISOString());
  }

  // Text search
  query = query.or(
    `file_name.ilike.%${params.query}%,text_content.ilike.%${params.query}%`
  );

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const results: SearchResult[] = data.map((file: any) => ({
    id: file.id,
    type: 'file' as const,
    title: file.file_name,
    description: file.text_content?.substring(0, 200),
    snippet: extractSnippet(file.text_content, params.query),
    score: calculateScore(file, params.query),
    metadata: {
      category: file.category,
      fileSize: file.file_size,
      fileType: file.file_type,
    },
    createdAt: new Date(file.created_at),
  }));

  return {
    results,
    total: count || 0,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformFile(data: any): File {
  return {
    id: data.id,
    userId: data.user_id,
    fileName: data.file_name,
    fileType: data.file_type,
    fileSize: data.file_size,
    category: data.category as FileCategory,
    extension: data.extension,
    storageUrl: data.storage_url,
    thumbnailUrl: data.thumbnail_url,
    checksum: data.checksum,
    textContent: data.text_content,
    status: data.status as FileStatus,
    error: data.error,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function transformProcessingResult(data: any): FileProcessingResult {
  return {
    id: data.id,
    fileId: data.file_id,
    processedData: data.processed_data,
    analysis: data.analysis,
    preview: data.preview,
    securityScan: data.security_scan,
    processingTime: data.processing_time,
    status: data.status as FileStatus,
    error: data.error,
    createdAt: new Date(data.created_at),
  };
}

function extractSnippet(text: string | null, query: string): string {
  if (!text) return '';

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text.substring(0, 150) + '...';

  const start = Math.max(0, index - 75);
  const end = Math.min(text.length, index + query.length + 75);

  return (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
}

function calculateScore(file: any, query: string): number {
  let score = 0;

  const lowerQuery = query.toLowerCase();
  const lowerFileName = file.file_name.toLowerCase();
  const lowerText = (file.text_content || '').toLowerCase();

  // Exact match in filename (highest score)
  if (lowerFileName === lowerQuery) score += 100;
  // Filename contains query
  else if (lowerFileName.includes(lowerQuery)) score += 50;

  // Text content contains query
  if (lowerText.includes(lowerQuery)) {
    const occurrences = (lowerText.match(new RegExp(lowerQuery, 'g')) || []).length;
    score += Math.min(occurrences * 5, 50);
  }

  // Recency bonus (files from last 30 days)
  const age = Date.now() - new Date(file.created_at).getTime();
  const days = age / (1000 * 60 * 60 * 24);
  if (days < 30) score += 10;

  return score;
}
