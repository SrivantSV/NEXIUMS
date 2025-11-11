import {
  TeamWorkspace,
  WorkspaceSettings,
  WorkspaceBranding,
  WorkspaceQuotas,
  ApiResponse,
} from '@/types/collaboration';
import { generateId, slugify } from '@/lib/utils';

/**
 * WorkspaceManager - Manages team workspaces
 */
export class WorkspaceManager {
  private workspaces: Map<string, TeamWorkspace> = new Map();

  /**
   * Create a new workspace
   */
  async createWorkspace(data: {
    name: string;
    description?: string;
    ownerId: string;
    plan?: 'team' | 'enterprise';
  }): Promise<ApiResponse<TeamWorkspace>> {
    try {
      // Generate slug
      const slug = slugify(data.name);

      // Check if slug exists
      if (await this.workspaceExistsBySlug(slug)) {
        return {
          success: false,
          error: {
            code: 'SLUG_EXISTS',
            message: 'A workspace with this name already exists',
          },
        };
      }

      // Create workspace
      const workspace: TeamWorkspace = {
        id: generateId('ws'),
        name: data.name,
        description: data.description || '',
        slug,
        plan: data.plan || 'team',
        settings: this.getDefaultSettings(),
        branding: this.getDefaultBranding(),
        owner: data.ownerId,
        members: [],
        invitations: [],
        projects: [],
        channels: [],
        sharedResources: [],
        realTimeSettings: {
          enabled: true,
          showCursors: true,
          showSelections: true,
          showPresence: true,
          conflictResolution: 'auto',
          autoSaveInterval: 30,
        },
        notificationSettings: {
          enabled: true,
          channels: [
            { type: 'email', enabled: true, config: {} },
            { type: 'in_app', enabled: true, config: {} },
          ],
          preferences: {
            enabled: true,
            enabledChannels: ['email', 'in_app'],
            types: {
              member_joined: true,
              member_left: true,
              invitation_sent: true,
              invitation_accepted: true,
              role_changed: true,
              permission_changed: true,
              project_created: true,
              project_updated: true,
              channel_created: true,
              channel_message: true,
              mention: true,
              task_assigned: true,
              comment_added: true,
              workspace_updated: true,
              billing_updated: true,
            },
            workspaces: {},
          },
        },
        securitySettings: {
          sessionTimeout: 480, // 8 hours
          maxConcurrentSessions: 3,
          auditLog: true,
          dataRetention: 90, // 90 days
          encryptionEnabled: true,
        },
        usage: {
          members: 1,
          projects: 0,
          conversations: 0,
          artifacts: 0,
          storage: 0,
          apiCalls: 0,
          realTimeSessions: 0,
        },
        insights: [],
        billing: {
          plan: data.plan || 'team',
          status: 'active',
          billingEmail: '',
          subscription: {
            id: generateId('sub'),
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            amount: data.plan === 'enterprise' ? 99 : 29,
            currency: 'USD',
            interval: 'month',
          },
          invoices: [],
        },
        quotas: this.getQuotasForPlan(data.plan || 'team'),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      };

      this.workspaces.set(workspace.id, workspace);

      return {
        success: true,
        data: workspace,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create workspace',
        },
      };
    }
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<ApiResponse<TeamWorkspace>> {
    const workspace = this.workspaces.get(workspaceId);

    if (!workspace) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        },
      };
    }

    return {
      success: true,
      data: workspace,
    };
  }

  /**
   * Get workspace by slug
   */
  async getWorkspaceBySlug(slug: string): Promise<ApiResponse<TeamWorkspace>> {
    const workspace = Array.from(this.workspaces.values()).find(
      (ws) => ws.slug === slug
    );

    if (!workspace) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        },
      };
    }

    return {
      success: true,
      data: workspace,
    };
  }

  /**
   * Update workspace
   */
  async updateWorkspace(
    workspaceId: string,
    updates: Partial<TeamWorkspace>
  ): Promise<ApiResponse<TeamWorkspace>> {
    const workspace = this.workspaces.get(workspaceId);

    if (!workspace) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        },
      };
    }

    // Update fields
    const updatedWorkspace: TeamWorkspace = {
      ...workspace,
      ...updates,
      updatedAt: new Date(),
    };

    this.workspaces.set(workspaceId, updatedWorkspace);

    return {
      success: true,
      data: updatedWorkspace,
    };
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<ApiResponse<void>> {
    const workspace = this.workspaces.get(workspaceId);

    if (!workspace) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        },
      };
    }

    this.workspaces.delete(workspaceId);

    return {
      success: true,
    };
  }

  /**
   * Get workspaces for user
   */
  async getUserWorkspaces(userId: string): Promise<ApiResponse<TeamWorkspace[]>> {
    const userWorkspaces = Array.from(this.workspaces.values()).filter(
      (ws) => ws.owner === userId || ws.members.some((m) => m.userId === userId)
    );

    return {
      success: true,
      data: userWorkspaces,
    };
  }

  /**
   * Update workspace settings
   */
  async updateSettings(
    workspaceId: string,
    settings: Partial<WorkspaceSettings>
  ): Promise<ApiResponse<TeamWorkspace>> {
    const workspace = this.workspaces.get(workspaceId);

    if (!workspace) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        },
      };
    }

    workspace.settings = {
      ...workspace.settings,
      ...settings,
    };
    workspace.updatedAt = new Date();

    this.workspaces.set(workspaceId, workspace);

    return {
      success: true,
      data: workspace,
    };
  }

  /**
   * Update workspace branding
   */
  async updateBranding(
    workspaceId: string,
    branding: Partial<WorkspaceBranding>
  ): Promise<ApiResponse<TeamWorkspace>> {
    const workspace = this.workspaces.get(workspaceId);

    if (!workspace) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        },
      };
    }

    workspace.branding = {
      ...workspace.branding,
      ...branding,
    };
    workspace.updatedAt = new Date();

    this.workspaces.set(workspaceId, workspace);

    return {
      success: true,
      data: workspace,
    };
  }

  /**
   * Update workspace usage
   */
  async updateUsage(
    workspaceId: string,
    usage: Partial<TeamWorkspace['usage']>
  ): Promise<void> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return;

    workspace.usage = {
      ...workspace.usage,
      ...usage,
    };
    workspace.lastActivityAt = new Date();

    this.workspaces.set(workspaceId, workspace);
  }

  /**
   * Check if workspace exists by slug
   */
  private async workspaceExistsBySlug(slug: string): Promise<boolean> {
    return Array.from(this.workspaces.values()).some((ws) => ws.slug === slug);
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): WorkspaceSettings {
    return {
      defaultProjectVisibility: 'team',
      allowMemberInvites: true,
      requireEmailVerification: true,
      enableExternalSharing: false,
      ssoEnabled: false,
      twoFactorRequired: false,
    };
  }

  /**
   * Get default branding
   */
  private getDefaultBranding(): WorkspaceBranding {
    return {
      primaryColor: '#667eea',
      emailBranding: {
        fromName: 'Nexus AI',
        replyTo: 'noreply@nexusai.com',
      },
    };
  }

  /**
   * Get quotas for plan
   */
  private getQuotasForPlan(plan: 'team' | 'enterprise'): WorkspaceQuotas {
    if (plan === 'enterprise') {
      return {
        maxMembers: -1, // unlimited
        maxProjects: -1,
        maxStorage: -1,
        maxApiCalls: -1,
        maxRealTimeSessions: -1,
        customBranding: true,
        ssoEnabled: true,
        advancedAnalytics: true,
      };
    }

    return {
      maxMembers: 10,
      maxProjects: 50,
      maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
      maxApiCalls: 10000,
      maxRealTimeSessions: 5,
      customBranding: false,
      ssoEnabled: false,
      advancedAnalytics: false,
    };
  }

  /**
   * Check if workspace is within quotas
   */
  async checkQuotas(
    workspaceId: string,
    resource: keyof WorkspaceQuotas
  ): Promise<boolean> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    const quota = workspace.quotas[resource];
    if (quota === -1) return true; // unlimited

    // Check specific quotas
    switch (resource) {
      case 'maxMembers':
        return workspace.usage.members < (quota as number);
      case 'maxProjects':
        return workspace.usage.projects < (quota as number);
      case 'maxStorage':
        return workspace.usage.storage < (quota as number);
      case 'maxApiCalls':
        return workspace.usage.apiCalls < (quota as number);
      case 'maxRealTimeSessions':
        return workspace.usage.realTimeSessions < (quota as number);
      default:
        return true;
    }
  }
}

// Export singleton instance
export const workspaceManager = new WorkspaceManager();
