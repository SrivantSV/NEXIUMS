/**
 * Linear MCP Server Implementation
 */

import axios, { AxiosInstance } from 'axios';
import { BaseMCPServer } from '../base-server';
import {
  LinearMCPServer,
  MCPServerConfig,
  MCPCredentials,
  LinearCreateIssueParams,
  LinearIssue,
  LinearUpdateIssueParams,
  LinearSearchParams,
  LinearTeam,
  LinearProject,
} from '@/types/mcp';

export class LinearMCPServerImpl extends BaseMCPServer implements LinearMCPServer {
  private client: AxiosInstance;
  private readonly LINEAR_API_URL = 'https://api.linear.app/graphql';

  constructor(config: MCPServerConfig, userId: string, credentials: MCPCredentials) {
    super(config, userId, credentials);
    this.client = axios.create({
      baseURL: this.LINEAR_API_URL,
      headers: {
        Authorization: this.getAccessToken(),
        'Content-Type': 'application/json',
      },
    });
  }

  async validateConnection(): Promise<boolean> {
    return this.executeOperation('validateConnection', async () => {
      try {
        const query = `
          query {
            viewer {
              id
              name
            }
          }
        `;

        const response = await this.client.post('', { query });
        return response.data.data?.viewer?.id != null;
      } catch (error) {
        console.error('[Linear] Validation failed:', error);
        return false;
      }
    });
  }

  async createIssue(params: LinearCreateIssueParams): Promise<LinearIssue> {
    return this.executeOperation('createIssue', async () => {
      try {
        const mutation = `
          mutation CreateIssue($input: IssueCreateInput!) {
            issueCreate(input: $input) {
              success
              issue {
                id
                identifier
                title
                description
                state {
                  name
                }
                priority
                url
                createdAt
                updatedAt
              }
            }
          }
        `;

        const input: any = {
          title: params.title,
          teamId: params.teamId,
        };

        if (params.description) input.description = params.description;
        if (params.projectId) input.projectId = params.projectId;
        if (params.assigneeId) input.assigneeId = params.assigneeId;
        if (params.priority !== undefined) input.priority = params.priority;
        if (params.labels) input.labelIds = params.labels;

        const response = await this.client.post('', {
          query: mutation,
          variables: { input },
        });

        if (!response.data.data?.issueCreate?.success) {
          throw new Error('Failed to create issue');
        }

        const issue = response.data.data.issueCreate.issue;
        return this.mapLinearIssue(issue);
      } catch (error) {
        this.handleError(error, 'createIssue');
      }
    });
  }

  async updateIssue(params: LinearUpdateIssueParams): Promise<LinearIssue> {
    return this.executeOperation('updateIssue', async () => {
      try {
        const mutation = `
          mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
            issueUpdate(id: $id, input: $input) {
              success
              issue {
                id
                identifier
                title
                description
                state {
                  name
                }
                priority
                url
                createdAt
                updatedAt
              }
            }
          }
        `;

        const input: any = {};

        if (params.title) input.title = params.title;
        if (params.description) input.description = params.description;
        if (params.status) input.stateId = params.status;
        if (params.assigneeId) input.assigneeId = params.assigneeId;
        if (params.priority !== undefined) input.priority = params.priority;

        const response = await this.client.post('', {
          query: mutation,
          variables: { id: params.issueId, input },
        });

        if (!response.data.data?.issueUpdate?.success) {
          throw new Error('Failed to update issue');
        }

        const issue = response.data.data.issueUpdate.issue;
        return this.mapLinearIssue(issue);
      } catch (error) {
        this.handleError(error, 'updateIssue');
      }
    });
  }

  async searchIssues(params: LinearSearchParams): Promise<LinearIssue[]> {
    return this.executeOperation('searchIssues', async () => {
      try {
        const query = `
          query SearchIssues($query: String!, $teamId: String) {
            issueSearch(query: $query, first: 20, teamId: $teamId) {
              nodes {
                id
                identifier
                title
                description
                state {
                  name
                }
                priority
                url
                createdAt
                updatedAt
              }
            }
          }
        `;

        const response = await this.client.post('', {
          query,
          variables: {
            query: params.query,
            teamId: params.teamId,
          },
        });

        const issues = response.data.data?.issueSearch?.nodes || [];
        return issues.map((issue: any) => this.mapLinearIssue(issue));
      } catch (error) {
        this.handleError(error, 'searchIssues');
      }
    });
  }

  async getTeams(): Promise<LinearTeam[]> {
    return this.executeOperation('getTeams', async () => {
      try {
        const query = `
          query {
            teams {
              nodes {
                id
                name
                key
              }
            }
          }
        `;

        const response = await this.client.post('', { query });
        const teams = response.data.data?.teams?.nodes || [];

        return teams.map((team: any) => ({
          id: team.id,
          name: team.name,
          key: team.key,
        }));
      } catch (error) {
        this.handleError(error, 'getTeams');
      }
    });
  }

  async getProjects(teamId: string): Promise<LinearProject[]> {
    return this.executeOperation('getProjects', async () => {
      try {
        const query = `
          query GetProjects($teamId: String!) {
            team(id: $teamId) {
              projects {
                nodes {
                  id
                  name
                  description
                }
              }
            }
          }
        `;

        const response = await this.client.post('', {
          query,
          variables: { teamId },
        });

        const projects = response.data.data?.team?.projects?.nodes || [];

        return projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
        }));
      } catch (error) {
        this.handleError(error, 'getProjects');
      }
    });
  }

  private mapLinearIssue(issue: any): LinearIssue {
    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description || '',
      status: issue.state?.name || 'Unknown',
      priority: issue.priority || 0,
      url: issue.url,
      createdAt: new Date(issue.createdAt),
      updatedAt: new Date(issue.updatedAt),
    };
  }

  async handleWebhook(payload: any): Promise<void> {
    console.log('[Linear] Received webhook:', payload.type);
    // TODO: Implement webhook handling logic
  }
}
