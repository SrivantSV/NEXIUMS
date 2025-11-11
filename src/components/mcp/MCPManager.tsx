/**
 * MCP Manager Component
 * Main UI for managing MCP server connections
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MCPConnection, MCPServerConfig } from '@/types/mcp';
import { Search, RefreshCw, Check, Plus, Settings } from 'lucide-react';

interface MCPManagerProps {
  userId: string;
}

export function MCPManager({ userId }: MCPManagerProps) {
  const [connectedServers, setConnectedServers] = useState<MCPConnection[]>([]);
  const [availableServers, setAvailableServers] = useState<MCPServerConfig[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load available servers
      const serversResponse = await fetch('/api/mcp/servers');
      const serversData = await serversResponse.json();
      if (serversData.success) {
        setAvailableServers(serversData.servers);
      }

      // Load connected servers
      const connectionsResponse = await fetch('/api/mcp/connections', {
        headers: {
          'x-user-id': userId,
        },
      });
      const connectionsData = await connectionsResponse.json();
      if (connectionsData.success) {
        setConnectedServers(connectionsData.connections);
      }
    } catch (error) {
      console.error('Failed to load MCP data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter servers
  const filteredServers = useMemo(() => {
    return availableServers.filter(server => {
      const matchesCategory = selectedCategory === 'all' || server.category === selectedCategory;
      const matchesSearch =
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [availableServers, selectedCategory, searchQuery]);

  // Get categories
  const categories = useMemo(() => {
    const cats = new Set(availableServers.map(s => s.category));
    return ['all', ...Array.from(cats)];
  }, [availableServers]);

  const handleConnect = async (server: MCPServerConfig) => {
    try {
      // Start OAuth flow
      window.location.href = `/api/auth/oauth/${server.id}`;
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await fetch(`/api/mcp/connections?id=${connectionId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });
      await loadData();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleTest = async (connectionId: string) => {
    console.log('Testing connection:', connectionId);
    // TODO: Implement test connection
  };

  const isConnected = (serverId: string) => {
    return connectedServers.some(c => c.serverId === serverId && c.status === 'connected');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MCP Integrations</h2>
          <p className="text-muted-foreground mt-1">
            Connect external tools and services to enhance your AI conversations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {connectedServers.filter(c => c.status === 'connected').length} Connected
          </Badge>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Connected servers */}
      {connectedServers.filter(c => c.status === 'connected').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Connected Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedServers
              .filter(c => c.status === 'connected')
              .map(connection => {
                const server = availableServers.find(s => s.id === connection.serverId);
                if (!server) return null;

                return (
                  <ConnectedServerCard
                    key={connection.id}
                    server={server}
                    connection={connection}
                    onDisconnect={() => handleDisconnect(connection.id)}
                    onTest={() => handleTest(connection.id)}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* Available servers */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          {connectedServers.length > 0 ? 'Available Integrations' : 'Get Started'}
        </h3>
        {filteredServers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No integrations found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map(server => (
              <MCPServerCard
                key={server.id}
                server={server}
                isConnected={isConnected(server.id)}
                onConnect={() => handleConnect(server)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Server Card Component
function MCPServerCard({
  server,
  isConnected,
  onConnect,
}: {
  server: MCPServerConfig;
  isConnected: boolean;
  onConnect: () => void;
}) {
  return (
    <Card className="group hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: server.color + '20' }}
          >
            {server.icon ? '🔗' : server.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{server.name}</CardTitle>
            <CardDescription className="capitalize">{server.category}</CardDescription>
          </div>
          {server.isEnterprise && (
            <Badge variant="outline" className="text-xs">
              Enterprise
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {server.description}
        </p>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1 mb-3">
          {server.capabilities.slice(0, 3).map(capability => (
            <Badge key={capability.id} variant="secondary" className="text-xs">
              {capability.name}
            </Badge>
          ))}
          {server.capabilities.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{server.capabilities.length - 3} more
            </Badge>
          )}
        </div>

        {/* Rate limit info */}
        {server.rateLimit && (
          <div className="text-xs text-muted-foreground">
            Rate limit: {server.rateLimit.requests}/{server.rateLimit.period}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={onConnect}
          disabled={isConnected}
          className="w-full"
          variant={isConnected ? 'secondary' : 'default'}
        >
          {isConnected ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Connected
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Connected Server Card Component
function ConnectedServerCard({
  server,
  connection,
  onDisconnect,
  onTest,
}: {
  server: MCPServerConfig;
  connection: MCPConnection;
  onDisconnect: () => void;
  onTest: () => void;
}) {
  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: server.color + '20' }}
          >
            {server.icon ? '🔗' : server.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{server.name}</CardTitle>
            <CardDescription className="text-xs text-green-600 dark:text-green-400">
              Connected {new Date(connection.connectedAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            <Check className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {connection.lastUsedAt && (
          <p className="text-xs text-muted-foreground">
            Last used: {new Date(connection.lastUsedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button onClick={onTest} variant="outline" size="sm" className="flex-1">
          <Settings className="w-4 h-4 mr-2" />
          Test
        </Button>
        <Button onClick={onDisconnect} variant="destructive" size="sm" className="flex-1">
          Disconnect
        </Button>
      </CardFooter>
    </Card>
  );
}
