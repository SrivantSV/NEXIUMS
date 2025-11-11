'use client';

import { useState, useEffect } from 'react';
import { TeamWorkspace, TeamMember, WorkspaceInvitation } from '@/types/collaboration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamMembers } from './TeamMembers';
import { TeamOverview } from './TeamOverview';
import { TeamSettings } from './TeamSettings';
import { WorkspaceHeader } from './WorkspaceHeader';

interface TeamDashboardProps {
  workspaceId: string;
}

export function TeamDashboard({ workspaceId }: TeamDashboardProps) {
  const [workspace, setWorkspace] = useState<TeamWorkspace | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspace();
  }, [workspaceId]);

  const loadWorkspace = async () => {
    try {
      // Fetch workspace data
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      const data = await response.json();

      if (data.success) {
        setWorkspace(data.data);
        setMembers(data.data.members || []);
        setInvitations(data.data.invitations || []);
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWorkspace = async (updates: Partial<TeamWorkspace>) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setWorkspace(data.data);
      }
    } catch (error) {
      console.error('Failed to update workspace:', error);
    }
  };

  const updateWorkspaceSettings = async (settings: any) => {
    await updateWorkspace({ settings });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading workspace...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Not Found</CardTitle>
            <CardDescription>
              The workspace you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Workspace Header */}
      <WorkspaceHeader workspace={workspace} onUpdate={updateWorkspace} />

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <TeamOverview workspace={workspace} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <TeamMembers
            workspaceId={workspaceId}
            members={members}
            invitations={invitations}
            onMembersChange={setMembers}
            onInvitationsChange={setInvitations}
          />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Manage your team's projects and collaborations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Projects feature coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channels</CardTitle>
              <CardDescription>
                Organize team conversations into channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Channels feature coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <TeamSettings workspace={workspace} onUpdate={updateWorkspaceSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
