// Project Store using Zustand
// Manages project state and operations

import { create } from 'zustand';
import { Project, ProjectTemplate, ProjectGoal, ProjectInsight } from '@/types/projects';

interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  templates: ProjectTemplate[];
  loading: boolean;
  error: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  archiveProject: (projectId: string) => void;

  // Template actions
  setTemplates: (templates: ProjectTemplate[]) => void;
  createFromTemplate: (template: ProjectTemplate, customData?: Partial<Project>) => Project;

  // Goal management
  addGoal: (projectId: string, goal: ProjectGoal) => void;
  updateGoal: (projectId: string, goalId: string, updates: Partial<ProjectGoal>) => void;
  deleteGoal: (projectId: string, goalId: string) => void;

  // Insight management
  addInsight: (projectId: string, insight: ProjectInsight) => void;
  dismissInsight: (projectId: string, insightId: string) => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  currentProject: null,
  templates: [],
  loading: false,
  error: null,
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...initialState,

  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => set({ currentProject: project }),

  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),

  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
      currentProject:
        state.currentProject?.id === projectId
          ? { ...state.currentProject, ...updates, updatedAt: new Date() }
          : state.currentProject,
    })),

  deleteProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProject:
        state.currentProject?.id === projectId ? null : state.currentProject,
    })),

  archiveProject: (projectId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, status: 'archived' as const, archivedAt: new Date() }
          : p
      ),
    })),

  setTemplates: (templates) => set({ templates }),

  createFromTemplate: (template, customData = {}) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: customData.name || template.name,
      description: customData.description || template.description,
      type: template.category,
      status: 'active',
      visibility: 'private',
      techStack: template.techStack,
      goals: template.goals?.map((title, index) => ({
        id: `goal-${index}`,
        title,
        description: '',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(),
      })) || [],
      milestones: [],
      timeline: {
        startDate: new Date(),
        milestones: [],
        phases: [],
      },
      owner: customData.owner || 'current-user',
      collaborators: [],
      permissions: template.defaultPermissions || {
        canEdit: [],
        canView: [],
        canDelete: [],
        canInvite: [],
        isPublic: false,
      },
      conversations: [],
      artifacts: [],
      files: [],
      notes: [],
      tags: [],
      memory: {
        architecture: [],
        codebase: {
          structure: [],
          mainTechnologies: [],
          architecturalPatterns: [],
          conventions: [],
          dependencies: [],
          entryPoints: [],
        },
        designSystem: [],
        requirements: [],
        decisions: [],
        conversationSummaries: [],
        keyInsights: [],
        patterns: [],
        learnings: [],
        concepts: [],
        relationships: [],
        embeddings: [],
      },
      usage: {
        totalConversations: 0,
        totalArtifacts: 0,
        totalFiles: 0,
        activeCollaborators: 1,
        lastWeekActivity: [],
        popularTopics: [],
      },
      performance: {
        goalsCompleted: 0,
        goalsTotal: template.goals?.length || 0,
        milestonesCompleted: 0,
        milestonesTotal: 0,
        collaborationScore: 100,
        productivityScore: 100,
      },
      insights: [],
      mcpConnections: [],
      externalRepos: [],
      deployments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
      template,
      ...customData,
    };

    get().addProject(newProject);
    return newProject;
  },

  addGoal: (projectId, goal) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              goals: [...p.goals, goal],
              performance: {
                ...p.performance,
                goalsTotal: p.performance.goalsTotal + 1,
              },
            }
          : p
      ),
    })),

  updateGoal: (projectId, goalId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              goals: p.goals.map((g) =>
                g.id === goalId ? { ...g, ...updates } : g
              ),
              performance: {
                ...p.performance,
                goalsCompleted:
                  updates.status === 'completed'
                    ? p.performance.goalsCompleted + 1
                    : p.performance.goalsCompleted,
              },
            }
          : p
      ),
    })),

  deleteGoal: (projectId, goalId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              goals: p.goals.filter((g) => g.id !== goalId),
              performance: {
                ...p.performance,
                goalsTotal: p.performance.goalsTotal - 1,
              },
            }
          : p
      ),
    })),

  addInsight: (projectId, insight) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, insights: [...p.insights, insight] }
          : p
      ),
    })),

  dismissInsight: (projectId, insightId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              insights: p.insights.map((i) =>
                i.id === insightId ? { ...i, dismissedAt: new Date() } : i
              ),
            }
          : p
      ),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
