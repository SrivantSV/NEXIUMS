'use client';

import { useProjectStore } from '@/lib/stores/project-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectAnalyticsProps {
  projectId: string;
}

export function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const { projects } = useProjectStore();
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal Completion Rate</CardTitle>
            <CardDescription>Progress towards completing project goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {project.performance.goalsTotal > 0
                ? Math.round(
                    (project.performance.goalsCompleted / project.performance.goalsTotal) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {project.performance.goalsCompleted} of {project.performance.goalsTotal} goals completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collaboration Score</CardTitle>
            <CardDescription>Team collaboration effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{project.performance.collaborationScore}</div>
            <p className="text-xs text-muted-foreground mt-2">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Productivity Score</CardTitle>
            <CardDescription>Overall project productivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{project.performance.productivityScore}</div>
            <p className="text-xs text-muted-foreground mt-2">Out of 100</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Project activity and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Conversations</p>
              <p className="text-2xl font-bold">{project.usage.totalConversations}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Artifacts</p>
              <p className="text-2xl font-bold">{project.usage.totalArtifacts}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Files</p>
              <p className="text-2xl font-bold">{project.usage.totalFiles}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Users</p>
              <p className="text-2xl font-bold">{project.usage.activeCollaborators}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Topics */}
      {project.usage.popularTopics && project.usage.popularTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Topics</CardTitle>
            <CardDescription>Most discussed topics in this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.usage.popularTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{topic.topic}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{topic.count} mentions</span>
                    {topic.trending && (
                      <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                        Trending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Statistics</CardTitle>
          <CardDescription>Project knowledge and memory metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Architecture Decisions</p>
              <p className="text-2xl font-bold">{project.memory.architecture.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Key Insights</p>
              <p className="text-2xl font-bold">{project.memory.keyInsights.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Requirements</p>
              <p className="text-2xl font-bold">{project.memory.requirements.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Patterns Identified</p>
              <p className="text-2xl font-bold">{project.memory.patterns.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Learnings</p>
              <p className="text-2xl font-bold">{project.memory.learnings.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Concepts</p>
              <p className="text-2xl font-bold">{project.memory.concepts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
