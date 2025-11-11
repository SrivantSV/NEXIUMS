// Custom hook for project management
import { useCallback } from 'react';
import { useProjectStore } from '../stores/project-store';
import { Project, ProjectInsight } from '@/types/projects';

export function useProject(projectId?: string) {
  const {
    projects,
    currentProject,
    setCurrentProject,
    updateProject,
    archiveProject: archiveProjectAction,
    addInsight,
    dismissInsight,
  } = useProjectStore();

  // Get project by ID or use current project
  const project = projectId
    ? projects.find((p) => p.id === projectId)
    : currentProject;

  // Update project
  const update = useCallback(
    (updates: Partial<Project>) => {
      if (project) {
        updateProject(project.id, updates);
      }
    },
    [project, updateProject]
  );

  // Archive project
  const archive = useCallback(() => {
    if (project) {
      archiveProjectAction(project.id);
    }
  }, [project, archiveProjectAction]);

  // Generate insights for project
  const generateInsights = useCallback(async () => {
    if (!project) return [];

    const insights: ProjectInsight[] = [];

    // Insight: Low activity
    const daysSinceActivity = Math.floor(
      (Date.now() - project.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity > 7) {
      insights.push({
        id: `insight-${Date.now()}-activity`,
        type: 'warning',
        title: 'Low Activity',
        description: `This project hasn't been active in ${daysSinceActivity} days`,
        actionable: ['Resume work', 'Archive project'],
        priority: 'medium',
        createdAt: new Date(),
      });
    }

    // Insight: Goals completion rate
    const completionRate =
      project.performance.goalsTotal > 0
        ? (project.performance.goalsCompleted / project.performance.goalsTotal) * 100
        : 0;
    if (completionRate < 50 && project.performance.goalsTotal > 0) {
      insights.push({
        id: `insight-${Date.now()}-goals`,
        type: 'suggestion',
        title: 'Goal Completion',
        description: `Only ${completionRate.toFixed(0)}% of goals completed`,
        actionable: ['Review goals', 'Adjust timeline'],
        priority: 'medium',
        createdAt: new Date(),
      });
    }

    // Insight: No collaborators
    if (project.collaborators.length === 0 && project.type !== 'custom') {
      insights.push({
        id: `insight-${Date.now()}-collab`,
        type: 'suggestion',
        title: 'Add Collaborators',
        description: 'This project has no collaborators',
        actionable: ['Invite team members'],
        priority: 'low',
        createdAt: new Date(),
      });
    }

    // Add insights to project
    for (const insight of insights) {
      addInsight(project.id, insight);
    }

    return insights;
  }, [project, addInsight]);

  // Export project
  const exportProject = useCallback(async () => {
    if (!project) return;

    const exportData = {
      ...project,
      exportedAt: new Date(),
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-')}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);

  return {
    project,
    update,
    archive,
    generateInsights,
    exportProject,
  };
}
