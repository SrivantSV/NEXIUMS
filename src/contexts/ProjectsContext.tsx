'use client';

/**
 * Projects Context
 * Manages project state, memory, and context across the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  settings?: {
    defaultModel?: string;
    temperature?: number;
    maxTokens?: number;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemory {
  id: string;
  projectId: string;
  content: string;
  type: 'fact' | 'preference' | 'context' | 'skill';
  importance: number;
  embedding?: number[];
  createdAt: string;
}

interface ProjectsContextType {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // Project operations
  setCurrentProject: (projectId: string | null) => void;
  createProject: (data: Partial<Project>) => Promise<Project | null>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  refreshProjects: () => Promise<void>;

  // Memory operations
  addMemory: (projectId: string, memory: Partial<ProjectMemory>) => Promise<boolean>;
  searchMemory: (projectId: string, query: string) => Promise<ProjectMemory[]>;
  getProjectContext: (projectId: string) => Promise<string>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setProjects([]);
      setCurrentProjectState(null);
      setLoading(false);
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/projects', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      setProjects(data.data || []);

      // Load saved current project from localStorage
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId) {
        const project = (data.data || []).find((p: Project) => p.id === savedProjectId);
        if (project) {
          setCurrentProjectState(project);
        }
      }
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentProject = useCallback((projectId: string | null) => {
    if (!projectId) {
      setCurrentProjectState(null);
      localStorage.removeItem('currentProjectId');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProjectState(project);
      localStorage.setItem('currentProjectId', projectId);
    }
  }, [projects]);

  const createProject = async (data: Partial<Project>): Promise<Project | null> => {
    if (!user) return null;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const result = await response.json();
      const newProject = result.data;

      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message);
      return null;
    }
  };

  const updateProject = async (projectId: string, data: Partial<Project>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const result = await response.json();
      const updatedProject = result.data;

      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));

      if (currentProject?.id === projectId) {
        setCurrentProjectState(updatedProject);
      }

      return true;
    } catch (err: any) {
      console.error('Error updating project:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.id !== projectId));

      if (currentProject?.id === projectId) {
        setCurrentProjectState(null);
        localStorage.removeItem('currentProjectId');
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message);
      return false;
    }
  };

  const refreshProjects = async () => {
    await loadProjects();
  };

  const addMemory = async (projectId: string, memory: Partial<ProjectMemory>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memory),
      });

      if (!response.ok) {
        throw new Error('Failed to add memory');
      }

      return true;
    } catch (err: any) {
      console.error('Error adding memory:', err);
      setError(err.message);
      return false;
    }
  };

  const searchMemory = async (projectId: string, query: string): Promise<ProjectMemory[]> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/memory/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error('Failed to search memory');
      }

      const result = await response.json();
      return result.data || [];
    } catch (err: any) {
      console.error('Error searching memory:', err);
      setError(err.message);
      return [];
    }
  };

  const getProjectContext = async (projectId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/context`);

      if (!response.ok) {
        throw new Error('Failed to get project context');
      }

      const result = await response.json();
      return result.data?.context || '';
    } catch (err: any) {
      console.error('Error getting project context:', err);
      setError(err.message);
      return '';
    }
  };

  const value: ProjectsContextType = {
    projects,
    currentProject,
    loading,
    error,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
    addMemory,
    searchMemory,
    getProjectContext,
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
