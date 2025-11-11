import {
  TeamRole,
  Permission,
  PermissionResource,
  PermissionAction,
  ApiResponse,
} from '@/types/collaboration';
import { generateId } from '@/lib/utils';

/**
 * RBACManager - Role-Based Access Control Manager
 */
export class RBACManager {
  private roles: Map<string, TeamRole> = new Map();
  private systemRoles: Map<string, TeamRole> = new Map();

  constructor() {
    this.initializeSystemRoles();
  }

  /**
   * Initialize default system roles
   */
  private initializeSystemRoles(): void {
    // Owner role
    const ownerRole: TeamRole = {
      id: 'role_owner',
      name: 'Owner',
      description: 'Full access to all workspace features',
      level: 100,
      permissions: this.getAllPermissions(),
      isCustom: false,
      isSystemRole: true,
      workspaceId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Admin role
    const adminRole: TeamRole = {
      id: 'role_admin',
      name: 'Admin',
      description: 'Can manage members, settings, and all resources',
      level: 80,
      permissions: this.getAdminPermissions(),
      isCustom: false,
      isSystemRole: true,
      workspaceId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Member role
    const memberRole: TeamRole = {
      id: 'role_member',
      name: 'Member',
      description: 'Can create and manage own resources',
      level: 50,
      permissions: this.getMemberPermissions(),
      isCustom: false,
      isSystemRole: true,
      workspaceId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Viewer role
    const viewerRole: TeamRole = {
      id: 'role_viewer',
      name: 'Viewer',
      description: 'Read-only access to resources',
      level: 10,
      permissions: this.getViewerPermissions(),
      isCustom: false,
      isSystemRole: true,
      workspaceId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.systemRoles.set('owner', ownerRole);
    this.systemRoles.set('admin', adminRole);
    this.systemRoles.set('member', memberRole);
    this.systemRoles.set('viewer', viewerRole);
  }

  /**
   * Get all permissions
   */
  private getAllPermissions(): Permission[] {
    const resources: PermissionResource[] = [
      'workspace',
      'project',
      'conversation',
      'artifact',
      'file',
      'member',
      'billing',
      'settings',
      'analytics',
      'integrations',
      'api_keys',
    ];

    const actions: PermissionAction[] = [
      'create',
      'read',
      'update',
      'delete',
      'share',
      'export',
      'invite',
      'manage',
      'admin',
    ];

    return resources.map((resource) => ({
      resource,
      actions,
    }));
  }

  /**
   * Get admin permissions
   */
  private getAdminPermissions(): Permission[] {
    return [
      { resource: 'workspace', actions: ['read', 'update', 'manage'] },
      { resource: 'project', actions: ['create', 'read', 'update', 'delete', 'share', 'manage'] },
      { resource: 'conversation', actions: ['create', 'read', 'update', 'delete', 'share', 'export'] },
      { resource: 'artifact', actions: ['create', 'read', 'update', 'delete', 'share', 'export'] },
      { resource: 'file', actions: ['create', 'read', 'update', 'delete', 'share'] },
      { resource: 'member', actions: ['read', 'invite', 'manage'] },
      { resource: 'settings', actions: ['read', 'update'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'integrations', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    ];
  }

  /**
   * Get member permissions
   */
  private getMemberPermissions(): Permission[] {
    return [
      { resource: 'workspace', actions: ['read'] },
      { resource: 'project', actions: ['create', 'read', 'update', 'share'], conditions: [{ type: 'owner' }] },
      { resource: 'conversation', actions: ['create', 'read', 'update', 'share', 'export'] },
      { resource: 'artifact', actions: ['create', 'read', 'update', 'share', 'export'] },
      { resource: 'file', actions: ['create', 'read', 'update', 'share'] },
      { resource: 'member', actions: ['read'] },
      { resource: 'analytics', actions: ['read'] },
    ];
  }

  /**
   * Get viewer permissions
   */
  private getViewerPermissions(): Permission[] {
    return [
      { resource: 'workspace', actions: ['read'] },
      { resource: 'project', actions: ['read'] },
      { resource: 'conversation', actions: ['read'] },
      { resource: 'artifact', actions: ['read'] },
      { resource: 'file', actions: ['read'] },
      { resource: 'member', actions: ['read'] },
    ];
  }

  /**
   * Create custom role
   */
  async createRole(
    workspaceId: string,
    data: {
      name: string;
      description?: string;
      level: number;
      permissions: Permission[];
    }
  ): Promise<ApiResponse<TeamRole>> {
    try {
      // Check if role name exists in workspace
      if (await this.roleExistsInWorkspace(workspaceId, data.name)) {
        return {
          success: false,
          error: {
            code: 'ROLE_EXISTS',
            message: 'A role with this name already exists',
          },
        };
      }

      const role: TeamRole = {
        id: generateId('role'),
        name: data.name,
        description: data.description || '',
        level: data.level,
        permissions: data.permissions,
        isCustom: true,
        isSystemRole: false,
        workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.roles.set(role.id, role);

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create role',
        },
      };
    }
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<ApiResponse<TeamRole>> {
    // Check custom roles
    const role = this.roles.get(roleId);
    if (role) {
      return { success: true, data: role };
    }

    // Check system roles
    const systemRole = this.systemRoles.get(roleId.replace('role_', ''));
    if (systemRole) {
      return { success: true, data: systemRole };
    }

    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Role not found',
      },
    };
  }

  /**
   * Get all roles for workspace
   */
  async getWorkspaceRoles(workspaceId: string): Promise<ApiResponse<TeamRole[]>> {
    // Get custom roles
    const customRoles = Array.from(this.roles.values()).filter(
      (role) => role.workspaceId === workspaceId
    );

    // Get system roles (with workspace ID set)
    const systemRoles = Array.from(this.systemRoles.values()).map((role) => ({
      ...role,
      workspaceId,
    }));

    return {
      success: true,
      data: [...systemRoles, ...customRoles],
    };
  }

  /**
   * Update role
   */
  async updateRole(
    roleId: string,
    updates: Partial<TeamRole>
  ): Promise<ApiResponse<TeamRole>> {
    const role = this.roles.get(roleId);

    if (!role) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      };
    }

    if (role.isSystemRole) {
      return {
        success: false,
        error: {
          code: 'SYSTEM_ROLE',
          message: 'Cannot update system role',
        },
      };
    }

    const updatedRole: TeamRole = {
      ...role,
      ...updates,
      updatedAt: new Date(),
    };

    this.roles.set(roleId, updatedRole);

    return {
      success: true,
      data: updatedRole,
    };
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<ApiResponse<void>> {
    const role = this.roles.get(roleId);

    if (!role) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      };
    }

    if (role.isSystemRole) {
      return {
        success: false,
        error: {
          code: 'SYSTEM_ROLE',
          message: 'Cannot delete system role',
        },
      };
    }

    this.roles.delete(roleId);

    return {
      success: true,
    };
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    roleId: string,
    resource: PermissionResource,
    action: PermissionAction
  ): Promise<boolean> {
    const roleResult = await this.getRole(roleId);
    if (!roleResult.success || !roleResult.data) return false;

    const role = roleResult.data;

    // Check if role has permission for this resource and action
    const permission = role.permissions.find((p) => p.resource === resource);
    if (!permission) return false;

    return permission.actions.includes(action);
  }

  /**
   * Check multiple permissions
   */
  async hasPermissions(
    roleId: string,
    checks: Array<{ resource: PermissionResource; action: PermissionAction }>
  ): Promise<boolean> {
    for (const check of checks) {
      const hasPermission = await this.hasPermission(
        roleId,
        check.resource,
        check.action
      );
      if (!hasPermission) return false;
    }

    return true;
  }

  /**
   * Get permissions for role
   */
  async getRolePermissions(roleId: string): Promise<ApiResponse<Permission[]>> {
    const roleResult = await this.getRole(roleId);
    if (!roleResult.success || !roleResult.data) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      };
    }

    return {
      success: true,
      data: roleResult.data.permissions,
    };
  }

  /**
   * Add permission to role
   */
  async addPermission(
    roleId: string,
    permission: Permission
  ): Promise<ApiResponse<TeamRole>> {
    const role = this.roles.get(roleId);

    if (!role) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      };
    }

    if (role.isSystemRole) {
      return {
        success: false,
        error: {
          code: 'SYSTEM_ROLE',
          message: 'Cannot modify system role',
        },
      };
    }

    // Check if permission already exists
    const existingIndex = role.permissions.findIndex(
      (p) => p.resource === permission.resource
    );

    if (existingIndex >= 0) {
      // Merge actions
      const existingPermission = role.permissions[existingIndex];
      const mergedActions = Array.from(
        new Set([...existingPermission.actions, ...permission.actions])
      );
      role.permissions[existingIndex] = {
        ...existingPermission,
        actions: mergedActions,
      };
    } else {
      role.permissions.push(permission);
    }

    role.updatedAt = new Date();
    this.roles.set(roleId, role);

    return {
      success: true,
      data: role,
    };
  }

  /**
   * Remove permission from role
   */
  async removePermission(
    roleId: string,
    resource: PermissionResource,
    action?: PermissionAction
  ): Promise<ApiResponse<TeamRole>> {
    const role = this.roles.get(roleId);

    if (!role) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
      };
    }

    if (role.isSystemRole) {
      return {
        success: false,
        error: {
          code: 'SYSTEM_ROLE',
          message: 'Cannot modify system role',
        },
      };
    }

    if (action) {
      // Remove specific action
      const permission = role.permissions.find((p) => p.resource === resource);
      if (permission) {
        permission.actions = permission.actions.filter((a) => a !== action);
        if (permission.actions.length === 0) {
          role.permissions = role.permissions.filter(
            (p) => p.resource !== resource
          );
        }
      }
    } else {
      // Remove entire resource permission
      role.permissions = role.permissions.filter((p) => p.resource !== resource);
    }

    role.updatedAt = new Date();
    this.roles.set(roleId, role);

    return {
      success: true,
      data: role,
    };
  }

  /**
   * Check if role exists in workspace
   */
  private async roleExistsInWorkspace(
    workspaceId: string,
    name: string
  ): Promise<boolean> {
    // Check custom roles
    const customRoleExists = Array.from(this.roles.values()).some(
      (role) => role.workspaceId === workspaceId && role.name === name
    );

    // Check system roles
    const systemRoleExists = Array.from(this.systemRoles.values()).some(
      (role) => role.name === name
    );

    return customRoleExists || systemRoleExists;
  }

  /**
   * Get system roles
   */
  getSystemRoles(): TeamRole[] {
    return Array.from(this.systemRoles.values());
  }
}

// Export singleton instance
export const rbacManager = new RBACManager();
