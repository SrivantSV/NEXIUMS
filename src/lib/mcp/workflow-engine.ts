/**
 * Workflow Engine
 * Handles multi-step MCP workflows
 */

import { nanoid } from 'nanoid';
import {
  ClassifiedIntent,
  MCPConnection,
  MCPWorkflow,
  WorkflowStep,
  WorkflowTemplate,
} from '@/types/mcp';

export class WorkflowEngine {
  private templates: Map<string, WorkflowTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Create a workflow from intent and available servers
   */
  async createWorkflow(
    intent: ClassifiedIntent,
    servers: MCPConnection[]
  ): Promise<MCPWorkflow> {
    // Try to find matching template
    const template = this.templates.get(intent.primary);

    if (template) {
      return this.buildFromTemplate(template, intent, servers);
    }

    // Create dynamic workflow
    return this.createDynamicWorkflow(intent, servers);
  }

  /**
   * Build workflow from template
   */
  private buildFromTemplate(
    template: WorkflowTemplate,
    intent: ClassifiedIntent,
    servers: MCPConnection[]
  ): MCPWorkflow {
    // Filter steps based on available servers
    const availableServerIds = new Set(servers.map(s => s.serverId));
    const steps = template.steps.filter(step =>
      availableServerIds.has(step.serverId)
    );

    // Inject parameters from intent
    const enrichedSteps = steps.map(step => ({
      ...step,
      parameters: {
        ...step.parameters,
        ...intent.parameters,
      },
    }));

    return {
      id: nanoid(),
      name: template.name,
      intent,
      steps: enrichedSteps,
      createdAt: new Date(),
    };
  }

  /**
   * Create dynamic workflow from intent
   */
  private createDynamicWorkflow(
    intent: ClassifiedIntent,
    servers: MCPConnection[]
  ): MCPWorkflow {
    const steps: WorkflowStep[] = [];

    // Map intent to actions
    const actionMap = this.getActionMapping(intent.primary);

    for (const [serverId, action] of Object.entries(actionMap)) {
      const server = servers.find(s => s.serverId === serverId);
      if (server) {
        steps.push({
          id: nanoid(),
          serverId,
          action,
          parameters: intent.parameters,
          required: true,
        });
      }
    }

    return {
      id: nanoid(),
      name: `Dynamic workflow for ${intent.primary}`,
      intent,
      steps,
      createdAt: new Date(),
    };
  }

  /**
   * Get action mapping for intent
   */
  private getActionMapping(intent: string): Record<string, string> {
    const mappings: Record<string, Record<string, string>> = {
      'github-search': { github: 'search-code' },
      'github-create-issue': { github: 'create-issue' },
      'github-create-pr': { github: 'create-pr' },
      'github-list-repos': { github: 'list-repos' },
      'slack-send-message': { slack: 'send-message' },
      'slack-search': { slack: 'search-messages' },
      'notion-search': { notion: 'search-pages' },
      'notion-create': { notion: 'create-page' },
      'linear-create-issue': { linear: 'create-issue' },
      'gdrive-search': { 'google-drive': 'search-files' },
    };

    return mappings[intent] || {};
  }

  /**
   * Initialize workflow templates
   */
  private initializeTemplates(): void {
    // Deploy and notify workflow
    this.templates.set('deploy-and-notify', {
      id: 'deploy-and-notify',
      name: 'Deploy and Notify Team',
      intent: 'deploy-and-notify',
      description: 'Deploy application and notify team on Slack',
      steps: [
        {
          id: 'deploy',
          serverId: 'vercel',
          action: 'deploy',
          parameters: {},
          required: true,
          timeout: 300000, // 5 minutes
        },
        {
          id: 'notify-slack',
          serverId: 'slack',
          action: 'send-message',
          parameters: {},
          required: false,
          dependsOn: ['deploy'],
          timeout: 10000,
        },
        {
          id: 'update-linear',
          serverId: 'linear',
          action: 'update-issue',
          parameters: {},
          required: false,
          dependsOn: ['deploy'],
          timeout: 10000,
        },
      ],
    });

    // Create feature branch workflow
    this.templates.set('start-new-feature', {
      id: 'start-new-feature',
      name: 'Create Feature Branch and Linear Issue',
      intent: 'start-new-feature',
      description: 'Create Linear issue, GitHub branch, and notify team',
      steps: [
        {
          id: 'create-linear-issue',
          serverId: 'linear',
          action: 'create-issue',
          parameters: {},
          required: true,
          timeout: 10000,
        },
        {
          id: 'create-github-branch',
          serverId: 'github',
          action: 'create-branch',
          parameters: {},
          required: true,
          dependsOn: ['create-linear-issue'],
          timeout: 10000,
        },
        {
          id: 'notify-team',
          serverId: 'slack',
          action: 'send-message',
          parameters: {},
          required: false,
          dependsOn: ['create-github-branch'],
          timeout: 10000,
        },
      ],
    });

    // Code review workflow
    this.templates.set('request-code-review', {
      id: 'request-code-review',
      name: 'Request Code Review',
      intent: 'request-code-review',
      description: 'Create PR and notify reviewers',
      steps: [
        {
          id: 'create-pr',
          serverId: 'github',
          action: 'create-pr',
          parameters: {},
          required: true,
          timeout: 10000,
        },
        {
          id: 'notify-reviewers',
          serverId: 'slack',
          action: 'send-message',
          parameters: {},
          required: true,
          dependsOn: ['create-pr'],
          timeout: 10000,
        },
        {
          id: 'update-linear-status',
          serverId: 'linear',
          action: 'update-issue',
          parameters: { status: 'In Review' },
          required: false,
          dependsOn: ['create-pr'],
          timeout: 10000,
        },
      ],
    });

    // Document creation workflow
    this.templates.set('create-project-docs', {
      id: 'create-project-docs',
      name: 'Create Project Documentation',
      intent: 'create-project-docs',
      description: 'Create documentation in Notion and Google Drive',
      steps: [
        {
          id: 'create-notion-page',
          serverId: 'notion',
          action: 'create-page',
          parameters: {},
          required: true,
          timeout: 10000,
        },
        {
          id: 'create-gdrive-doc',
          serverId: 'google-drive',
          action: 'create-document',
          parameters: {},
          required: false,
          timeout: 10000,
        },
        {
          id: 'share-links',
          serverId: 'slack',
          action: 'send-message',
          parameters: {},
          required: true,
          dependsOn: ['create-notion-page', 'create-gdrive-doc'],
          timeout: 10000,
        },
      ],
    });

    // Bug report workflow
    this.templates.set('report-bug', {
      id: 'report-bug',
      name: 'Report Bug',
      intent: 'report-bug',
      description: 'Create bug issues in Linear and GitHub',
      steps: [
        {
          id: 'create-linear-bug',
          serverId: 'linear',
          action: 'create-issue',
          parameters: { priority: 1 },
          required: true,
          timeout: 10000,
        },
        {
          id: 'create-github-issue',
          serverId: 'github',
          action: 'create-issue',
          parameters: { labels: ['bug'] },
          required: true,
          timeout: 10000,
        },
        {
          id: 'notify-team',
          serverId: 'slack',
          action: 'send-message',
          parameters: {},
          required: true,
          dependsOn: ['create-linear-bug', 'create-github-issue'],
          timeout: 10000,
        },
      ],
    });
  }

  /**
   * Get available templates
   */
  getTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Add custom template
   */
  addTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
  }
}
