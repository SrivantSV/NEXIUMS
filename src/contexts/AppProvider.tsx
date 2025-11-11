'use client';

/**
 * Unified App Provider
 * Combines all context providers in the correct order
 *
 * Provider Hierarchy:
 * 1. UserProvider - Authentication and user data (foundation)
 * 2. BillingProvider - Subscription and quota management (depends on user)
 * 3. AnalyticsProvider - Event tracking (depends on user, tracks billing)
 * 4. ProjectsProvider - Project and memory management (depends on user)
 * 5. TeamsProvider - Team collaboration (depends on user, projects)
 * 6. AIProvider - AI model selection and cost tracking (depends on billing)
 * 7. ChatProvider - Chat and real-time (depends on AI, projects, teams)
 */

import React from 'react';
import { UserProvider } from './UserContext';
import { BillingProvider } from './BillingContext';
import { AnalyticsProvider } from './AnalyticsContext';
import { ProjectsProvider } from './ProjectsContext';
import { TeamsProvider } from './TeamsContext';
import { AIProvider } from './AIContext';
import { ChatProvider } from './ChatContext';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <BillingProvider>
        <AnalyticsProvider>
          <ProjectsProvider>
            <TeamsProvider>
              <AIProvider>
                <ChatProvider>
                  {children}
                </ChatProvider>
              </AIProvider>
            </TeamsProvider>
          </ProjectsProvider>
        </AnalyticsProvider>
      </BillingProvider>
    </UserProvider>
  );
}

/**
 * Export all hooks for easy access
 */
export { useUser } from './UserContext';
export { useBilling } from './BillingContext';
export { useAnalytics } from './AnalyticsContext';
export { useProjects } from './ProjectsContext';
export { useTeams } from './TeamsContext';
export { useAI } from './AIContext';
export { useChat } from './ChatContext';
