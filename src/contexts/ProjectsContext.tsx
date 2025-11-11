'use client';

/**
 * Projects & Memory Context
 * Manages project workspaces and long-term memory across conversations
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  conversationCount?: number;
  artifactCount?: number;
  fileCount?: number;
}

export interface Memory {
  id: string;
  projectId: string;
  type: 'fact' | 'preference' | 'context' | 'reference';
  content: string;
  metadata: Record<string, any>;
  importance: number;
  createdAt: string;
}

export interface MemorySearchResult {
  memory: Memory;
  relevance: number;
  context?: string;
}

interface ProjectsContextType {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  loadingProjects: boolean;

  // Project actions
  createProject: (data: { name: string; description?: string; settings?: Record<string, any> }) => Promise<Project | null>;
  updateProject: (id: string, data: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  setCurrentProject: (project: Project | null) => void;
  switchProject: (projectId: string) => Promise<boolean>;

  // Memory
  memories: Memory[];
  loadingMemories: boolean;

  // Memory actions
  addMemory: (projectId: string, data: Omit<Memory, 'id' | 'createdAt'>) => Promise<Memory | null>;
  searchMemories: (query: string, projectId?: string) => Promise<MemorySearchResult[]>;
  getRelevantMemories: (context: string, projectId?: string, limit?: number) => Promise<Memory[]>;
  deleteMemory: (id: string) => Promise<boolean>;

  // Stats
  getProjectStats: (projectId: string) => Promise<{
    conversationCount: number;
    artifactCount: number;
    fileCount: number;
    memoryCount: number;
  } | null>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const supabase = createClient();

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProjects([]);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      const projectsData = (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        description: p.description,
        settings: p.settings || {},
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      setProjects(projectsData);

      // Auto-select first project if none selected
      if (!currentProject && projectsData.length > 0) {
        setCurrentProjectState(projectsData[0]);
      }
    } catch (error) {
      console.error('Error in loadProjects:', error);
    } finally {
      setLoadingProjects(false);
    }
  }, [supabase, currentProject]);

  // Load memories for current project
  const loadMemories = useCallback(async (projectId: string) => {
    try {
      setLoadingMemories(true);
      const { data, error } = await supabase
        .from('project_memories')
        .select('*')
        .eq('project_id', projectId)
        .order('importance', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading memories:', error);
        return;
      }

      const memoriesData = (data || []).map((m: any) => ({
        id: m.id,
        projectId: m.project_id,
        type: m.type,
        content: m.content,
        metadata: m.metadata || {},
        importance: m.importance || 0,
        createdAt: m.created_at,
      }));

      setMemories(memoriesData);
    } catch (error) {
      console.error('Error in loadMemories:', error);
    } finally {
      setLoadingMemories(false);
    }
  }, [supabase]);

  // Create project
  const createProject = useCallback(async (data: { name: string; description?: string; settings?: Record<string, any> }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description || null,
          settings: data.settings || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return null;
      }

      const newProject: Project = {
        id: project.id,
        userId: project.user_id,
        name: project.name,
        description: project.description,
        settings: project.settings || {},
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      };

      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error('Error in createProject:', error);
      return null;
    }
  }, [supabase]);

  // Update project
  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: data.name,
          description: data.description,
          settings: data.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating project:', error);
        return false;
      }

      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      if (currentProject?.id === id) {
        setCurrentProjectState(prev => prev ? { ...prev, ...data } : null);
      }
      return true;
    } catch (error) {
      console.error('Error in updateProject:', error);
      return false;
    }
  }, [supabase, currentProject]);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting project:', error);
        return false;
      }

      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProjectState(null);
      }
      return true;
    } catch (error) {
      console.error('Error in deleteProject:', error);
      return false;
    }
  }, [supabase, currentProject]);

  // Set current project
  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      loadMemories(project.id);
    } else {
      setMemories([]);
    }
  }, [loadMemories]);

  // Switch project
  const switchProject = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      return true;
    }
    return false;
  }, [projects, setCurrentProject]);

  // Add memory
  const addMemory = useCallback(async (projectId: string, data: Omit<Memory, 'id' | 'createdAt'>) => {
    try {
      const { data: memory, error } = await supabase
        .from('project_memories')
        .insert({
          project_id: projectId,
          type: data.type,
          content: data.content,
          metadata: data.metadata || {},
          importance: data.importance || 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding memory:', error);
        return null;
      }

      const newMemory: Memory = {
        id: memory.id,
        projectId: memory.project_id,
        type: memory.type,
        content: memory.content,
        metadata: memory.metadata || {},
        importance: memory.importance || 0,
        createdAt: memory.created_at,
      };

      if (projectId === currentProject?.id) {
        setMemories(prev => [newMemory, ...prev]);
      }

      return newMemory;
    } catch (error) {
      console.error('Error in addMemory:', error);
      return null;
    }
  }, [supabase, currentProject]);

  // Search memories
  const searchMemories = useCallback(async (query: string, projectId?: string) => {
    try {
      const response = await fetch('/api/memories/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          projectId: projectId || currentProject?.id,
        }),
      });

      if (!response.ok) return [];

      const { data } = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }, [currentProject]);

  // Get relevant memories
  const getRelevantMemories = useCallback(async (context: string, projectId?: string, limit = 10) => {
    try {
      const response = await fetch('/api/memories/relevant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          projectId: projectId || currentProject?.id,
          limit,
        }),
      });

      if (!response.ok) return [];

      const { data } = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error getting relevant memories:', error);
      return [];
    }
  }, [currentProject]);

  // Delete memory
  const deleteMemory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_memories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting memory:', error);
        return false;
      }

      setMemories(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (error) {
      console.error('Error in deleteMemory:', error);
      return false;
    }
  }, [supabase]);

  // Get project stats
  const getProjectStats = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/stats`);
      if (!response.ok) return null;

      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting project stats:', error);
      return null;
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load memories when project changes
  useEffect(() => {
    if (currentProject) {
      loadMemories(currentProject.id);
    }
  }, [currentProject, loadMemories]);

  const value: ProjectsContextType = {
    projects,
    currentProject,
    loadingProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    switchProject,
    memories,
    loadingMemories,
    addMemory,
    searchMemories,
    getRelevantMemories,
    deleteMemory,
    getProjectStats,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}
