'use client';

import { TeamWorkspace } from '@/types/collaboration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderKanban, MessageSquare, Activity } from 'lucide-react';

interface TeamOverviewProps {
  workspace: TeamWorkspace;
}

export function TeamOverview({ workspace }: TeamOverviewProps) {
  const stats = [
    {
      title: 'Team Members',
      value: workspace.usage.members,
      icon: Users,
      description: `${workspace.quotas.maxMembers === -1 ? 'Unlimited' : workspace.quotas.maxMembers} max`,
    },
    {
      title: 'Projects',
      value: workspace.usage.projects,
      icon: FolderKanban,
      description: `${workspace.quotas.maxProjects === -1 ? 'Unlimited' : workspace.quotas.maxProjects} max`,
    },
    {
      title: 'Conversations',
      value: workspace.usage.conversations,
      icon: MessageSquare,
      description: 'Total conversations',
    },
    {
      title: 'Artifacts',
      value: workspace.usage.artifacts,
      icon: Activity,
      description: 'Generated artifacts',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold">Workspace Overview</h3>
        <p className="text-sm text-muted-foreground mt-1">
          View your workspace statistics and activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    </div>
  );
}
