import { ProcessedNotification, ChannelResult } from '@/types/collaboration';
import { WebClient } from '@slack/web-api';

export interface SlackConfig {
  token: string;
  defaultChannel?: string;
}

export interface SlackUserConfig {
  userId: string;
  slackUserId?: string;
  channelId: string;
  enabled: boolean;
}

export class SlackNotificationChannel {
  private client: WebClient;
  private config: SlackConfig;
  private userConfigs: Map<string, SlackUserConfig> = new Map();

  constructor(config?: SlackConfig) {
    this.config = config || this.getDefaultConfig();
    this.client = new WebClient(this.config.token);
  }

  private getDefaultConfig(): SlackConfig {
    return {
      token: process.env.SLACK_BOT_TOKEN || '',
      defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#general',
    };
  }

  async send(notification: ProcessedNotification): Promise<ChannelResult> {
    try {
      // Get user's Slack configuration
      const slackConfig = await this.getUserSlackConfig(notification.userId);

      if (!slackConfig || !slackConfig.enabled) {
        return {
          success: false,
          error: 'No Slack connection or disabled',
        };
      }

      const template = notification.template;

      // Build Slack message
      const message: any = {
        channel: slackConfig.channelId,
        text: template.message,
      };

      // Add blocks if available
      if (template.blocks) {
        message.blocks = template.blocks;
      } else {
        // Create default blocks
        message.blocks = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${template.title}*\n${template.message}`,
            },
          },
        ];
      }

      // Add attachments if available
      if (template.attachments) {
        message.attachments = template.attachments;
      }

      // Send message
      await this.client.chat.postMessage(message);

      return { success: true };
    } catch (error) {
      console.error('Slack notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getUserSlackConfig(userId: string): Promise<SlackUserConfig | null> {
    return this.userConfigs.get(userId) || null;
  }

  async setUserSlackConfig(config: SlackUserConfig): Promise<void> {
    this.userConfigs.set(config.userId, config);
  }

  async removeUserSlackConfig(userId: string): Promise<void> {
    this.userConfigs.delete(userId);
  }

  async sendDirectMessage(
    slackUserId: string,
    message: string
  ): Promise<boolean> {
    try {
      await this.client.chat.postMessage({
        channel: slackUserId,
        text: message,
      });
      return true;
    } catch (error) {
      console.error('Slack DM error:', error);
      return false;
    }
  }

  async sendToChannel(
    channelId: string,
    message: string,
    blocks?: any[]
  ): Promise<boolean> {
    try {
      await this.client.chat.postMessage({
        channel: channelId,
        text: message,
        blocks,
      });
      return true;
    } catch (error) {
      console.error('Slack channel message error:', error);
      return false;
    }
  }

  async verify(): Promise<boolean> {
    try {
      const result = await this.client.auth.test();
      return !!result.ok;
    } catch (error) {
      console.error('Slack configuration verification failed:', error);
      return false;
    }
  }

  buildSlackBlocks(notification: ProcessedNotification): any[] {
    const template = notification.template;

    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: template.title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: template.message,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Priority: *${notification.priority}* | Type: \`${notification.type}\``,
          },
        ],
      },
    ];
  }
}
