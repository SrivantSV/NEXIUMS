import { ProcessedNotification, ChannelResult } from '@/types/collaboration';
import { generateId } from '@/lib/utils';

export interface InAppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  archived: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
}

export class InAppNotificationChannel {
  private notifications: Map<string, InAppNotification[]> = new Map();
  private wsCallbacks: Map<string, (notification: InAppNotification) => void> =
    new Map();

  async send(notification: ProcessedNotification): Promise<ChannelResult> {
    try {
      // Create in-app notification
      const inAppNotif: InAppNotification = {
        id: generateId('notif'),
        userId: notification.userId,
        type: notification.type,
        title: notification.template.title,
        message: notification.template.message,
        data: notification.data,
        read: false,
        archived: false,
        priority: notification.priority,
        createdAt: new Date(),
      };

      // Store notification
      await this.storeNotification(inAppNotif);

      // Send real-time update via WebSocket
      await this.sendRealTimeUpdate(notification.userId, inAppNotif);

      return { success: true };
    } catch (error) {
      console.error('In-app notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async storeNotification(
    notification: InAppNotification
  ): Promise<void> {
    const userNotifications =
      this.notifications.get(notification.userId) || [];
    userNotifications.unshift(notification);

    // Keep only last 200 notifications
    if (userNotifications.length > 200) {
      userNotifications.pop();
    }

    this.notifications.set(notification.userId, userNotifications);
  }

  private async sendRealTimeUpdate(
    userId: string,
    notification: InAppNotification
  ): Promise<void> {
    const callback = this.wsCallbacks.get(userId);
    if (callback) {
      callback(notification);
    }
  }

  registerWebSocketCallback(
    userId: string,
    callback: (notification: InAppNotification) => void
  ): void {
    this.wsCallbacks.set(userId, callback);
  }

  unregisterWebSocketCallback(userId: string): void {
    this.wsCallbacks.delete(userId);
  }

  async getNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<InAppNotification[]> {
    let notifications = this.notifications.get(userId) || [];

    // Filter unread only
    if (options?.unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    // Apply pagination
    const start = options?.offset || 0;
    const end = start + (options?.limit || 50);

    return notifications.slice(start, end);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = this.notifications.get(userId) || [];
    return notifications.filter((n) => !n.read && !n.archived).length;
  }

  async markAsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<void> {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    const now = new Date();

    for (const notification of notifications) {
      if (notificationIds.includes(notification.id)) {
        notification.read = true;
        notification.readAt = now;
      }
    }

    this.notifications.set(userId, notifications);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    const now = new Date();

    for (const notification of notifications) {
      notification.read = true;
      notification.readAt = now;
    }

    this.notifications.set(userId, notifications);
  }

  async archiveNotification(
    userId: string,
    notificationId: string
  ): Promise<void> {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.archived = true;
    }

    this.notifications.set(userId, notifications);
  }

  async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<void> {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    const filteredNotifications = notifications.filter(
      (n) => n.id !== notificationId
    );

    this.notifications.set(userId, filteredNotifications);
  }

  async clearAll(userId: string): Promise<void> {
    this.notifications.delete(userId);
  }

  async getStats(userId: string): Promise<{
    total: number;
    unread: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const notifications = this.notifications.get(userId) || [];

    const stats = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      byPriority: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    for (const notification of notifications) {
      // Count by priority
      stats.byPriority[notification.priority] =
        (stats.byPriority[notification.priority] || 0) + 1;

      // Count by type
      stats.byType[notification.type] =
        (stats.byType[notification.type] || 0) + 1;
    }

    return stats;
  }
}
