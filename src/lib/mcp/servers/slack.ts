/**
 * Slack MCP Server Implementation
 */

import { WebClient } from '@slack/web-api';
import { BaseMCPServer } from '../base-server';
import {
  SlackMCPServer,
  MCPServerConfig,
  MCPCredentials,
  SlackSendMessageParams,
  SlackMessage,
  SlackSearchParams,
  SlackSearchResult,
  SlackChannel,
  SlackListChannelsParams,
  SlackUploadFileParams,
  SlackFile,
  SlackReactionParams,
} from '@/types/mcp';

export class SlackMCPServerImpl extends BaseMCPServer implements SlackMCPServer {
  private client: WebClient;

  constructor(config: MCPServerConfig, userId: string, credentials: MCPCredentials) {
    super(config, userId, credentials);
    this.client = new WebClient(this.getAccessToken());
  }

  async validateConnection(): Promise<boolean> {
    return this.executeOperation('validateConnection', async () => {
      try {
        const response = await this.client.auth.test();
        return response.ok === true;
      } catch (error) {
        console.error('[Slack] Validation failed:', error);
        return false;
      }
    });
  }

  async sendMessage(params: SlackSendMessageParams): Promise<SlackMessage> {
    return this.executeOperation('sendMessage', async () => {
      try {
        const response = await this.client.chat.postMessage({
          channel: params.channel,
          text: params.text,
          blocks: params.blocks,
          attachments: params.attachments,
          thread_ts: params.threadTs,
        });

        if (!response.ok || !response.ts) {
          throw new Error('Failed to send message');
        }

        // Get permalink
        const permalink = await this.getPermalink(params.channel, response.ts);

        return {
          ts: response.ts,
          channel: params.channel,
          text: params.text,
          permalink,
        };
      } catch (error) {
        this.handleError(error, 'sendMessage');
      }
    });
  }

  async searchMessages(params: SlackSearchParams): Promise<SlackSearchResult[]> {
    return this.executeOperation('searchMessages', async () => {
      try {
        const response = await this.client.search.messages({
          query: params.query,
          sort: params.sort || 'score',
          sort_dir: params.sort_dir || 'desc',
          count: params.count || 20,
        });

        if (!response.ok || !response.messages?.matches) {
          return [];
        }

        return response.messages.matches.map((match: any) => ({
          text: match.text || '',
          user: match.user || '',
          channel: match.channel?.name || '',
          ts: match.ts || '',
          permalink: match.permalink || '',
          score: match.score || 0,
        }));
      } catch (error) {
        this.handleError(error, 'searchMessages');
      }
    });
  }

  async getChannelInfo(channelId: string): Promise<SlackChannel> {
    return this.executeOperation('getChannelInfo', async () => {
      try {
        const response = await this.client.conversations.info({
          channel: channelId,
        });

        if (!response.ok || !response.channel) {
          throw new Error('Failed to get channel info');
        }

        const channel = response.channel as any;

        return {
          id: channel.id,
          name: channel.name || '',
          isPrivate: channel.is_private || false,
          memberCount: channel.num_members || 0,
          topic: channel.topic?.value || '',
          purpose: channel.purpose?.value || '',
        };
      } catch (error) {
        this.handleError(error, 'getChannelInfo');
      }
    });
  }

  async listChannels(params?: SlackListChannelsParams): Promise<SlackChannel[]> {
    return this.executeOperation('listChannels', async () => {
      try {
        const response = await this.client.conversations.list({
          types: params?.types || 'public_channel,private_channel',
          limit: params?.limit || 100,
          exclude_archived: params?.excludeArchived ?? true,
        });

        if (!response.ok || !response.channels) {
          return [];
        }

        return response.channels.map((channel: any) => ({
          id: channel.id,
          name: channel.name || '',
          isPrivate: channel.is_private || false,
          memberCount: channel.num_members || 0,
          topic: channel.topic?.value || '',
          purpose: channel.purpose?.value || '',
        }));
      } catch (error) {
        this.handleError(error, 'listChannels');
      }
    });
  }

  async uploadFile(params: SlackUploadFileParams): Promise<SlackFile> {
    return this.executeOperation('uploadFile', async () => {
      try {
        const response = await this.client.files.upload({
          channels: params.channels,
          file: params.file,
          filename: params.filename,
          title: params.title,
          initial_comment: params.initialComment,
        });

        if (!response.ok || !response.file) {
          throw new Error('Failed to upload file');
        }

        const file = response.file as any;

        return {
          id: file.id,
          name: file.name,
          url: file.url_private,
          permalink: file.permalink,
        };
      } catch (error) {
        this.handleError(error, 'uploadFile');
      }
    });
  }

  async addReaction(params: SlackReactionParams): Promise<void> {
    return this.executeOperation('addReaction', async () => {
      try {
        const response = await this.client.reactions.add({
          channel: params.channel,
          timestamp: params.timestamp,
          name: params.name,
        });

        if (!response.ok) {
          throw new Error('Failed to add reaction');
        }
      } catch (error) {
        this.handleError(error, 'addReaction');
      }
    });
  }

  private async getPermalink(channel: string, ts: string): Promise<string> {
    try {
      const response = await this.client.chat.getPermalink({
        channel,
        message_ts: ts,
      });

      return response.permalink || '';
    } catch (error) {
      console.error('[Slack] Failed to get permalink:', error);
      return '';
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    console.log('[Slack] Received webhook:', payload.type);
    // TODO: Implement webhook handling logic
  }
}
