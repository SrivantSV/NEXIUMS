'use client';

/**
 * Unified App Provider
 * Combines all context providers in the correct order
 */

import React from 'react';
import { UserProvider } from './UserContext';
import { AIProvider } from './AIContext';
import { ChatProvider } from './ChatContext';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AIProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </AIProvider>
    </UserProvider>
  );
}

/**
 * Hook to use all contexts together
 */
export { useUser } from './UserContext';
export { useAI } from './AIContext';
export { useChat } from './ChatContext';
