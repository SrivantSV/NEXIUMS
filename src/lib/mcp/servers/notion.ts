/**
 * Notion MCP Server Implementation
 */

import { Client } from '@notionhq/client';
import { BaseMCPServer } from '../base-server';
import {
  NotionMCPServer,
  MCPServerConfig,
  MCPCredentials,
  NotionSearchParams,
  NotionPage,
  NotionCreatePageParams,
  NotionUpdatePageParams,
  NotionQueryDatabaseParams,
  NotionDatabaseResult,
  NotionCreateDatabaseParams,
  NotionDatabase,
} from '@/types/mcp';

export class NotionMCPServerImpl extends BaseMCPServer implements NotionMCPServer {
  private client: Client;

  constructor(config: MCPServerConfig, userId: string, credentials: MCPCredentials) {
    super(config, userId, credentials);
    this.client = new Client({ auth: this.getAccessToken() });
  }

  async validateConnection(): Promise<boolean> {
    return this.executeOperation('validateConnection', async () => {
      try {
        // Try to search (which requires valid auth)
        await this.client.search({ page_size: 1 });
        return true;
      } catch (error) {
        console.error('[Notion] Validation failed:', error);
        return false;
      }
    });
  }

  async searchPages(params: NotionSearchParams = {}): Promise<NotionPage[]> {
    return this.executeOperation('searchPages', async () => {
      try {
        const response = await this.client.search({
          query: params.query,
          filter: params.filter,
          sort: params.sorts,
        });

        return response.results
          .filter(result => result.object === 'page')
          .map(page => this.mapNotionPage(page as any));
      } catch (error) {
        this.handleError(error, 'searchPages');
      }
    });
  }

  async createPage(params: NotionCreatePageParams): Promise<NotionPage> {
    return this.executeOperation('createPage', async () => {
      try {
        const response = await this.client.pages.create({
          parent: params.parent,
          properties: params.properties,
          children: params.children,
        });

        return this.mapNotionPage(response as any);
      } catch (error) {
        this.handleError(error, 'createPage');
      }
    });
  }

  async updatePage(params: NotionUpdatePageParams): Promise<NotionPage> {
    return this.executeOperation('updatePage', async () => {
      try {
        const response = await this.client.pages.update({
          page_id: params.pageId,
          properties: params.properties,
        });

        return this.mapNotionPage(response as any);
      } catch (error) {
        this.handleError(error, 'updatePage');
      }
    });
  }

  async queryDatabase(params: NotionQueryDatabaseParams): Promise<NotionDatabaseResult> {
    return this.executeOperation('queryDatabase', async () => {
      try {
        const response = await this.client.databases.query({
          database_id: params.databaseId,
          filter: params.filter,
          sorts: params.sorts,
          start_cursor: params.startCursor,
          page_size: params.pageSize,
        });

        return {
          results: response.results.map(page => this.mapNotionPage(page as any)),
          nextCursor: response.next_cursor,
          hasMore: response.has_more,
        };
      } catch (error) {
        this.handleError(error, 'queryDatabase');
      }
    });
  }

  async createDatabase(params: NotionCreateDatabaseParams): Promise<NotionDatabase> {
    return this.executeOperation('createDatabase', async () => {
      try {
        const response = await this.client.databases.create({
          parent: params.parent,
          title: params.title,
          properties: params.properties,
        });

        return this.mapNotionDatabase(response as any);
      } catch (error) {
        this.handleError(error, 'createDatabase');
      }
    });
  }

  private mapNotionPage(page: any): NotionPage {
    // Extract title from properties
    let title = 'Untitled';
    if (page.properties) {
      const titleProp = Object.values(page.properties).find(
        (prop: any) => prop.type === 'title'
      ) as any;

      if (titleProp?.title?.[0]?.plain_text) {
        title = titleProp.title[0].plain_text;
      }
    }

    return {
      id: page.id,
      url: page.url,
      title,
      properties: page.properties,
      createdTime: new Date(page.created_time),
      lastEditedTime: new Date(page.last_edited_time),
    };
  }

  private mapNotionDatabase(database: any): NotionDatabase {
    // Extract title
    let title = 'Untitled Database';
    if (database.title?.[0]?.plain_text) {
      title = database.title[0].plain_text;
    }

    return {
      id: database.id,
      url: database.url,
      title,
      properties: database.properties,
      createdTime: new Date(database.created_time),
      lastEditedTime: new Date(database.last_edited_time),
    };
  }

  async handleWebhook(payload: any): Promise<void> {
    console.log('[Notion] Received webhook:', payload);
    // TODO: Implement webhook handling logic
  }
}
