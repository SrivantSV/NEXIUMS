/**
 * Google Drive MCP Server Implementation
 */

import axios, { AxiosInstance } from 'axios';
import { BaseMCPServer } from '../base-server';
import { MCPServerConfig, MCPCredentials, MCPServer } from '@/types/mcp';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: Date;
  modifiedTime: Date;
}

interface DrivePermission {
  id: string;
  type: string;
  role: string;
  emailAddress?: string;
}

export class GoogleDriveMCPServerImpl extends BaseMCPServer implements MCPServer {
  private client: AxiosInstance;
  private readonly DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

  constructor(config: MCPServerConfig, userId: string, credentials: MCPCredentials) {
    super(config, userId, credentials);
    this.client = axios.create({
      baseURL: this.DRIVE_API_URL,
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }

  async validateConnection(): Promise<boolean> {
    return this.executeOperation('validateConnection', async () => {
      try {
        await this.client.get('/about?fields=user');
        return true;
      } catch (error) {
        console.error('[Google Drive] Validation failed:', error);
        return false;
      }
    });
  }

  async searchFiles(params: {
    query?: string;
    mimeType?: string;
    pageSize?: number;
  } = {}): Promise<DriveFile[]> {
    return this.executeOperation('searchFiles', async () => {
      try {
        let q = '';

        if (params.query) {
          q += `name contains '${params.query}'`;
        }

        if (params.mimeType) {
          if (q) q += ' and ';
          q += `mimeType='${params.mimeType}'`;
        }

        const response = await this.client.get('/files', {
          params: {
            q: q || undefined,
            pageSize: params.pageSize || 20,
            fields: 'files(id,name,mimeType,webViewLink,createdTime,modifiedTime)',
          },
        });

        return (response.data.files || []).map((file: any) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
          createdTime: new Date(file.createdTime),
          modifiedTime: new Date(file.modifiedTime),
        }));
      } catch (error) {
        this.handleError(error, 'searchFiles');
      }
    });
  }

  async createFile(params: {
    name: string;
    mimeType: string;
    content?: string;
    parents?: string[];
  }): Promise<DriveFile> {
    return this.executeOperation('createFile', async () => {
      try {
        const metadata = {
          name: params.name,
          mimeType: params.mimeType,
          parents: params.parents,
        };

        const response = await this.client.post('/files', metadata, {
          params: {
            fields: 'id,name,mimeType,webViewLink,createdTime,modifiedTime',
          },
        });

        return {
          id: response.data.id,
          name: response.data.name,
          mimeType: response.data.mimeType,
          webViewLink: response.data.webViewLink,
          createdTime: new Date(response.data.createdTime),
          modifiedTime: new Date(response.data.modifiedTime),
        };
      } catch (error) {
        this.handleError(error, 'createFile');
      }
    });
  }

  async shareFile(params: {
    fileId: string;
    emailAddress: string;
    role: 'reader' | 'writer' | 'commenter';
  }): Promise<DrivePermission> {
    return this.executeOperation('shareFile', async () => {
      try {
        const response = await this.client.post(`/files/${params.fileId}/permissions`, {
          type: 'user',
          role: params.role,
          emailAddress: params.emailAddress,
        });

        return {
          id: response.data.id,
          type: response.data.type,
          role: response.data.role,
          emailAddress: response.data.emailAddress,
        };
      } catch (error) {
        this.handleError(error, 'shareFile');
      }
    });
  }

  async handleWebhook(payload: any): Promise<void> {
    console.log('[Google Drive] Received webhook:', payload);
    // TODO: Implement webhook handling logic
  }
}
