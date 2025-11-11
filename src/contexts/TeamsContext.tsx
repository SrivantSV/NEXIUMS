'use client';

/**
 * Teams Context
 * Manages team/workspace state and collaboration features
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  joinedAt: string;
  user?: {
    email: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface TeamsContextType {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;

  // Team operations
  setCurrentTeam: (teamId: string | null) => void;
  createTeam: (data: Partial<Team>) => Promise<Team | null>;
  updateTeam: (teamId: string, data: Partial<Team>) => Promise<boolean>;
  deleteTeam: (teamId: string) => Promise<boolean>;
  refreshTeams: () => Promise<void>;

  // Member operations
  inviteMember: (teamId: string, email: string, role: string) => Promise<boolean>;
  removeMember: (teamId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (teamId: string, userId: string, role: string) => Promise<boolean>;
  getTeamMembers: (teamId: string) => Promise<void>;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTeams();
    } else {
      setTeams([]);
      setCurrentTeamState(null);
      setTeamMembers([]);
      setLoading(false);
    }
  }, [user]);

  const loadTeams = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/workspaces?userId=' + user.id);

      if (!response.ok) {
        throw new Error('Failed to load teams');
      }

      const data = await response.json();
      setTeams(data.data || []);

      const savedTeamId = localStorage.getItem('currentTeamId');
      if (savedTeamId) {
        const team = (data.data || []).find((t: Team) => t.id === savedTeamId);
        if (team) {
          setCurrentTeamState(team);
          await getTeamMembers(team.id);
        }
      }
    } catch (err: any) {
      console.error('Error loading teams:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentTeam = useCallback(async (teamId: string | null) => {
    if (!teamId) {
      setCurrentTeamState(null);
      setTeamMembers([]);
      localStorage.removeItem('currentTeamId');
      return;
    }

    const team = teams.find(t => t.id === teamId);
    if (team) {
      setCurrentTeamState(team);
      localStorage.setItem('currentTeamId', teamId);
      await getTeamMembers(teamId);
    }
  }, [teams]);

  const createTeam = async (data: Partial<Team>): Promise<Team | null> => {
    if (!user) return null;

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          ownerId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create team');
      }

      const result = await response.json();
      const newTeam = result.data;

      setTeams(prev => [...prev, newTeam]);
      return newTeam;
    } catch (err: any) {
      console.error('Error creating team:', err);
      setError(err.message);
      return null;
    }
  };

  const updateTeam = async (teamId: string, data: Partial<Team>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workspaces/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update team');
      }

      const result = await response.json();
      const updatedTeam = result.data;

      setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));

      if (currentTeam?.id === teamId) {
        setCurrentTeamState(updatedTeam);
      }

      return true;
    } catch (err: any) {
      console.error('Error updating team:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteTeam = async (teamId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workspaces/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      setTeams(prev => prev.filter(t => t.id !== teamId));

      if (currentTeam?.id === teamId) {
        setCurrentTeamState(null);
        setTeamMembers([]);
        localStorage.removeItem('currentTeamId');
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting team:', err);
      setError(err.message);
      return false;
    }
  };

  const refreshTeams = async () => {
    await loadTeams();
  };

  const inviteMember = async (teamId: string, email: string, role: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workspaces/${teamId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to invite member');
      }

      return true;
    } catch (err: any) {
      console.error('Error inviting member:', err);
      setError(err.message);
      return false;
    }
  };

  const removeMember = async (teamId: string, userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workspaces/${teamId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      setTeamMembers(prev => prev.filter(m => m.userId !== userId));
      return true;
    } catch (err: any) {
      console.error('Error removing member:', err);
      setError(err.message);
      return false;
    }
  };

  const updateMemberRole = async (teamId: string, userId: string, role: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/workspaces/${teamId}/members/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to update member role');
      }

      const result = await response.json();
      setTeamMembers(prev => prev.map(m => m.userId === userId ? result.data : m));

      return true;
    } catch (err: any) {
      console.error('Error updating member role:', err);
      setError(err.message);
      return false;
    }
  };

  const getTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${teamId}/members`);

      if (!response.ok) {
        throw new Error('Failed to load team members');
      }

      const result = await response.json();
      setTeamMembers(result.data || []);
    } catch (err: any) {
      console.error('Error loading team members:', err);
      setError(err.message);
    }
  };

  const value: TeamsContextType = {
    teams,
    currentTeam,
    teamMembers,
    loading,
    error,
    setCurrentTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    refreshTeams,
    inviteMember,
    removeMember,
    updateMemberRole,
    getTeamMembers,
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
