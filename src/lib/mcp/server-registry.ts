/**
 * MCP Server Registry
 * Central registry of all available MCP server configurations
 */

import { MCPServerConfig, MCPCapability } from '@/types/mcp';

export function getMCPServerConfigs(): MCPServerConfig[] {
  return [
    // ========================================================================
    // PRODUCTIVITY TOOLS
    // ========================================================================
    {
      id: 'notion',
      name: 'Notion',
      description: 'Connect to Notion workspaces for page and database management',
      category: 'productivity',
      icon: '/icons/notion.svg',
      color: '#000000',
      authType: 'oauth',
      scopes: ['read_content', 'write_content', 'read_user', 'read_comments'],
      webhookSupport: true,
      capabilities: [
        { id: 'search', name: 'Search Pages', description: 'Search across all pages', type: 'read', parameters: [], returnType: 'NotionPage[]' },
        { id: 'create-page', name: 'Create Page', description: 'Create new pages', type: 'write', parameters: [], returnType: 'NotionPage' },
        { id: 'query-database', name: 'Query Database', description: 'Query database entries', type: 'read', parameters: [], returnType: 'NotionDatabaseResult' },
      ],
      rateLimit: { requests: 3, period: 'second', windowMs: 1000 },
      docsUrl: 'https://developers.notion.com/',
    },
    {
      id: 'linear',
      name: 'Linear',
      description: 'Project and issue tracking for high-performance teams',
      category: 'productivity',
      icon: '/icons/linear.svg',
      color: '#5E6AD2',
      authType: 'oauth',
      scopes: ['read', 'write'],
      webhookSupport: true,
      capabilities: [
        { id: 'create-issue', name: 'Create Issue', description: 'Create new issues', type: 'write', parameters: [], returnType: 'LinearIssue' },
        { id: 'update-issue', name: 'Update Issue', description: 'Update existing issues', type: 'write', parameters: [], returnType: 'LinearIssue' },
        { id: 'search-issues', name: 'Search Issues', description: 'Search for issues', type: 'read', parameters: [], returnType: 'LinearIssue[]' },
      ],
      rateLimit: { requests: 10, period: 'second', windowMs: 1000 },
      docsUrl: 'https://developers.linear.app/',
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Agile project management and issue tracking',
      category: 'productivity',
      icon: '/icons/jira.svg',
      color: '#0052CC',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://developer.atlassian.com/cloud/jira/',
    },
    {
      id: 'asana',
      name: 'Asana',
      description: 'Work management platform for teams',
      category: 'productivity',
      icon: '/icons/asana.svg',
      color: '#F06A6A',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://developers.asana.com/',
    },
    {
      id: 'trello',
      name: 'Trello',
      description: 'Visual collaboration tool for boards and cards',
      category: 'productivity',
      icon: '/icons/trello.svg',
      color: '#0079BF',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://developer.atlassian.com/cloud/trello/',
    },
    {
      id: 'airtable',
      name: 'Airtable',
      description: 'Low-code platform for building collaborative apps',
      category: 'productivity',
      icon: '/icons/airtable.svg',
      color: '#18BFFF',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://airtable.com/developers',
    },
    {
      id: 'clickup',
      name: 'ClickUp',
      description: 'All-in-one productivity platform',
      category: 'productivity',
      icon: '/icons/clickup.svg',
      color: '#7B68EE',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://clickup.com/api',
    },

    // ========================================================================
    // COMMUNICATION
    // ========================================================================
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team messaging and collaboration platform',
      category: 'communication',
      icon: '/icons/slack.svg',
      color: '#4A154B',
      authType: 'oauth',
      scopes: ['chat:write', 'channels:read', 'users:read', 'files:write', 'search:read'],
      webhookSupport: true,
      capabilities: [
        { id: 'send-message', name: 'Send Message', description: 'Send messages to channels', type: 'write', parameters: [], returnType: 'SlackMessage' },
        { id: 'search', name: 'Search Messages', description: 'Search message history', type: 'read', parameters: [], returnType: 'SlackSearchResult[]' },
        { id: 'upload-file', name: 'Upload File', description: 'Upload files to channels', type: 'write', parameters: [], returnType: 'SlackFile' },
      ],
      rateLimit: { requests: 1, period: 'second', windowMs: 1000 },
      docsUrl: 'https://api.slack.com/',
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Voice, video, and text communication platform',
      category: 'communication',
      icon: '/icons/discord.svg',
      color: '#5865F2',
      authType: 'oauth',
      webhookSupport: true,
      capabilities: [],
      docsUrl: 'https://discord.com/developers',
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Business communication platform',
      category: 'communication',
      icon: '/icons/teams.svg',
      color: '#6264A7',
      authType: 'oauth',
      capabilities: [],
      isEnterprise: true,
      docsUrl: 'https://docs.microsoft.com/en-us/microsoftteams/platform/',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Email service by Google',
      category: 'communication',
      icon: '/icons/gmail.svg',
      color: '#EA4335',
      authType: 'oauth',
      scopes: ['gmail.readonly', 'gmail.send', 'gmail.modify'],
      capabilities: [],
      docsUrl: 'https://developers.google.com/gmail/api',
    },

    // ========================================================================
    // DEVELOPMENT
    // ========================================================================
    {
      id: 'github',
      name: 'GitHub',
      description: 'Code hosting platform for version control and collaboration',
      category: 'development',
      icon: '/icons/github.svg',
      color: '#181717',
      authType: 'oauth',
      scopes: ['repo', 'read:user', 'workflow'],
      webhookSupport: true,
      capabilities: [
        { id: 'search-code', name: 'Search Code', description: 'Search code across repositories', type: 'read', parameters: [], returnType: 'CodeSearchResult[]' },
        { id: 'create-issue', name: 'Create Issue', description: 'Create new issues', type: 'write', parameters: [], returnType: 'Issue' },
        { id: 'create-pr', name: 'Create PR', description: 'Create pull requests', type: 'write', parameters: [], returnType: 'PullRequest' },
        { id: 'list-repos', name: 'List Repositories', description: 'List user repositories', type: 'read', parameters: [], returnType: 'Repository[]' },
      ],
      rateLimit: { requests: 5000, period: 'hour', windowMs: 3600000 },
      docsUrl: 'https://docs.github.com/rest',
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      description: 'DevOps platform with Git repository management',
      category: 'development',
      icon: '/icons/gitlab.svg',
      color: '#FC6D26',
      authType: 'oauth',
      webhookSupport: true,
      capabilities: [],
      docsUrl: 'https://docs.gitlab.com/ee/api/',
    },
    {
      id: 'vercel',
      name: 'Vercel',
      description: 'Platform for frontend frameworks and static sites',
      category: 'development',
      icon: '/icons/vercel.svg',
      color: '#000000',
      authType: 'oauth',
      webhookSupport: true,
      capabilities: [],
      docsUrl: 'https://vercel.com/docs/rest-api',
    },
    {
      id: 'netlify',
      name: 'Netlify',
      description: 'Platform for web applications and dynamic websites',
      category: 'development',
      icon: '/icons/netlify.svg',
      color: '#00C7B7',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://docs.netlify.com/api/',
    },
    {
      id: 'docker',
      name: 'Docker Hub',
      description: 'Container image repository',
      category: 'development',
      icon: '/icons/docker.svg',
      color: '#2496ED',
      authType: 'basic',
      capabilities: [],
      docsUrl: 'https://docs.docker.com/docker-hub/api/latest/',
    },
    {
      id: 'aws',
      name: 'Amazon Web Services',
      description: 'Cloud computing platform',
      category: 'development',
      icon: '/icons/aws.svg',
      color: '#FF9900',
      authType: 'custom',
      capabilities: [],
      isEnterprise: true,
      docsUrl: 'https://docs.aws.amazon.com/',
    },

    // ========================================================================
    // DESIGN
    // ========================================================================
    {
      id: 'figma',
      name: 'Figma',
      description: 'Collaborative interface design tool',
      category: 'design',
      icon: '/icons/figma.svg',
      color: '#F24E1E',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://www.figma.com/developers/api',
    },
    {
      id: 'canva',
      name: 'Canva',
      description: 'Graphic design platform',
      category: 'design',
      icon: '/icons/canva.svg',
      color: '#00C4CC',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://www.canva.dev/',
    },

    // ========================================================================
    // STORAGE & FILES
    // ========================================================================
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Cloud storage and file synchronization service',
      category: 'storage',
      icon: '/icons/google-drive.svg',
      color: '#4285F4',
      authType: 'oauth',
      scopes: ['drive.readonly', 'drive.file', 'drive.metadata.readonly'],
      webhookSupport: true,
      capabilities: [
        { id: 'search-files', name: 'Search Files', description: 'Search for files and folders', type: 'read', parameters: [], returnType: 'DriveFile[]' },
        { id: 'create-file', name: 'Create File', description: 'Create new files', type: 'write', parameters: [], returnType: 'DriveFile' },
        { id: 'share-file', name: 'Share File', description: 'Share files with others', type: 'write', parameters: [], returnType: 'DrivePermission' },
      ],
      rateLimit: { requests: 1000, period: 'minute', windowMs: 60000 },
      docsUrl: 'https://developers.google.com/drive/api',
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'File hosting service',
      category: 'storage',
      icon: '/icons/dropbox.svg',
      color: '#0061FF',
      authType: 'oauth',
      webhookSupport: true,
      capabilities: [],
      docsUrl: 'https://www.dropbox.com/developers',
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      description: 'Microsoft cloud storage service',
      category: 'storage',
      icon: '/icons/onedrive.svg',
      color: '#0078D4',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://docs.microsoft.com/en-us/onedrive/developer/',
    },

    // ========================================================================
    // ANALYTICS
    // ========================================================================
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Web analytics service',
      category: 'analytics',
      icon: '/icons/google-analytics.svg',
      color: '#E37400',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://developers.google.com/analytics',
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      description: 'Product analytics platform',
      category: 'analytics',
      icon: '/icons/mixpanel.svg',
      color: '#7856FF',
      authType: 'api_key',
      capabilities: [],
      docsUrl: 'https://developer.mixpanel.com/',
    },

    // ========================================================================
    // BUSINESS TOOLS
    // ========================================================================
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Customer relationship management platform',
      category: 'business',
      icon: '/icons/salesforce.svg',
      color: '#00A1E0',
      authType: 'oauth',
      capabilities: [],
      isEnterprise: true,
      docsUrl: 'https://developer.salesforce.com/',
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Marketing, sales, and service software',
      category: 'business',
      icon: '/icons/hubspot.svg',
      color: '#FF7A59',
      authType: 'oauth',
      capabilities: [],
      docsUrl: 'https://developers.hubspot.com/',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing platform',
      category: 'business',
      icon: '/icons/stripe.svg',
      color: '#008CDD',
      authType: 'api_key',
      capabilities: [],
      docsUrl: 'https://stripe.com/docs/api',
    },
  ];
}

/**
 * Get server config by ID
 */
export function getServerConfig(serverId: string): MCPServerConfig | null {
  return getMCPServerConfigs().find(c => c.id === serverId) || null;
}

/**
 * Get servers by category
 */
export function getServersByCategory(category: string): MCPServerConfig[] {
  return getMCPServerConfigs().filter(c => c.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const configs = getMCPServerConfigs();
  return [...new Set(configs.map(c => c.category))];
}
