'use client';

/**
 * Complete Integrated Dashboard
 * Showcases all 10 systems working together in one unified interface
 */

import React, { useState, useEffect } from 'react';
import {
  useUser,
  useBilling,
  useAnalytics,
  useProjects,
  useTeams,
  useContent,
  useAI,
  useChat,
} from '@/contexts/AppProvider';

export function CompleteIntegratedDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'content' | 'team' | 'settings'>('overview');

  // All system contexts
  const { user, profile, signOut } = useUser();
  const { subscription, quotas, quotaPercentageUsed, isNearQuotaLimit, getCurrentPlan } = useBilling();
  const { usageStats, trackPageView } = useAnalytics();
  const { projects, currentProject, setCurrentProject } = useProjects();
  const { teams, currentTeam, setCurrentTeam } = useTeams();
  const { artifacts, files, mcpConnections } = useContent();
  const { selectedModel, availableModels, sessionCost, setSelectedModel } = useAI();
  const { messages, sendMessage, isStreaming, isConnected } = useChat();

  const currentPlan = getCurrentPlan();

  // Track page view on mount
  useEffect(() => {
    trackPageView('integrated_dashboard');
  }, [trackPageView]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please sign in</h2>
          <p className="mt-2 text-gray-600">Sign in to access the Nexus AI platform</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Navigation */}
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">Nexus AI</h1>
              <nav className="flex space-x-4">
                {['overview', 'chat', 'content', 'team', 'settings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === tab
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Quota Indicator */}
              <div className="text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        isNearQuotaLimit ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, quotaPercentageUsed)}%` }}
                    />
                  </div>
                  <span className="text-gray-600">
                    {quotas?.apiQuotaRemaining}/{quotas?.apiQuotaLimit}
                  </span>
                </div>
              </div>

              {/* Subscription Badge */}
              <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs font-medium">
                {subscription?.tier.toUpperCase() || 'FREE'}
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{profile?.full_name || user.email}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                {profile?.avatar_url && (
                  <img src={profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full" />
                )}
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            subscription={subscription}
            quotas={quotas}
            usageStats={usageStats}
            projects={projects}
            teams={teams}
            artifacts={artifacts}
            files={files}
            mcpConnections={mcpConnections}
            currentPlan={currentPlan}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            messages={messages}
            sendMessage={sendMessage}
            isStreaming={isStreaming}
            isConnected={isConnected}
            selectedModel={selectedModel}
            availableModels={availableModels}
            setSelectedModel={setSelectedModel}
            sessionCost={sessionCost}
            currentProject={currentProject}
            projects={projects}
            setCurrentProject={setCurrentProject}
          />
        )}

        {activeTab === 'content' && (
          <ContentTab
            artifacts={artifacts}
            files={files}
            mcpConnections={mcpConnections}
          />
        )}

        {activeTab === 'team' && (
          <TeamTab
            teams={teams}
            currentTeam={currentTeam}
            setCurrentTeam={setCurrentTeam}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            user={user}
            profile={profile}
            subscription={subscription}
            quotas={quotas}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ subscription, quotas, usageStats, projects, teams, artifacts, files, mcpConnections, currentPlan }: any) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="API Usage"
          value={`${quotas?.apiQuotaUsed || 0}`}
          subtitle={`of ${quotas?.apiQuotaLimit || 0} requests`}
          trend={usageStats ? `${usageStats.totalRequests} total` : undefined}
        />
        <StatCard
          title="Projects"
          value={projects.length}
          subtitle="Active projects"
          trend={`${teams.length} teams`}
        />
        <StatCard
          title="Content"
          value={artifacts.length + files.length}
          subtitle={`${artifacts.length} artifacts, ${files.length} files`}
          trend={`${mcpConnections.length} connections`}
        />
        <StatCard
          title="Total Cost"
          value={`$${(usageStats?.totalCost || 0).toFixed(2)}`}
          subtitle="This month"
          trend={currentPlan ? `${currentPlan.name} Plan` : undefined}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton title="New Chat" icon="💬" />
          <QuickActionButton title="Upload File" icon="📁" />
          <QuickActionButton title="Create Artifact" icon="⚡" />
          <QuickActionButton title="Connect Tool" icon="🔗" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {artifacts.slice(0, 5).map((artifact: any) => (
            <div key={artifact.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="font-medium text-gray-900">{artifact.title}</div>
                <div className="text-sm text-gray-500">{artifact.type} • {artifact.language}</div>
              </div>
              <div className="text-sm text-gray-400">{new Date(artifact.updatedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CHAT TAB
// ============================================================================

function ChatTab({ messages, sendMessage, isStreaming, isConnected, selectedModel, availableModels, setSelectedModel, sessionCost, currentProject, projects, setCurrentProject }: any) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isStreaming) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <div className="col-span-3 bg-white rounded-lg shadow p-4 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 mb-4">Configuration</h3>

        {/* Project Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
          <select
            value={currentProject?.id || ''}
            onChange={(e) => {
              const project = projects.find((p: any) => p.id === e.target.value);
              setCurrentProject(project);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">No Project</option>
            {projects.map((project: any) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>

        {/* Model Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
          <select
            value={selectedModel || ''}
            onChange={(e) => setSelectedModel(e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Smart Router</option>
            {availableModels.slice(0, 10).map((model: any) => (
              <option key={model.id} value={model.id}>
                {model.name} (${model.inputCost}/1K)
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Session Cost:</span>
            <span className="font-medium">${sessionCost.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="col-span-9 bg-white rounded-lg shadow flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.cost && (
                  <div className="text-xs mt-1 opacity-70">
                    ${message.cost.toFixed(4)} • {message.model}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={isStreaming}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONTENT TAB
// ============================================================================

function ContentTab({ artifacts, files, mcpConnections }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'artifacts' | 'files' | 'mcp'>('artifacts');

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b">
        {['artifacts', 'files', 'mcp'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab as any)}
            className={`px-4 py-2 font-medium ${
              activeSubTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({
              tab === 'artifacts' ? artifacts.length :
              tab === 'files' ? files.length :
              mcpConnections.length
            })
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activeSubTab === 'artifacts' && (
          <div className="divide-y">
            {artifacts.map((artifact: any) => (
              <div key={artifact.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{artifact.title}</div>
                    <div className="text-sm text-gray-500">{artifact.type} • {artifact.language} • v{artifact.version}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                      Execute
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'files' && (
          <div className="divide-y">
            {files.map((file: any) => (
              <div key={file.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{file.fileName}</div>
                    <div className="text-sm text-gray-500">
                      {file.category} • {(file.fileSize / 1024).toFixed(2)} KB • {file.status}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                      Process
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'mcp' && (
          <div className="divide-y">
            {mcpConnections.map((connection: any) => (
              <div key={connection.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{connection.serverId}</div>
                    <div className="text-sm text-gray-500">
                      Status: {connection.status} • Last used: {connection.lastUsed ? new Date(connection.lastUsed).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">
                      Execute
                    </button>
                    <button className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TEAM TAB
// ============================================================================

function TeamTab({ teams, currentTeam, setCurrentTeam }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Teams</h2>
        <div className="space-y-3">
          {teams.map((team: any) => (
            <div
              key={team.id}
              className={`p-4 border rounded-lg cursor-pointer ${
                currentTeam?.id === team.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setCurrentTeam(team)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{team.name}</div>
                  <div className="text-sm text-gray-500">{team.description || 'No description'}</div>
                </div>
                <div className="text-sm text-gray-500">{team.memberCount || 0} members</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

function SettingsTab({ user, profile, subscription, quotas }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="text-gray-900">{user.email}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <div className="text-gray-900">{profile?.full_name || 'Not set'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Subscription</label>
            <div className="text-gray-900">{subscription?.tier || 'free'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage & Quotas</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">API Requests</span>
              <span className="text-gray-900">{quotas?.apiQuotaUsed}/{quotas?.apiQuotaLimit}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${(quotas?.apiQuotaUsed / quotas?.apiQuotaLimit) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Storage</span>
              <span className="text-gray-900">
                {((quotas?.storageQuotaUsed || 0) / 1024 / 1024).toFixed(2)} MB /
                {((quotas?.storageQuotaLimit || 0) / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${((quotas?.storageQuotaUsed || 0) / (quotas?.storageQuotaLimit || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatCard({ title, value, subtitle, trend }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm font-medium text-gray-600">{title}</div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
      {trend && <div className="mt-2 text-xs text-blue-600">{trend}</div>}
    </div>
  );
}

function QuickActionButton({ title, icon }: any) {
  return (
    <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-gray-900">{title}</div>
    </button>
  );
}
