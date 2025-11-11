import {
  TeamMember,
  TeamRole,
  WorkspaceInvitation,
  ApiResponse,
} from '@/types/collaboration';
import { generateId, generateToken } from '@/lib/utils';

/**
 * MemberManager - Manages team members and invitations
 */
export class MemberManager {
  private members: Map<string, TeamMember> = new Map();
  private invitations: Map<string, WorkspaceInvitation> = new Map();

  /**
   * Add member to workspace
   */
  async addMember(data: {
    userId: string;
    workspaceId: string;
    role: TeamRole;
  }): Promise<ApiResponse<TeamMember>> {
    try {
      // Check if member already exists
      const existingMember = await this.getMemberByUser(
        data.workspaceId,
        data.userId
      );

      if (existingMember.success) {
        return {
          success: false,
          error: {
            code: 'MEMBER_EXISTS',
            message: 'User is already a member',
          },
        };
      }

      const member: TeamMember = {
        userId: data.userId,
        workspaceId: data.workspaceId,
        role: data.role,
        permissions: data.role.permissions,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        status: 'active',
        preferences: {
          showPresence: true,
          showActivity: true,
          enableRealTimeEditing: true,
          cursorColor: this.getRandomColor(),
          timezone: 'UTC',
        },
        notificationSettings: {
          email: true,
          slack: false,
          inApp: true,
          mentions: true,
          directMessages: true,
          channelMessages: true,
          teamUpdates: true,
        },
        availability: {
          status: 'available',
        },
      };

      const memberId = `${data.workspaceId}:${data.userId}`;
      this.members.set(memberId, member);

      return {
        success: true,
        data: member,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to add member',
        },
      };
    }
  }

  /**
   * Get member by user ID
   */
  async getMemberByUser(
    workspaceId: string,
    userId: string
  ): Promise<ApiResponse<TeamMember>> {
    const memberId = `${workspaceId}:${userId}`;
    const member = this.members.get(memberId);

    if (!member) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Member not found',
        },
      };
    }

    return {
      success: true,
      data: member,
    };
  }

  /**
   * Get all members in workspace
   */
  async getWorkspaceMembers(
    workspaceId: string
  ): Promise<ApiResponse<TeamMember[]>> {
    const members = Array.from(this.members.values()).filter(
      (m) => m.workspaceId === workspaceId
    );

    return {
      success: true,
      data: members,
    };
  }

  /**
   * Update member
   */
  async updateMember(
    workspaceId: string,
    userId: string,
    updates: Partial<TeamMember>
  ): Promise<ApiResponse<TeamMember>> {
    const memberId = `${workspaceId}:${userId}`;
    const member = this.members.get(memberId);

    if (!member) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Member not found',
        },
      };
    }

    const updatedMember: TeamMember = {
      ...member,
      ...updates,
    };

    this.members.set(memberId, updatedMember);

    return {
      success: true,
      data: updatedMember,
    };
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: TeamRole
  ): Promise<ApiResponse<TeamMember>> {
    return this.updateMember(workspaceId, userId, {
      role,
      permissions: role.permissions,
    });
  }

  /**
   * Remove member from workspace
   */
  async removeMember(
    workspaceId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    const memberId = `${workspaceId}:${userId}`;
    const member = this.members.get(memberId);

    if (!member) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Member not found',
        },
      };
    }

    this.members.delete(memberId);

    return {
      success: true,
    };
  }

  /**
   * Update member activity
   */
  async updateMemberActivity(
    workspaceId: string,
    userId: string
  ): Promise<void> {
    const memberId = `${workspaceId}:${userId}`;
    const member = this.members.get(memberId);

    if (member) {
      member.lastActiveAt = new Date();
      this.members.set(memberId, member);
    }
  }

  /**
   * Create invitation
   */
  async createInvitation(data: {
    workspaceId: string;
    email: string;
    role: TeamRole;
    invitedBy: string;
    message?: string;
    expiresInDays?: number;
  }): Promise<ApiResponse<WorkspaceInvitation>> {
    try {
      // Check if invitation already exists
      const existing = await this.getInvitationByEmail(
        data.workspaceId,
        data.email
      );

      if (existing.success && existing.data?.status === 'pending') {
        return {
          success: false,
          error: {
            code: 'INVITATION_EXISTS',
            message: 'An invitation has already been sent to this email',
          },
        };
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

      const invitation: WorkspaceInvitation = {
        id: generateId('inv'),
        workspaceId: data.workspaceId,
        email: data.email,
        role: data.role,
        invitedBy: data.invitedBy,
        invitedAt: new Date(),
        expiresAt,
        status: 'pending',
        token: generateToken(),
        message: data.message,
      };

      this.invitations.set(invitation.id, invitation);

      return {
        success: true,
        data: invitation,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create invitation',
        },
      };
    }
  }

  /**
   * Get invitation by ID
   */
  async getInvitation(
    invitationId: string
  ): Promise<ApiResponse<WorkspaceInvitation>> {
    const invitation = this.invitations.get(invitationId);

    if (!invitation) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        },
      };
    }

    return {
      success: true,
      data: invitation,
    };
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(
    token: string
  ): Promise<ApiResponse<WorkspaceInvitation>> {
    const invitation = Array.from(this.invitations.values()).find(
      (inv) => inv.token === token
    );

    if (!invitation) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        },
      };
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      this.invitations.set(invitation.id, invitation);

      return {
        success: false,
        error: {
          code: 'EXPIRED',
          message: 'Invitation has expired',
        },
      };
    }

    return {
      success: true,
      data: invitation,
    };
  }

  /**
   * Get invitation by email
   */
  async getInvitationByEmail(
    workspaceId: string,
    email: string
  ): Promise<ApiResponse<WorkspaceInvitation>> {
    const invitation = Array.from(this.invitations.values()).find(
      (inv) =>
        inv.workspaceId === workspaceId &&
        inv.email === email &&
        inv.status === 'pending'
    );

    if (!invitation) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        },
      };
    }

    return {
      success: true,
      data: invitation,
    };
  }

  /**
   * Get workspace invitations
   */
  async getWorkspaceInvitations(
    workspaceId: string
  ): Promise<ApiResponse<WorkspaceInvitation[]>> {
    const invitations = Array.from(this.invitations.values()).filter(
      (inv) => inv.workspaceId === workspaceId
    );

    return {
      success: true,
      data: invitations,
    };
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(
    token: string,
    userId: string
  ): Promise<ApiResponse<TeamMember>> {
    const invitationResult = await this.getInvitationByToken(token);

    if (!invitationResult.success || !invitationResult.data) {
      return {
        success: false,
        error: invitationResult.error,
      };
    }

    const invitation = invitationResult.data;

    // Update invitation status
    invitation.status = 'accepted';
    this.invitations.set(invitation.id, invitation);

    // Add member to workspace
    return this.addMember({
      userId,
      workspaceId: invitation.workspaceId,
      role: invitation.role,
    });
  }

  /**
   * Decline invitation
   */
  async declineInvitation(token: string): Promise<ApiResponse<void>> {
    const invitationResult = await this.getInvitationByToken(token);

    if (!invitationResult.success || !invitationResult.data) {
      return {
        success: false,
        error: invitationResult.error,
      };
    }

    const invitation = invitationResult.data;
    invitation.status = 'declined';
    this.invitations.set(invitation.id, invitation);

    return {
      success: true,
    };
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string): Promise<ApiResponse<void>> {
    const invitation = this.invitations.get(invitationId);

    if (!invitation) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        },
      };
    }

    invitation.status = 'cancelled';
    this.invitations.set(invitationId, invitation);

    return {
      success: true,
    };
  }

  /**
   * Resend invitation
   */
  async resendInvitation(
    invitationId: string
  ): Promise<ApiResponse<WorkspaceInvitation>> {
    const invitation = this.invitations.get(invitationId);

    if (!invitation) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        },
      };
    }

    // Reset expiration and status
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invitation.status = 'pending';
    invitation.token = generateToken();

    this.invitations.set(invitationId, invitation);

    return {
      success: true,
      data: invitation,
    };
  }

  /**
   * Get random cursor color
   */
  private getRandomColor(): string {
    const colors = [
      '#ef4444',
      '#f59e0b',
      '#10b981',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16',
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Clean up expired invitations
   */
  async cleanupExpiredInvitations(): Promise<number> {
    const now = new Date();
    let count = 0;

    for (const [id, invitation] of this.invitations.entries()) {
      if (invitation.status === 'pending' && now > invitation.expiresAt) {
        invitation.status = 'expired';
        this.invitations.set(id, invitation);
        count++;
      }
    }

    return count;
  }
}

// Export singleton instance
export const memberManager = new MemberManager();
