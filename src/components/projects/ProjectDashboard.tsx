'use client';

import { useState } from 'react';
import { Project } from '@/types/projects';
import { useProject } from '@/lib/hooks/use-project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProjectOverview } from './ProjectOverview';
import { ProjectMemory } from './ProjectMemory';
import { ProjectAnalytics } from './ProjectAnalytics';
import { ProjectSettings } from './ProjectSettings';

interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const { project, update, archive, generateInsights, exportProject } = useProject(projectId);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const handleGenerateInsights = async () => {
    setLoading(true);
    await generateInsights();
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
              {project.type}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                project.status === 'active'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : project.status === 'paused'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                  : project.status === 'completed'
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
              }`}
            >
              {project.status}
            </span>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGenerateInsights} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Insights'}
          </Button>
          <Button variant="outline" onClick={exportProject}>
            Export
          </Button>
          <Button variant="destructive" onClick={archive}>
            Archive
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.performance.goalsCompleted}/{project.performance.goalsTotal}
            </div>
            <p className="text-xs text-muted-foreground">
              {project.performance.goalsTotal > 0
                ? `${Math.round(
                    (project.performance.goalsCompleted / project.performance.goalsTotal) * 100
                  )}% complete`
                : 'No goals set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.usage.totalConversations}</div>
            <p className="text-xs text-muted-foreground">Total discussions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.collaborators.length + 1}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.performance.productivityScore}</div>
            <p className="text-xs text-muted-foreground">Overall score</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ProjectOverview project={project} />
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <ProjectMemory projectId={projectId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ProjectAnalytics projectId={projectId} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <ProjectSettings project={project} onUpdate={update} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
