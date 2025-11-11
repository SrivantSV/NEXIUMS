/**
 * MCP Orchestrator
 * Main engine that coordinates MCP servers and executes workflows
 */

import {
  ClassifiedIntent,
  ConversationContext,
  MCPConnection,
  MCPResponse,
  MCPServer,
  WorkflowStepResult,
  MCPWorkflow,
  WorkflowStep,
  MCPError,
} from '@/types/mcp';
import { IntentClassifier } from './intent-classifier';
import { WorkflowEngine } from './workflow-engine';
import { MCPConnectionManager } from './connection-manager';

export class MCPOrchestrator {
  private connectionManager: MCPConnectionManager;
  private intentClassifier: IntentClassifier;
  private workflowEngine: WorkflowEngine;
  private serverInstances: Map<string, MCPServer>;

  constructor() {
    this.connectionManager = new MCPConnectionManager();
    this.intentClassifier = new IntentClassifier();
    this.workflowEngine = new WorkflowEngine();
    this.serverInstances = new Map();
  }

  /**
   * Process user request and execute appropriate MCP actions
   */
  async processUserRequest(
    request: string,
    userId: string,
    context: ConversationContext
  ): Promise<MCPResponse> {
    try {
      console.log(`[Orchestrator] Processing request for user ${userId}: "${request}"`);

      // 1. Analyze intent and extract tool requirements
      const intent = await this.intentClassifier.analyze(request, context);
      console.log(`[Orchestrator] Classified intent:`, intent);

      // 2. Determine which MCP servers to use
      const requiredServers = intent.requiredServers;
      if (requiredServers.length === 0) {
        return {
          success: false,
          error: 'No suitable MCP servers found for this request',
          timestamp: new Date(),
        };
      }

      // 3. Check permissions and availability
      const availableServers = await this.checkServerAvailability(
        requiredServers,
        userId
      );

      if (availableServers.length === 0) {
        return {
          success: false,
          error: `Required servers not connected: ${requiredServers.join(', ')}`,
          timestamp: new Date(),
        };
      }

      // 4. Execute workflow
      if (intent.isMultiStep) {
        return await this.executeWorkflow(intent, availableServers, userId);
      } else {
        return await this.executeSingleAction(intent, availableServers[0], userId);
      }
    } catch (error) {
      console.error('[Orchestrator] Error processing request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute multi-step workflow
   */
  private async executeWorkflow(
    intent: ClassifiedIntent,
    servers: MCPConnection[],
    userId: string
  ): Promise<MCPResponse> {
    console.log(`[Orchestrator] Executing multi-step workflow`);

    // Create workflow
    const workflow = await this.workflowEngine.createWorkflow(intent, servers);
    console.log(`[Orchestrator] Created workflow with ${workflow.steps.length} steps`);

    const results: WorkflowStepResult[] = [];
    let context: any = {};

    // Execute steps
    for (const step of workflow.steps) {
      try {
        console.log(`[Orchestrator] Executing step: ${step.id} (${step.action})`);

        // Check dependencies
        if (step.dependsOn) {
          const dependenciesMet = step.dependsOn.every(depId =>
            results.find(r => r.stepId === depId && r.success)
          );

          if (!dependenciesMet) {
            console.log(`[Orchestrator] Step ${step.id} dependencies not met, skipping`);
            continue;
          }
        }

        // Execute step
        const stepResult = await this.executeStep(step, context, userId);
        results.push(stepResult);

        // Update context for next steps
        if (stepResult.success && stepResult.output) {
          context = { ...context, [step.id]: stepResult.output };
        }

        // Check for early termination
        if (stepResult.shouldTerminate) {
          console.log(`[Orchestrator] Step ${step.id} requested termination`);
          break;
        }
      } catch (error) {
        console.error(`[Orchestrator] Error executing step ${step.id}:`, error);

        results.push({
          stepId: step.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });

        // Decide whether to continue or fail
        if (step.required) {
          return {
            success: false,
            workflowId: workflow.id,
            results,
            error: `Required step failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
          };
        }
      }
    }

    // Generate summary
    const summary = await this.generateWorkflowSummary(results);

    return {
      success: results.some(r => r.success),
      workflowId: workflow.id,
      results,
      summary,
      timestamp: new Date(),
    };
  }

  /**
   * Execute single MCP action
   */
  private async executeSingleAction(
    intent: ClassifiedIntent,
    connection: MCPConnection,
    userId: string
  ): Promise<MCPResponse> {
    console.log(`[Orchestrator] Executing single action on ${connection.serverName}`);

    try {
      const server = await this.getServerInstance(connection, userId);
      const action = this.mapIntentToAction(intent.primary);

      // Execute action based on server type
      const result = await this.executeServerAction(
        server,
        connection.serverId,
        action,
        intent.parameters
      );

      return {
        success: true,
        data: result,
        summary: `Successfully executed ${action} on ${connection.serverName}`,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[Orchestrator] Error executing action:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute a workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    context: any,
    userId: string
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();

    try {
      // Get connection and server instance
      const connection = await this.connectionManager.getConnection(
        userId,
        step.serverId
      );

      if (!connection) {
        throw new Error(`Server ${step.serverId} not connected`);
      }

      const server = await this.getServerInstance(connection, userId);

      // Merge step parameters with context
      const parameters = {
        ...step.parameters,
        ...this.extractContextParameters(context, step),
      };

      // Execute action
      const output = await this.executeServerAction(
        server,
        step.serverId,
        step.action,
        parameters
      );

      const duration = Date.now() - startTime;

      return {
        stepId: step.id,
        success: true,
        output,
        timestamp: new Date(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Orchestrator] Step ${step.id} failed:`, error);

      return {
        stepId: step.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration,
      };
    }
  }

  /**
   * Execute action on specific server
   */
  private async executeServerAction(
    server: MCPServer,
    serverId: string,
    action: string,
    parameters: any
  ): Promise<any> {
    // This would call the appropriate method on the server based on action
    // For now, we'll add a generic execute method
    if (typeof (server as any)[action] === 'function') {
      return await (server as any)[action](parameters);
    }

    throw new Error(`Action ${action} not supported on ${serverId}`);
  }

  /**
   * Check server availability
   */
  private async checkServerAvailability(
    requiredServers: string[],
    userId: string
  ): Promise<MCPConnection[]> {
    const available: MCPConnection[] = [];

    for (const serverId of requiredServers) {
      const connection = await this.connectionManager.getConnection(userId, serverId);

      if (connection && connection.status === 'connected') {
        available.push(connection);
      }
    }

    return available;
  }

  /**
   * Get or create server instance
   */
  private async getServerInstance(
    connection: MCPConnection,
    userId: string
  ): Promise<MCPServer> {
    const cacheKey = `${userId}-${connection.serverId}`;

    if (this.serverInstances.has(cacheKey)) {
      return this.serverInstances.get(cacheKey)!;
    }

    // Create new server instance
    const server = await this.connectionManager.createServerInstance(connection);
    this.serverInstances.set(cacheKey, server);

    return server;
  }

  /**
   * Map intent to action name
   */
  private mapIntentToAction(intent: string): string {
    const mapping: Record<string, string> = {
      'github-search': 'searchCode',
      'github-create-issue': 'createIssue',
      'github-create-pr': 'createPullRequest',
      'github-list-repos': 'listRepositories',
      'slack-send-message': 'sendMessage',
      'slack-search': 'searchMessages',
      'notion-search': 'searchPages',
      'notion-create': 'createPage',
      'linear-create-issue': 'createIssue',
      'gdrive-search': 'searchFiles',
    };

    return mapping[intent] || 'execute';
  }

  /**
   * Extract parameters from workflow context
   */
  private extractContextParameters(context: any, step: WorkflowStep): any {
    const params: any = {};

    // Check if step depends on previous steps
    if (step.dependsOn) {
      for (const depId of step.dependsOn) {
        if (context[depId]) {
          // Extract relevant data from dependent step
          params[`${depId}_result`] = context[depId];
        }
      }
    }

    return params;
  }

  /**
   * Generate workflow summary
   */
  private async generateWorkflowSummary(
    results: WorkflowStepResult[]
  ): Promise<string> {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    let summary = `Workflow completed: ${successful}/${total} steps successful`;

    if (failed > 0) {
      summary += `, ${failed} failed`;
    }

    // Add details about key steps
    const keyResults = results.filter(r => r.success && r.output);
    if (keyResults.length > 0) {
      summary += '\n\nKey results:\n';
      for (const result of keyResults.slice(0, 3)) {
        summary += `- Step ${result.stepId}: Success (${result.duration}ms)\n`;
      }
    }

    return summary;
  }

  /**
   * Get connection manager (for external use)
   */
  getConnectionManager(): MCPConnectionManager {
    return this.connectionManager;
  }

  /**
   * Get workflow engine (for external use)
   */
  getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }
}
