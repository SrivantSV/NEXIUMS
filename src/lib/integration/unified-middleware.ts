/**
 * Unified Integration Middleware
 * Extends the base API middleware with cross-system integration features
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Extended user context with all system data
 */
export interface UnifiedUserContext {
  // Core auth (from existing middleware)
  userId: string;
  email: string;
  profile: any;
  subscription: any;
  quotas: any;
  preferences: any;

  // Extended system context
  projects: {
    currentProject: any | null;
    projectCount: number;
  };
  teams: {
    currentTeam: any | null;
    teamCount: number;
    role: string | null;
  };
  content: {
    artifactCount: number;
    fileCount: number;
    mcpConnectionCount: number;
  };
  analytics: {
    todayUsage: number;
    weekUsage: number;
    monthUsage: number;
  };
}

/**
 * Load extended user context with data from all systems
 */
export async function getUnifiedUserContext(userId: string): Promise<UnifiedUserContext | null> {
  try {
    const supabase = await createClient();

    // Get base user data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) return null;

    // Get projects data
    const { data: projects, count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    const currentProject = projects && projects.length > 0 ? projects[0] : null;

    // Get teams data
    const { data: teamMemberships, count: teamCount } = await supabase
      .from('team_members')
      .select('team_id, role', { count: 'exact' })
      .eq('user_id', userId);

    const currentTeamMembership = teamMemberships && teamMemberships.length > 0 ? teamMemberships[0] : null;
    let currentTeam = null;
    if (currentTeamMembership) {
      const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', currentTeamMembership.team_id)
        .single();
      currentTeam = team;
    }

    // Get content stats
    const { count: artifactCount } = await supabase
      .from('artifacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: fileCount } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: mcpConnectionCount } = await supabase
      .from('mcp_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get analytics data
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { count: todayUsage } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    const { count: weekUsage } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString());

    const { count: monthUsage } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthAgo.toISOString());

    return {
      userId,
      email: profile.email,
      profile,
      subscription: subscription || {
        tier: 'free',
        status: 'active',
      },
      quotas: {
        api_quota_limit: profile.api_quota_limit || 100,
        api_quota_used: profile.monthly_requests || 0,
        api_quota_remaining: Math.max(0, (profile.api_quota_limit || 100) - (profile.monthly_requests || 0)),
        storage_quota_limit: profile.storage_quota_limit || 100 * 1024 * 1024,
        storage_quota_used: profile.storage_used || 0,
      },
      preferences: profile.preferences || {},
      projects: {
        currentProject,
        projectCount: projectCount || 0,
      },
      teams: {
        currentTeam,
        teamCount: teamCount || 0,
        role: currentTeamMembership?.role || null,
      },
      content: {
        artifactCount: artifactCount || 0,
        fileCount: fileCount || 0,
        mcpConnectionCount: mcpConnectionCount || 0,
      },
      analytics: {
        todayUsage: todayUsage || 0,
        weekUsage: weekUsage || 0,
        monthUsage: monthUsage || 0,
      },
    };
  } catch (error) {
    console.error('Error getting unified user context:', error);
    return null;
  }
}

/**
 * Track cross-system event
 */
export async function trackCrossSystemEvent(params: {
  userId: string;
  eventType: string;
  systemsInvolved: string[];
  metadata?: Record<string, any>;
}) {
  try {
    const supabase = await createClient();

    await supabase.from('user_activity_log').insert({
      user_id: params.userId,
      activity_type: params.eventType,
      details: {
        systems: params.systemsInvolved,
        ...params.metadata,
      },
      created_at: new Date().toISOString(),
    });

    // Also track in analytics
    await supabase.from('analytics_events').insert({
      user_id: params.userId,
      event_type: params.eventType,
      event_data: {
        systems: params.systemsInvolved,
        ...params.metadata,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking cross-system event:', error);
  }
}

/**
 * Update cross-system quotas
 */
export async function updateCrossSystemQuotas(userId: string, updates: {
  incrementApiUsage?: boolean;
  incrementStorage?: number;
  incrementFileCount?: boolean;
  incrementArtifactCount?: boolean;
}) {
  try {
    const supabase = await createClient();

    if (updates.incrementApiUsage) {
      await supabase.rpc('increment_user_requests', { p_user_id: userId });
    }

    if (updates.incrementStorage && updates.incrementStorage > 0) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('storage_used')
        .eq('user_id', userId)
        .single();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({
            storage_used: (profile.storage_used || 0) + updates.incrementStorage,
          })
          .eq('user_id', userId);
      }
    }

    // Track quota update event
    await trackCrossSystemEvent({
      userId,
      eventType: 'quota_update',
      systemsInvolved: ['billing', 'analytics'],
      metadata: updates,
    });
  } catch (error) {
    console.error('Error updating cross-system quotas:', error);
  }
}

/**
 * Check cross-system permissions
 */
export async function checkCrossSystemPermissions(params: {
  userId: string;
  action: string;
  resourceType: 'project' | 'team' | 'artifact' | 'file' | 'mcp';
  resourceId?: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const supabase = await createClient();

    // Check subscription tier for resource limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', params.userId)
      .single();

    const tier = subscription?.tier || 'free';

    // Check team permissions if team resource
    if (params.resourceType === 'team' && params.resourceId) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', params.resourceId)
        .eq('user_id', params.userId)
        .single();

      if (!membership) {
        return { allowed: false, reason: 'Not a team member' };
      }

      // Check role permissions
      if (params.action === 'delete' && membership.role !== 'owner') {
        return { allowed: false, reason: 'Only team owner can delete' };
      }

      if (params.action === 'invite' && !['owner', 'admin'].includes(membership.role)) {
        return { allowed: false, reason: 'Only owner/admin can invite members' };
      }
    }

    // Check quota limits
    const context = await getUnifiedUserContext(params.userId);
    if (!context) {
      return { allowed: false, reason: 'Could not load user context' };
    }

    if (params.action === 'create') {
      // Check if user has quota for creating new resources
      if (params.resourceType === 'project' && tier === 'free' && context.projects.projectCount >= 3) {
        return { allowed: false, reason: 'Free tier limited to 3 projects. Upgrade to create more.' };
      }

      if (params.resourceType === 'team' && tier === 'free') {
        return { allowed: false, reason: 'Teams require Pro tier or higher' };
      }

      if (params.resourceType === 'file') {
        if (context.quotas.storage_quota_used >= context.quotas.storage_quota_limit) {
          return { allowed: false, reason: 'Storage quota exceeded' };
        }
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking cross-system permissions:', error);
    return { allowed: false, reason: 'Error checking permissions' };
  }
}

/**
 * Unified error handler for all systems
 */
export function handleUnifiedError(error: any, context: {
  system: string;
  action: string;
  userId?: string;
}) {
  console.error(`Error in ${context.system}.${context.action}:`, error);

  // Track error in analytics
  if (context.userId) {
    trackCrossSystemEvent({
      userId: context.userId,
      eventType: 'error',
      systemsInvolved: [context.system],
      metadata: {
        action: context.action,
        error: error.message,
        stack: error.stack,
      },
    }).catch(console.error);
  }

  // Return standardized error response
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        system: context.system,
        action: context.action,
      },
    },
    { status: error.status || 500 }
  );
}

/**
 * Unified success response
 */
export function unifiedSuccessResponse(data: any, meta?: {
  system: string;
  action: string;
  userId?: string;
}) {
  if (meta?.userId) {
    trackCrossSystemEvent({
      userId: meta.userId,
      eventType: 'success',
      systemsInvolved: [meta.system],
      metadata: {
        action: meta.action,
      },
    }).catch(console.error);
  }

  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      system: meta?.system,
      action: meta?.action,
    },
  });
}
