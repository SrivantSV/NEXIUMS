'use client';

/**
 * User Context Provider
 * Provides authentication state and user profile throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/database.types';

export interface UserContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;

  // User data
  subscription: {
    tier: 'free' | 'pro' | 'team' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
  } | null;
  quotas: {
    monthly_requests: number;
    api_quota_limit: number;
    remaining: number;
  } | null;

  // Actions
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Load user profile
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
    }
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    router.push('/auth/signin');
  }, [supabase, router]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;

        setProfile(data);
        return data;
      } catch (error) {
        console.error('Failed to update profile:', error);
        return null;
      }
    },
    [user, supabase]
  );

  // Compute subscription info
  const subscription = profile
    ? {
        tier: profile.subscription_tier,
        status: profile.subscription_status,
      }
    : null;

  // Compute quotas
  const quotas = profile
    ? {
        monthly_requests: profile.monthly_requests || 0,
        api_quota_limit: profile.api_quota_limit || 100,
        remaining: (profile.api_quota_limit || 100) - (profile.monthly_requests || 0),
      }
    : null;

  const value: UserContextType = {
    user,
    session,
    profile,
    loading,
    subscription,
    quotas,
    signOut,
    refreshProfile,
    updateProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
