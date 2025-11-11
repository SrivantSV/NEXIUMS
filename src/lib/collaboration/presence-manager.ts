import { UserPresence, WebSocketMessage } from '@/types/collaboration';

/**
 * PresenceManager - Manages user presence and activity across workspaces
 */
export class PresenceManager {
  private userPresence: Map<string, UserPresence> = new Map();
  private workspacePresence: Map<string, Set<string>> = new Map();
  private presenceTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private broadcastCallbacks: Map<
    string,
    (message: WebSocketMessage) => Promise<void>
  > = new Map();

  private readonly PRESENCE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupStalePresence(), this.CLEANUP_INTERVAL);
  }

  /**
   * Register broadcast callback for a workspace
   */
  registerBroadcast(
    workspaceId: string,
    callback: (message: WebSocketMessage) => Promise<void>
  ): void {
    this.broadcastCallbacks.set(workspaceId, callback);
  }

  /**
   * Unregister broadcast callback
   */
  unregisterBroadcast(workspaceId: string): void {
    this.broadcastCallbacks.delete(workspaceId);
  }

  /**
   * Update user presence status
   */
  async updateUserPresence(
    userId: string,
    presence: Partial<UserPresence>
  ): Promise<void> {
    const currentPresence = this.userPresence.get(userId) || {
      userId,
      status: 'offline',
      lastSeen: new Date(),
      currentLocation: null,
    };

    const updatedPresence: UserPresence = {
      ...currentPresence,
      ...presence,
      lastSeen: new Date(),
    };

    this.userPresence.set(userId, updatedPresence);

    // Reset timeout for this user
    this.resetPresenceTimeout(userId);

    // Broadcast presence update to workspaces
    const userWorkspaces = await this.getUserWorkspaces(userId);
    for (const workspaceId of userWorkspaces) {
      await this.broadcastToWorkspace(workspaceId, {
        type: 'presence_update',
        payload: {
          userId,
          presence: updatedPresence,
        },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get user presence
   */
  getUserPresence(userId: string): UserPresence | null {
    return this.userPresence.get(userId) || null;
  }

  /**
   * Get all users in a workspace
   */
  async getUsersInWorkspace(workspaceId: string): Promise<UserPresence[]> {
    const userIds = this.workspacePresence.get(workspaceId) || new Set();
    const presences: UserPresence[] = [];

    for (const userId of userIds) {
      const presence = this.userPresence.get(userId);
      if (presence) {
        presences.push(presence);
      }
    }

    return presences.filter((p) => p.status !== 'offline');
  }

  /**
   * Get online users count in workspace
   */
  async getOnlineUsersCount(workspaceId: string): Promise<number> {
    const users = await this.getUsersInWorkspace(workspaceId);
    return users.filter((u) => u.status === 'online').length;
  }

  /**
   * Add user to workspace presence
   */
  async addUserToWorkspace(userId: string, workspaceId: string): Promise<void> {
    if (!this.workspacePresence.has(workspaceId)) {
      this.workspacePresence.set(workspaceId, new Set());
    }

    this.workspacePresence.get(workspaceId)!.add(userId);

    await this.updateUserPresence(userId, {
      status: 'online',
      currentLocation: {
        type: 'workspace',
        id: workspaceId,
      },
    });

    // Notify other users in workspace
    await this.broadcastToWorkspace(workspaceId, {
      type: 'user_joined',
      payload: {
        userId,
        workspaceId,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Remove user from workspace presence
   */
  async removeUserFromWorkspace(
    userId: string,
    workspaceId: string
  ): Promise<void> {
    const workspaceUsers = this.workspacePresence.get(workspaceId);
    if (workspaceUsers) {
      workspaceUsers.delete(userId);

      if (workspaceUsers.size === 0) {
        this.workspacePresence.delete(workspaceId);
      }
    }

    // Update user presence
    const presence = this.userPresence.get(userId);
    if (presence?.currentLocation?.id === workspaceId) {
      await this.updateUserPresence(userId, {
        currentLocation: null,
      });
    }

    // Notify other users in workspace
    await this.broadcastToWorkspace(workspaceId, {
      type: 'user_left',
      payload: {
        userId,
        workspaceId,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Set user as offline
   */
  async setUserOffline(userId: string): Promise<void> {
    const presence = this.userPresence.get(userId);
    if (!presence) return;

    // Get user's workspaces before setting offline
    const userWorkspaces = await this.getUserWorkspaces(userId);

    // Update presence
    await this.updateUserPresence(userId, {
      status: 'offline',
      currentLocation: null,
    });

    // Remove from all workspaces
    for (const workspaceId of userWorkspaces) {
      await this.removeUserFromWorkspace(userId, workspaceId);
    }

    // Clear timeout
    const timeout = this.presenceTimeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.presenceTimeouts.delete(userId);
    }
  }

  /**
   * Update user activity
   */
  async updateUserActivity(
    userId: string,
    activity: string
  ): Promise<void> {
    const presence = this.userPresence.get(userId);
    if (!presence) return;

    await this.updateUserPresence(userId, {
      activity,
    });
  }

  /**
   * Get user's workspaces
   */
  private async getUserWorkspaces(userId: string): Promise<string[]> {
    const workspaces: string[] = [];

    for (const [workspaceId, users] of this.workspacePresence.entries()) {
      if (users.has(userId)) {
        workspaces.push(workspaceId);
      }
    }

    return workspaces;
  }

  /**
   * Broadcast message to all users in workspace
   */
  private async broadcastToWorkspace(
    workspaceId: string,
    message: WebSocketMessage
  ): Promise<void> {
    const callback = this.broadcastCallbacks.get(workspaceId);
    if (callback) {
      await callback(message);
    }
  }

  /**
   * Reset presence timeout for user
   */
  private resetPresenceTimeout(userId: string): void {
    // Clear existing timeout
    const existingTimeout = this.presenceTimeouts.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      const presence = this.userPresence.get(userId);
      if (presence && presence.status !== 'offline') {
        await this.updateUserPresence(userId, {
          status: 'away',
        });
      }
    }, this.PRESENCE_TIMEOUT);

    this.presenceTimeouts.set(userId, timeout);
  }

  /**
   * Clean up stale presence data
   */
  private cleanupStalePresence(): void {
    const now = new Date();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [userId, presence] of this.userPresence.entries()) {
      const timeSinceLastSeen = now.getTime() - presence.lastSeen.getTime();

      if (timeSinceLastSeen > staleThreshold) {
        this.setUserOffline(userId);
      }
    }
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    totalUsers: number;
    onlineUsers: number;
    activeUsers: number;
    awayUsers: number;
  }> {
    const users = await this.getUsersInWorkspace(workspaceId);

    return {
      totalUsers: users.length,
      onlineUsers: users.filter((u) => u.status === 'online').length,
      activeUsers: users.filter(
        (u) => u.status === 'online' && u.activity
      ).length,
      awayUsers: users.filter((u) => u.status === 'away').length,
    };
  }

  /**
   * Get all presence data (for debugging)
   */
  getAllPresence(): Map<string, UserPresence> {
    return new Map(this.userPresence);
  }

  /**
   * Clear all presence data
   */
  clearAll(): void {
    this.userPresence.clear();
    this.workspacePresence.clear();

    for (const timeout of this.presenceTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.presenceTimeouts.clear();
  }
}
