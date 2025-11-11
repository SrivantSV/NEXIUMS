'use client';

/**
 * Teams Context
 * Manages team workspaces, members, and collaboration features
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
  user?: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

interface TeamsContextType {
  // Teams
  teams: Team[];
  currentTeam: Team | null;
  loadingTeams: boolean;

  // Team actions
  createTeam: (data: { name: string; description?: string }) => Promise<Team | null>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<boolean>;
  deleteTeam: (id: string) => Promise<boolean>;
  setCurrentTeam: (team: Team | null) => void;
  switchTeam: (teamId: string) => Promise<boolean>;
  leaveTeam: (teamId: string) => Promise<boolean>;

  // Members
  members: TeamMember[];
  loadingMembers: boolean;
  inviteMembers: (teamId: string, emails: string[], role: 'admin' | 'member' | 'viewer') => Promise<boolean>;
  removeMember: (teamId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (teamId: string, userId: string, role: TeamMember['role']) => Promise<boolean>;

  // Invitations
  invitations: TeamInvitation[];
  loadingInvitations: boolean;
  cancelInvitation: (invitationId: string) => Promise<boolean>;

  // Permissions
  canInviteMembers: boolean;
  canManageTeam: boolean;
  canDeleteTeam: boolean;
  currentUserRole: TeamMember['role'] | null;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Load teams
  const loadTeams = useCallback(async () => {
    try {
      setLoadingTeams(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTeams([]);
        setCurrentUserId(null);
        return;
      }

      setCurrentUserId(user.id);

      // Get teams where user is a member
      const { data: memberships, error: membershipsError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (membershipsError) {
        console.error('Error loading team memberships:', membershipsError);
        return;
      }

      const teamIds = memberships?.map(m => m.team_id) || [];

      if (teamIds.length === 0) {
        setTeams([]);
        return;
      }

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds)
        .order('updated_at', { ascending: false });

      if (teamsError) {
        console.error('Error loading teams:', teamsError);
        return;
      }

      const teams = (teamsData || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        ownerId: t.owner_id,
        settings: t.settings || {},
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      setTeams(teams);

      // Auto-select first team if none selected
      if (!currentTeam && teams.length > 0) {
        setCurrentTeamState(teams[0]);
      }
    } catch (error) {
      console.error('Error in loadTeams:', error);
    } finally {
      setLoadingTeams(false);
    }
  }, [supabase, currentTeam]);

  // Load members
  const loadMembers = useCallback(async (teamId: string) => {
    try {
      setLoadingMembers(true);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:user_profiles(email, full_name, avatar_url)
        `)
        .eq('team_id', teamId);

      if (error) {
        console.error('Error loading members:', error);
        return;
      }

      const membersData = (data || []).map((m: any) => ({
        id: m.id,
        teamId: m.team_id,
        userId: m.user_id,
        role: m.role,
        joinedAt: m.joined_at,
        user: m.user ? {
          email: m.user.email,
          fullName: m.user.full_name,
          avatarUrl: m.user.avatar_url,
        } : undefined,
      }));

      setMembers(membersData);
    } catch (error) {
      console.error('Error in loadMembers:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [supabase]);

  // Load invitations
  const loadInvitations = useCallback(async (teamId: string) => {
    try {
      setLoadingInvitations(true);
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invitations:', error);
        return;
      }

      const invitationsData = (data || []).map((i: any) => ({
        id: i.id,
        teamId: i.team_id,
        email: i.email,
        role: i.role,
        status: i.status,
        createdAt: i.created_at,
        expiresAt: i.expires_at,
      }));

      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error in loadInvitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  }, [supabase]);

  // Create team
  const createTeam = useCallback(async (data: { name: string; description?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          name: data.name,
          description: data.description || null,
          owner_id: user.id,
          settings: {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating team:', error);
        return null;
      }

      // Add creator as owner member
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
      });

      const newTeam: Team = {
        id: team.id,
        name: team.name,
        description: team.description,
        ownerId: team.owner_id,
        settings: team.settings || {},
        createdAt: team.created_at,
        updatedAt: team.updated_at,
      };

      setTeams(prev => [newTeam, ...prev]);
      return newTeam;
    } catch (error) {
      console.error('Error in createTeam:', error);
      return null;
    }
  }, [supabase]);

  // Update team
  const updateTeam = useCallback(async (id: string, data: Partial<Team>) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: data.name,
          description: data.description,
          settings: data.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating team:', error);
        return false;
      }

      setTeams(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      if (currentTeam?.id === id) {
        setCurrentTeamState(prev => prev ? { ...prev, ...data } : null);
      }
      return true;
    } catch (error) {
      console.error('Error in updateTeam:', error);
      return false;
    }
  }, [supabase, currentTeam]);

  // Delete team
  const deleteTeam = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting team:', error);
        return false;
      }

      setTeams(prev => prev.filter(t => t.id !== id));
      if (currentTeam?.id === id) {
        setCurrentTeamState(null);
      }
      return true;
    } catch (error) {
      console.error('Error in deleteTeam:', error);
      return false;
    }
  }, [supabase, currentTeam]);

  // Set current team
  const setCurrentTeam = useCallback((team: Team | null) => {
    setCurrentTeamState(team);
    if (team) {
      loadMembers(team.id);
      loadInvitations(team.id);
    } else {
      setMembers([]);
      setInvitations([]);
    }
  }, [loadMembers, loadInvitations]);

  // Switch team
  const switchTeam = useCallback(async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setCurrentTeam(team);
      return true;
    }
    return false;
  }, [teams, setCurrentTeam]);

  // Leave team
  const leaveTeam = useCallback(async (teamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving team:', error);
        return false;
      }

      setTeams(prev => prev.filter(t => t.id !== teamId));
      if (currentTeam?.id === teamId) {
        setCurrentTeamState(null);
      }
      return true;
    } catch (error) {
      console.error('Error in leaveTeam:', error);
      return false;
    }
  }, [supabase, currentTeam]);

  // Invite members
  const inviteMembers = useCallback(async (teamId: string, emails: string[], role: 'admin' | 'member' | 'viewer') => {
    try {
      const invitations = emails.map(email => ({
        team_id: teamId,
        email,
        role,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }));

      const { error } = await supabase
        .from('team_invitations')
        .insert(invitations);

      if (error) {
        console.error('Error inviting members:', error);
        return false;
      }

      // Reload invitations
      if (teamId === currentTeam?.id) {
        loadInvitations(teamId);
      }

      return true;
    } catch (error) {
      console.error('Error in inviteMembers:', error);
      return false;
    }
  }, [supabase, currentTeam, loadInvitations]);

  // Remove member
  const removeMember = useCallback(async (teamId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        return false;
      }

      setMembers(prev => prev.filter(m => m.userId !== userId));
      return true;
    } catch (error) {
      console.error('Error in removeMember:', error);
      return false;
    }
  }, [supabase]);

  // Update member role
  const updateMemberRole = useCallback(async (teamId: string, userId: string, role: TeamMember['role']) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating member role:', error);
        return false;
      }

      setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role } : m));
      return true;
    } catch (error) {
      console.error('Error in updateMemberRole:', error);
      return false;
    }
  }, [supabase]);

  // Cancel invitation
  const cancelInvitation = useCallback(async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error canceling invitation:', error);
        return false;
      }

      setInvitations(prev => prev.filter(i => i.id !== invitationId));
      return true;
    } catch (error) {
      console.error('Error in cancelInvitation:', error);
      return false;
    }
  }, [supabase]);

  // Calculate permissions
  const currentUserRole = members.find(m => m.userId === currentUserId)?.role || null;
  const canInviteMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canDeleteTeam = currentUserRole === 'owner';

  // Load teams on mount
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Load members and invitations when team changes
  useEffect(() => {
    if (currentTeam) {
      loadMembers(currentTeam.id);
      loadInvitations(currentTeam.id);
    }
  }, [currentTeam, loadMembers, loadInvitations]);

  const value: TeamsContextType = {
    teams,
    currentTeam,
    loadingTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    setCurrentTeam,
    switchTeam,
    leaveTeam,
    members,
    loadingMembers,
    inviteMembers,
    removeMember,
    updateMemberRole,
    invitations,
    loadingInvitations,
    cancelInvitation,
    canInviteMembers,
    canManageTeam,
    canDeleteTeam,
    currentUserRole,
  };

  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamsProvider');
  }
  return context;
}
