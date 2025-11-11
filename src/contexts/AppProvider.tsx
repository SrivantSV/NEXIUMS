'use client';

/**
 * Unified App Provider
 * Combines all 10 system context providers in the correct dependency order
 *
 * Dependency Order:
 * 1. User (Authentication) - Base layer, required by all
 * 2. Billing - Depends on User
 * 3. Analytics - Depends on User
 * 4. Projects - Depends on User
 * 5. Teams - Depends on User
 * 6. Content (Artifacts/Files/MCP) - Depends on User
 * 7. AI - Depends on User, Billing (quota checks)
 * 8. Chat - Depends on User, AI, Content, Projects, Teams
 */

import React from 'react';
import { UserProvider } from './UserContext';
import { BillingProvider } from './BillingContext';
import { AnalyticsProvider } from './AnalyticsContext';
import { ProjectsProvider } from './ProjectsContext';
import { TeamsProvider } from './TeamsContext';
import { ContentProvider } from './ContentContext';
import { AIProvider } from './AIContext';
import { ChatProvider } from './ChatContext';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <BillingProvider>
        <AnalyticsProvider>
          <ProjectsProvider>
            <TeamsProvider>
              <ContentProvider>
                <AIProvider>
                  <ChatProvider>
                    {children}
                  </ChatProvider>
                </AIProvider>
              </ContentProvider>
            </TeamsProvider>
          </ProjectsProvider>
        </AnalyticsProvider>
      </BillingProvider>
    </UserProvider>
  );
}

/**
 * Export all context hooks for easy access
 */
export { useUser } from './UserContext';
export { useBilling } from './BillingContext';
export { useAnalytics } from './AnalyticsContext';
export { useProjects } from './ProjectsContext';
export { useTeams } from './TeamsContext';
export { useContent } from './ContentContext';
export { useAI } from './AIContext';
export { useChat } from './ChatContext';
