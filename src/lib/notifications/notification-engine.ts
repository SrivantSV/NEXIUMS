import {
  NotificationRequest,
  ProcessedNotification,
  NotificationResult,
  NotificationPreferences,
  NotificationType,
  ChannelResult,
  NotificationTemplate,
} from '@/types/collaboration';
import { generateId } from '@/lib/utils';

/**
 * NotificationTemplateManager - Manages notification templates
 */
export class NotificationTemplateManager {
  private templates: Map<NotificationType, any> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Member notifications
    this.templates.set('member_joined', {
      email: {
        subject: '{{memberName}} joined {{workspaceName}}',
        html: '<p><strong>{{memberName}}</strong> has joined your workspace <strong>{{workspaceName}}</strong>.</p>',
        text: '{{memberName}} has joined your workspace {{workspaceName}}.',
      },
      slack: {
        text: ':wave: *{{memberName}}* joined {{workspaceName}}',
      },
      inApp: {
        title: 'New Team Member',
        message: '{{memberName}} joined {{workspaceName}}',
      },
    });

    this.templates.set('member_left', {
      email: {
        subject: '{{memberName}} left {{workspaceName}}',
        html: '<p><strong>{{memberName}}</strong> has left your workspace <strong>{{workspaceName}}</strong>.</p>',
        text: '{{memberName}} has left your workspace {{workspaceName}}.',
      },
      slack: {
        text: ':wave: *{{memberName}}* left {{workspaceName}}',
      },
      inApp: {
        title: 'Team Member Left',
        message: '{{memberName}} left {{workspaceName}}',
      },
    });

    this.templates.set('invitation_sent', {
      email: {
        subject: 'You\'re invited to join {{workspaceName}}',
        html: '<p>You\'ve been invited to join <strong>{{workspaceName}}</strong> by {{inviterName}}.</p><p><a href="{{inviteUrl}}">Accept Invitation</a></p>',
        text: 'You\'ve been invited to join {{workspaceName}} by {{inviterName}}. Accept at: {{inviteUrl}}',
      },
      inApp: {
        title: 'Workspace Invitation',
        message: 'You\'ve been invited to join {{workspaceName}}',
      },
    });

    this.templates.set('mention', {
      email: {
        subject: '{{mentionerName}} mentioned you in {{workspaceName}}',
        html: '<p><strong>{{mentionerName}}</strong> mentioned you: "{{messagePreview}}"</p>',
        text: '{{mentionerName}} mentioned you: "{{messagePreview}}"',
      },
      slack: {
        text: ':point_right: *{{mentionerName}}* mentioned you: {{messagePreview}}',
      },
      inApp: {
        title: 'New Mention',
        message: '{{mentionerName}} mentioned you',
      },
    });

    // Add more templates as needed
  }

  async getTemplate(
    type: NotificationType,
    data: any
  ): Promise<NotificationTemplate> {
    const template = this.templates.get(type);
    if (!template) {
      return {
        title: 'Notification',
        message: 'You have a new notification',
      };
    }

    return {
      title: this.interpolate(template.inApp?.title || 'Notification', data),
      message: this.interpolate(template.inApp?.message || '', data),
      subject: template.email?.subject
        ? this.interpolate(template.email.subject, data)
        : undefined,
      html: template.email?.html
        ? this.interpolate(template.email.html, data)
        : undefined,
      text: template.email?.text
        ? this.interpolate(template.email.text, data)
        : undefined,
      blocks: template.slack?.blocks,
      attachments: template.slack?.attachments,
    };
  }

  private interpolate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}

/**
 * NotificationEngine - Main notification system
 */
export class NotificationEngine {
  private preferences: Map<string, NotificationPreferences> = new Map();
  private templates: NotificationTemplateManager;
  private channels: Map<string, any> = new Map();
  private rateLimits: Map<string, number[]> = new Map();
  private notificationHistory: Map<string, ProcessedNotification[]> = new Map();

  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly RATE_LIMIT_MAX = 10; // 10 notifications per minute per user

  constructor() {
    this.templates = new NotificationTemplateManager();
  }

  /**
   * Register notification channel
   */
  registerChannel(type: string, channel: any): void {
    this.channels.set(type, channel);
  }

  /**
   * Send notification
   */
  async sendNotification(
    notification: NotificationRequest
  ): Promise<NotificationResult> {
    try {
      // Get user preferences
      const prefs = await this.getUserPreferences(notification.userId);

      // Check if notification should be sent
      if (!(await this.shouldSendNotification(notification, prefs))) {
        return { sent: false, reason: 'user_preferences' };
      }

      // Apply rate limiting
      if (await this.isRateLimited(notification.userId, notification.type)) {
        return { sent: false, reason: 'rate_limited' };
      }

      // Get notification template
      const template = await this.templates.getTemplate(
        notification.type,
        notification.data
      );

      // Determine channels to use
      const channels = notification.channels || prefs.enabledChannels;

      // Send via appropriate channels
      const results: ChannelResult[] = [];

      for (const channelType of channels) {
        const channel = this.channels.get(channelType);
        if (channel) {
          try {
            const result = await channel.send({
              ...notification,
              template,
            });
            results.push({ channel: channelType, ...result });
          } catch (error) {
            results.push({
              channel: channelType,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      // Store notification history
      await this.storeNotification({
        id: generateId('notif'),
        userId: notification.userId,
        userEmail: '', // Should be fetched from user service
        workspaceId: notification.workspaceId,
        type: notification.type,
        template,
        data: notification.data,
        priority: notification.priority || 'medium',
        createdAt: new Date(),
      });

      // Update rate limit
      this.updateRateLimit(notification.userId);

      return {
        sent: true,
        channels: results,
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        sent: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send batch notifications
   */
  async sendBatchNotifications(
    notifications: NotificationRequest[]
  ): Promise<NotificationResult[]> {
    return Promise.all(
      notifications.map((notif) => this.sendNotification(notif))
    );
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let prefs = this.preferences.get(userId);

    if (!prefs) {
      // Default preferences
      prefs = {
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
      };
      this.preferences.set(userId, prefs);
    }

    return prefs;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    this.preferences.set(userId, updated);
  }

  /**
   * Check if notification should be sent
   */
  private async shouldSendNotification(
    notification: NotificationRequest,
    prefs: NotificationPreferences
  ): Promise<boolean> {
    // Check global settings
    if (!prefs.enabled) return false;

    // Check type-specific settings
    if (!prefs.types[notification.type]) return false;

    // Check quiet hours
    if (prefs.quietHours && this.isInQuietHours(prefs.quietHours)) {
      // Only send urgent notifications during quiet hours
      if (notification.priority !== 'urgent') {
        return false;
      }
    }

    // Check workspace-specific settings
    if (notification.workspaceId) {
      const workspacePrefs = prefs.workspaces[notification.workspaceId];
      if (workspacePrefs && !workspacePrefs.enabled) return false;
      if (
        workspacePrefs?.types &&
        workspacePrefs.types[notification.type] === false
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if in quiet hours
   */
  private isInQuietHours(quietHours: any): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Check if user is rate limited
   */
  private async isRateLimited(
    userId: string,
    type: NotificationType
  ): Promise<boolean> {
    const key = `${userId}:${type}`;
    const now = Date.now();
    const timestamps = this.rateLimits.get(key) || [];

    // Remove timestamps outside the window
    const recentTimestamps = timestamps.filter(
      (ts) => now - ts < this.RATE_LIMIT_WINDOW
    );

    return recentTimestamps.length >= this.RATE_LIMIT_MAX;
  }

  /**
   * Update rate limit
   */
  private updateRateLimit(userId: string): void {
    const key = `${userId}`;
    const now = Date.now();
    const timestamps = this.rateLimits.get(key) || [];

    // Remove old timestamps
    const recentTimestamps = timestamps.filter(
      (ts) => now - ts < this.RATE_LIMIT_WINDOW
    );

    // Add new timestamp
    recentTimestamps.push(now);

    this.rateLimits.set(key, recentTimestamps);
  }

  /**
   * Store notification in history
   */
  private async storeNotification(
    notification: ProcessedNotification
  ): Promise<void> {
    const userHistory =
      this.notificationHistory.get(notification.userId) || [];
    userHistory.push(notification);

    // Keep only last 100 notifications per user
    if (userHistory.length > 100) {
      userHistory.shift();
    }

    this.notificationHistory.set(notification.userId, userHistory);
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(
    userId: string,
    limit: number = 50
  ): Promise<ProcessedNotification[]> {
    const history = this.notificationHistory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    // Implementation would update database
    console.log(`Marking notifications as read for user ${userId}`);
  }

  /**
   * Clear all notifications for user
   */
  async clearNotifications(userId: string): Promise<void> {
    this.notificationHistory.delete(userId);
  }
}
