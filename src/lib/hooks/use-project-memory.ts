// Custom hook for project memory management
import { useCallback, useState } from 'react';
import { useProjectStore } from '../stores/project-store';
import { sharedMemoryManager } from '../memory/memory-manager';

export interface ProjectMemoryData {
  architecture: any[];
  decisions: any[];
  requirements: any[];
  insights: any[];
  patterns: any[];
  learnings: any[];
  conceptGraph: any[];
}

export function useProjectMemory(projectId: string) {
  const { projects, updateProject } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const project = projects.find((p) => p.id === projectId);

  // Search memory
  const searchMemory = useCallback(
    async (query: string) => {
      if (!project) return [];

      setLoading(true);
      setError(null);

      try {
        const results = await sharedMemoryManager.identifyPatterns(
          project.owner,
          projectId,
          'month'
        );
        return results;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search memory');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [project, projectId]
  );

  // Update memory
  const updateMemory = useCallback(
    async (type: string, data: any) => {
      if (!project) return;

      setLoading(true);
      setError(null);

      try {
        await sharedMemoryManager.updateMemory(
          {
            type: 'project',
            content: data,
            metadata: {
              userId: project.owner,
              projectId,
              timestamp: new Date(),
              importance: 0.8,
              category: type,
            },
          },
          project.owner
        );

        // Update local project state
        const updatedMemory = { ...project.memory };

        switch (type) {
          case 'architecture':
            updatedMemory.architecture = [...updatedMemory.architecture, data];
            break;
          case 'decision':
            updatedMemory.decisions = [...updatedMemory.decisions, data];
            break;
          case 'requirement':
            updatedMemory.requirements = [...updatedMemory.requirements, data];
            break;
          case 'insight':
            updatedMemory.keyInsights = [...updatedMemory.keyInsights, data];
            break;
          case 'pattern':
            updatedMemory.patterns = [...updatedMemory.patterns, data];
            break;
          case 'learning':
            updatedMemory.learnings = [...updatedMemory.learnings, data];
            break;
        }

        updateProject(projectId, { memory: updatedMemory });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update memory');
      } finally {
        setLoading(false);
      }
    },
    [project, projectId, updateProject]
  );

  // Export memory
  const exportMemory = useCallback(
    async () => {
      if (!project) return;

      setLoading(true);
      setError(null);

      try {
        const memoryData = await sharedMemoryManager.exportMemory(
          project.owner,
          projectId
        );

        // Create blob and download
        const blob = new Blob([JSON.stringify(memoryData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '-')}-memory.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to export memory');
      } finally {
        setLoading(false);
      }
    },
    [project, projectId]
  );

  // Get memory data
  const getMemoryData = useCallback((): ProjectMemoryData => {
    if (!project) {
      return {
        architecture: [],
        decisions: [],
        requirements: [],
        insights: [],
        patterns: [],
        learnings: [],
        conceptGraph: [],
      };
    }

    return {
      architecture: project.memory.architecture || [],
      decisions: project.memory.decisions || [],
      requirements: project.memory.requirements || [],
      insights: project.memory.keyInsights || [],
      patterns: project.memory.patterns || [],
      learnings: project.memory.learnings || [],
      conceptGraph: project.memory.relationships || [],
    };
  }, [project]);

  return {
    memoryData: getMemoryData(),
    searchMemory,
    updateMemory,
    exportMemory,
    loading,
    error,
  };
}
