// Nexus AI - Team Collaboration Type Definitions

// ==================== TEAM WORKSPACE ====================

export interface TeamWorkspace {
  id: string;
  name: string;
  description: string;
  slug: string; // URL-friendly identifier
  avatar?: string;
  banner?: string;

  // Team Configuration
  plan: 'team' | 'enterprise';
  settings: WorkspaceSettings;
  branding: WorkspaceBranding;

  // Membership
  owner: string;
  members: TeamMember[];
  invitations: WorkspaceInvitation[];

  // Organization
  projects: string[]; // project IDs
  channels: Channel[];
  sharedResources: SharedResource[];

  // Collaboration Features
  realTimeSettings: RealTimeSettings;
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;

  // Analytics & Insights
  usage: WorkspaceUsage;
  insights: WorkspaceInsight[];

  // Billing & Quotas
  billing: WorkspaceBilling;
  quotas: WorkspaceQuotas;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export interface WorkspaceSettings {
  defaultProjectVisibility: 'private' | 'team' | 'public';
  allowMemberInvites: boolean;
  requireEmailVerification: boolean;
  enableExternalSharing: boolean;
  allowedDomains?: string[];
  ssoEnabled: boolean;
  twoFactorRequired: boolean;
}

export interface WorkspaceBranding {
  primaryColor?: string;
  logo?: string;
  favicon?: string;
  customDomain?: string;
  emailBranding?: EmailBranding;
}

export interface EmailBranding {
  fromName: string;
  replyTo: string;
  footerText?: string;
  headerImage?: string;
}

// ==================== TEAM MEMBERS ====================

export interface TeamMember {
  userId: string;
  workspaceId: string;
  role: TeamRole;
  permissions: Permission[];
  joinedAt: Date;
  lastActiveAt: Date;
  status: 'active' | 'inactive' | 'suspended';

  // Collaboration Preferences
  preferences: CollaborationPreferences;
  notificationSettings: MemberNotificationSettings;
  availability: AvailabilityStatus;
}

export interface CollaborationPreferences {
  showPresence: boolean;
  showActivity: boolean;
  enableRealTimeEditing: boolean;
  cursorColor: string;
  timezone: string;
  workingHours?: WorkingHours;
}

export interface WorkingHours {
  monday: TimeRange;
  tuesday: TimeRange;
  wednesday: TimeRange;
  thursday: TimeRange;
  friday: TimeRange;
  saturday?: TimeRange;
  sunday?: TimeRange;
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string;
  enabled: boolean;
}

export interface AvailabilityStatus {
  status: 'available' | 'busy' | 'away' | 'offline';
  customMessage?: string;
  until?: Date;
}

// ==================== ROLES & PERMISSIONS ====================

export interface TeamRole {
  id: string;
  name: string;
  description: string;
  level: number; // hierarchy level (0-100)
  permissions: Permission[];
  isCustom: boolean;
  isSystemRole: boolean;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  resource: PermissionResource;
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
}

export type PermissionResource =
  | 'workspace'
  | 'project'
  | 'conversation'
  | 'artifact'
  | 'file'
  | 'member'
  | 'billing'
  | 'settings'
  | 'analytics'
  | 'integrations'
  | 'api_keys';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'share'
  | 'export'
  | 'invite'
  | 'manage'
  | 'admin';

export interface PermissionCondition {
  type: 'owner' | 'creator' | 'assigned' | 'custom';
  value?: any;
}

// ==================== INVITATIONS ====================

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  token: string;
  message?: string;
}

// ==================== CHANNELS ====================

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  icon?: string;

  // Members
  members: string[]; // user IDs

  // Organization
  parentId?: string; // for nested channels
  position: number;

  // Settings
  archived: boolean;
  muted: string[]; // user IDs who muted this channel

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

// ==================== SHARED RESOURCES ====================

export interface SharedResource {
  id: string;
  workspaceId: string;
  type: 'conversation' | 'artifact' | 'file' | 'document';
  resourceId: string;
  name: string;
  description?: string;

  // Access Control
  visibility: 'private' | 'team' | 'public';
  sharedWith: ResourceAccess[];

  // Metadata
  owner: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export interface ResourceAccess {
  userId?: string;
  teamId?: string;
  roleId?: string;
  permissions: PermissionAction[];
  grantedBy: string;
  grantedAt: Date;
}

// ==================== REAL-TIME COLLABORATION ====================

export interface CollaborationSession {
  id: string;
  resourceId: string;
  resourceType: 'conversation' | 'artifact' | 'document';
  workspaceId: string;
  participants: string[]; // user IDs
  state: any; // Current state of the resource
  operations: CollaborationOperation[];
  cursors: Map<string, CursorPosition>;
  selections: Map<string, TextSelection>;
  createdAt: Date;
  lastActivity: Date;
}

export interface CollaborationOperation {
  id: string;
  sessionId: string;
  userId: string;
  type: OperationType;
  timestamp: Date;
  data: any;
}

export type OperationType =
  | 'text_insert'
  | 'text_delete'
  | 'text_format'
  | 'cursor_move'
  | 'selection_change'
  | 'state_update';

export interface TextInsertOperation extends CollaborationOperation {
  type: 'text_insert';
  data: {
    position: number;
    text: string;
    format?: TextFormat;
  };
}

export interface TextDeleteOperation extends CollaborationOperation {
  type: 'text_delete';
  data: {
    position: number;
    length: number;
  };
}

export interface TextFormatOperation extends CollaborationOperation {
  type: 'text_format';
  data: {
    start: number;
    end: number;
    format: TextFormat;
  };
}

export interface TextFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface CursorPosition {
  userId: string;
  position: number;
  line?: number;
  column?: number;
  timestamp: Date;
}

export interface TextSelection {
  userId: string;
  start: number;
  end: number;
  timestamp: Date;
}

// ==================== PRESENCE ====================

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentLocation: UserLocation | null;
  activity?: string;
}

export interface UserLocation {
  type: 'workspace' | 'project' | 'conversation' | 'document';
  id: string;
  name?: string;
}

// ==================== REAL-TIME SETTINGS ====================

export interface RealTimeSettings {
  enabled: boolean;
  showCursors: boolean;
  showSelections: boolean;
  showPresence: boolean;
  conflictResolution: 'auto' | 'manual';
  autoSaveInterval: number; // seconds
}

// ==================== NOTIFICATIONS ====================

export interface NotificationSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  preferences: NotificationPreferences;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'in_app' | 'webhook';
  enabled: boolean;
  config: any;
}

export interface NotificationPreferences {
  enabled: boolean;
  enabledChannels: ('email' | 'slack' | 'in_app' | 'webhook')[];
  types: {
    [key in NotificationType]: boolean;
  };
  quietHours?: QuietHours;
  workspaces: {
    [workspaceId: string]: WorkspaceNotificationPreferences;
  };
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:MM format
  end: string;
  timezone: string;
}

export interface WorkspaceNotificationPreferences {
  enabled: boolean;
  types?: {
    [key in NotificationType]?: boolean;
  };
}

export type NotificationType =
  | 'member_joined'
  | 'member_left'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'role_changed'
  | 'permission_changed'
  | 'project_created'
  | 'project_updated'
  | 'channel_created'
  | 'channel_message'
  | 'mention'
  | 'task_assigned'
  | 'comment_added'
  | 'workspace_updated'
  | 'billing_updated';

export interface MemberNotificationSettings {
  email: boolean;
  slack: boolean;
  inApp: boolean;
  mentions: boolean;
  directMessages: boolean;
  channelMessages: boolean;
  teamUpdates: boolean;
}

// ==================== NOTIFICATIONS (DETAILED) ====================

export interface NotificationRequest {
  userId: string;
  workspaceId?: string;
  type: NotificationType;
  data: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: ('email' | 'slack' | 'in_app')[];
}

export interface ProcessedNotification {
  id: string;
  userId: string;
  userEmail: string;
  workspaceId?: string;
  type: NotificationType;
  template: NotificationTemplate;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
}

export interface NotificationTemplate {
  title: string;
  message: string;
  subject?: string;
  html?: string;
  text?: string;
  blocks?: any[]; // Slack blocks
  attachments?: any[];
}

export interface NotificationResult {
  sent: boolean;
  reason?: string;
  channels?: ChannelResult[];
}

export interface ChannelResult {
  channel: string;
  success: boolean;
  error?: string;
}

// ==================== SECURITY ====================

export interface SecuritySettings {
  ipWhitelist?: string[];
  sessionTimeout: number; // minutes
  maxConcurrentSessions: number;
  auditLog: boolean;
  dataRetention: number; // days
  encryptionEnabled: boolean;
}

// ==================== USAGE & ANALYTICS ====================

export interface WorkspaceUsage {
  members: number;
  projects: number;
  conversations: number;
  artifacts: number;
  storage: number; // bytes
  apiCalls: number;
  realTimeSessions: number;
}

export interface WorkspaceInsight {
  type: 'activity' | 'collaboration' | 'engagement' | 'performance';
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  period: 'day' | 'week' | 'month' | 'year';
  timestamp: Date;
}

export interface ActivityFeed {
  id: string;
  workspaceId: string;
  userId: string;
  type: ActivityType;
  action: string;
  resource: string;
  resourceId: string;
  metadata: any;
  timestamp: Date;
}

export type ActivityType =
  | 'member'
  | 'project'
  | 'conversation'
  | 'artifact'
  | 'file'
  | 'channel'
  | 'settings'
  | 'integration';

// ==================== BILLING ====================

export interface WorkspaceBilling {
  plan: 'team' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  billingEmail: string;
  paymentMethod?: PaymentMethod;
  subscription: Subscription;
  invoices: Invoice[];
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface Subscription {
  id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  dueDate: Date;
  paidAt?: Date;
  invoiceUrl: string;
}

export interface WorkspaceQuotas {
  maxMembers: number;
  maxProjects: number;
  maxStorage: number; // bytes
  maxApiCalls: number;
  maxRealTimeSessions: number;
  customBranding: boolean;
  ssoEnabled: boolean;
  advancedAnalytics: boolean;
}

// ==================== WEBSOCKET MESSAGES ====================

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: Date;
}

export type WebSocketMessageType =
  | 'user_joined'
  | 'user_left'
  | 'operation'
  | 'cursor_update'
  | 'selection_update'
  | 'presence_update'
  | 'session_state'
  | 'new_notification'
  | 'error';

// ==================== API TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}
