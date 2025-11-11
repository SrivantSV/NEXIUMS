'use client';

import { useState } from 'react';
import { TeamMember, WorkspaceInvitation, TeamRole } from '@/types/collaboration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreVertical, Mail, X, RefreshCw } from 'lucide-react';
import { InviteMemberDialog } from './InviteMemberDialog';
import { formatRelativeTime } from '@/lib/utils';

interface TeamMembersProps {
  workspaceId: string;
  members: TeamMember[];
  invitations: WorkspaceInvitation[];
  onMembersChange: (members: TeamMember[]) => void;
  onInvitationsChange: (invitations: WorkspaceInvitation[]) => void;
}

export function TeamMembers({
  workspaceId,
  members,
  invitations,
  onMembersChange,
  onInvitationsChange,
}: TeamMembersProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const handleInvite = async (data: { email: string; roleId: string; message?: string }) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        onInvitationsChange([...invitations, result.data]);
        setShowInviteDialog(false);
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        onMembersChange(members.filter((m) => m.userId !== userId));
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleUpdateRole = async (userId: string, roleId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      });

      const result = await response.json();

      if (result.success) {
        const updatedMembers = members.map((m) =>
          m.userId === userId ? result.data : m
        );
        onMembersChange(updatedMembers);
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/invitations/${invitationId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (result.success) {
        onInvitationsChange(invitations.filter((i) => i.id !== invitationId));
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/invitations/${invitationId}/resend`,
        { method: 'POST' }
      );

      const result = await response.json();

      if (result.success) {
        const updatedInvitations = invitations.map((i) =>
          i.id === invitationId ? result.data : i
        );
        onInvitationsChange(updatedInvitations);
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your team members and their permissions
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Pending Invitations */}
      {invitations.filter((i) => i.status === 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pending Invitations ({invitations.filter((i) => i.status === 'pending').length})
            </CardTitle>
            <CardDescription>
              Invitations waiting to be accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations
                .filter((i) => i.status === 'pending')
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Invited {formatRelativeTime(invitation.invitedAt)} • Expires{' '}
                          {formatRelativeTime(invitation.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{invitation.role.name}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleResendInvitation(invitation.id)}
                        title="Resend invitation"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        title="Cancel invitation"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${member.userId}`} />
                      <AvatarFallback>
                        {member.userId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(
                        member.status
                      )}`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">User {member.userId.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {formatRelativeTime(member.joinedAt)} • Last active{' '}
                      {formatRelativeTime(member.lastActiveAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">{member.role.name}</Badge>
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'outline'}
                  >
                    {member.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members yet. Invite your team to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <InviteMemberDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onInvite={handleInvite}
        workspaceId={workspaceId}
      />
    </div>
  );
}
