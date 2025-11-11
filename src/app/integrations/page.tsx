/**
 * MCP Integrations Page
 */

import { MCPManager } from '@/components/mcp/MCPManager';

export default function IntegrationsPage() {
  // TODO: Get actual user ID from session/auth
  const userId = 'demo-user';

  return (
    <div className="min-h-screen bg-background">
      <MCPManager userId={userId} />
    </div>
  );
}
