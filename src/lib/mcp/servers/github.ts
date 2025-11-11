/**
 * GitHub MCP Server Implementation
 */

import { Octokit } from '@octokit/rest';
import { BaseMCPServer } from '../base-server';
import {
  GitHubMCPServer,
  MCPServerConfig,
  MCPCredentials,
  GitHubListReposParams,
  Repository,
  GitHubSearchCodeParams,
  CodeSearchResult,
  GitHubCreateIssueParams,
  Issue,
  GitHubCreatePRParams,
  PullRequest,
  GitHubGetCommitsParams,
  Commit,
  GitHubDeployParams,
  Deployment,
  GitHubCreateBranchParams,
  Branch,
  GitHubMergePRParams,
  MCPError,
} from '@/types/mcp';

export class GitHubMCPServerImpl extends BaseMCPServer implements GitHubMCPServer {
  private octokit: Octokit;

  constructor(config: MCPServerConfig, userId: string, credentials: MCPCredentials) {
    super(config, userId, credentials);
    this.octokit = new Octokit({ auth: this.getAccessToken() });
  }

  async validateConnection(): Promise<boolean> {
    return this.executeOperation('validateConnection', async () => {
      try {
        await this.octokit.rest.users.getAuthenticated();
        return true;
      } catch (error) {
        console.error('[GitHub] Validation failed:', error);
        return false;
      }
    });
  }

  async listRepositories(params: GitHubListReposParams = {}): Promise<Repository[]> {
    return this.executeOperation('listRepositories', async () => {
      try {
        const response = await this.octokit.rest.repos.listForAuthenticatedUser({
          type: params.type || 'owner',
          sort: params.sort || 'updated',
          per_page: params.per_page || 30,
        });

        return response.data.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          isPrivate: repo.private,
          createdAt: new Date(repo.created_at),
          updatedAt: new Date(repo.updated_at),
        }));
      } catch (error) {
        this.handleError(error, 'listRepositories');
      }
    });
  }

  async searchCode(params: GitHubSearchCodeParams): Promise<CodeSearchResult[]> {
    return this.executeOperation('searchCode', async () => {
      try {
        let searchQuery = params.query;

        if (params.repo) searchQuery += ` repo:${params.repo}`;
        if (params.language) searchQuery += ` language:${params.language}`;
        if (params.filename) searchQuery += ` filename:${params.filename}`;
        if (params.extension) searchQuery += ` extension:${params.extension}`;

        const response = await this.octokit.rest.search.code({
          q: searchQuery,
          per_page: 20,
        });

        return response.data.items.map(item => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          url: item.html_url,
          repository: {
            name: item.repository.name,
            fullName: item.repository.full_name,
          },
          score: item.score,
        }));
      } catch (error) {
        this.handleError(error, 'searchCode');
      }
    });
  }

  async createIssue(params: GitHubCreateIssueParams): Promise<Issue> {
    return this.executeOperation('createIssue', async () => {
      try {
        const [owner, repo] = params.repo.split('/');

        const response = await this.octokit.rest.issues.create({
          owner,
          repo,
          title: params.title,
          body: params.body,
          labels: params.labels,
          assignees: params.assignees,
          milestone: params.milestone,
        });

        return {
          id: response.data.id,
          number: response.data.number,
          title: response.data.title,
          body: response.data.body,
          state: response.data.state as 'open' | 'closed',
          url: response.data.html_url,
          createdAt: new Date(response.data.created_at),
          updatedAt: new Date(response.data.updated_at),
        };
      } catch (error) {
        this.handleError(error, 'createIssue');
      }
    });
  }

  async createPullRequest(params: GitHubCreatePRParams): Promise<PullRequest> {
    return this.executeOperation('createPullRequest', async () => {
      try {
        const [owner, repo] = params.repo.split('/');

        const response = await this.octokit.rest.pulls.create({
          owner,
          repo,
          title: params.title,
          body: params.body,
          head: params.head,
          base: params.base,
          draft: params.draft,
        });

        return {
          id: response.data.id,
          number: response.data.number,
          title: response.data.title,
          body: response.data.body,
          state: response.data.state as 'open' | 'closed',
          url: response.data.html_url,
          head: response.data.head.ref,
          base: response.data.base.ref,
          createdAt: new Date(response.data.created_at),
          updatedAt: new Date(response.data.updated_at),
          mergedAt: response.data.merged_at ? new Date(response.data.merged_at) : undefined,
        };
      } catch (error) {
        this.handleError(error, 'createPullRequest');
      }
    });
  }

  async getCommits(params: GitHubGetCommitsParams): Promise<Commit[]> {
    return this.executeOperation('getCommits', async () => {
      try {
        const [owner, repo] = params.repo.split('/');

        const response = await this.octokit.rest.repos.listCommits({
          owner,
          repo,
          sha: params.branch,
          since: params.since?.toISOString(),
          until: params.until?.toISOString(),
          author: params.author,
          per_page: 50,
        });

        return response.data.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: {
            name: commit.commit.author?.name || 'Unknown',
            email: commit.commit.author?.email || '',
            date: new Date(commit.commit.author?.date || Date.now()),
          },
          url: commit.html_url,
        }));
      } catch (error) {
        this.handleError(error, 'getCommits');
      }
    });
  }

  async triggerDeployment(params: GitHubDeployParams): Promise<Deployment> {
    return this.executeOperation('triggerDeployment', async () => {
      try {
        const [owner, repo] = params.repo.split('/');

        const response = await this.octokit.rest.repos.createDeployment({
          owner,
          repo,
          ref: params.ref || 'main',
          environment: params.environment,
          payload: params.payload,
          auto_merge: false,
        });

        if ('id' in response.data) {
          return {
            id: response.data.id,
            sha: response.data.sha,
            ref: response.data.ref,
            environment: response.data.environment,
            createdAt: new Date(response.data.created_at),
          };
        }

        throw new Error('Failed to create deployment');
      } catch (error) {
        this.handleError(error, 'triggerDeployment');
      }
    });
  }

  async createBranch(params: GitHubCreateBranchParams): Promise<Branch> {
    return this.executeOperation('createBranch', async () => {
      try {
        const [owner, repo] = params.repo.split('/');

        // Get the SHA of the branch to create from
        const fromBranch = params.fromBranch || 'main';
        const refResponse = await this.octokit.rest.git.getRef({
          owner,
          repo,
          ref: `heads/${fromBranch}`,
        });

        const sha = refResponse.data.object.sha;

        // Create new branch
        await this.octokit.rest.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${params.branchName}`,
          sha,
        });

        return {
          name: params.branchName,
          sha,
          protected: false,
        };
      } catch (error) {
        this.handleError(error, 'createBranch');
      }
    });
  }

  async mergePullRequest(params: GitHubMergePRParams): Promise<PullRequest> {
    return this.executeOperation('mergePullRequest', async () => {
      try {
        const [owner, repo] = params.repo.split('/');

        await this.octokit.rest.pulls.merge({
          owner,
          repo,
          pull_number: params.pullNumber,
          commit_title: params.commitTitle,
          commit_message: params.commitMessage,
          merge_method: params.mergeMethod || 'merge',
        });

        // Get updated PR info
        const prResponse = await this.octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: params.pullNumber,
        });

        return {
          id: prResponse.data.id,
          number: prResponse.data.number,
          title: prResponse.data.title,
          body: prResponse.data.body,
          state: prResponse.data.merged ? 'merged' : prResponse.data.state as 'open' | 'closed',
          url: prResponse.data.html_url,
          head: prResponse.data.head.ref,
          base: prResponse.data.base.ref,
          createdAt: new Date(prResponse.data.created_at),
          updatedAt: new Date(prResponse.data.updated_at),
          mergedAt: prResponse.data.merged_at ? new Date(prResponse.data.merged_at) : undefined,
        };
      } catch (error) {
        this.handleError(error, 'mergePullRequest');
      }
    });
  }

  async handleWebhook(payload: any): Promise<void> {
    console.log('[GitHub] Received webhook:', payload.action);
    // TODO: Implement webhook handling logic
  }
}
