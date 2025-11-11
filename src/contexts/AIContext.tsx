'use client';

/**
 * AI Context Provider
 * Manages AI model selection, preferences, and cost tracking
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser } from './UserContext';
import type { ModelConfig } from '@/lib/ai/types';

export interface AIContextType {
  // Model selection
  selectedModel: string | null;
  availableModels: ModelConfig[];
  setSelectedModel: (modelId: string | null) => void;

  // Preferences
  useSmartRouter: boolean;
  setUseSmartRouter: (use: boolean) => void;
  preferredModels: string[];
  setPreferredModels: (models: string[]) => void;

  // Cost tracking
  sessionCost: number;
  totalCost: number;
  resetSessionCost: () => void;

  // Model filtering
  filterByCapability: (capability: string) => ModelConfig[];
  filterByProvider: (provider: string) => ModelConfig[];

  // Loading states
  loadingModels: boolean;
  error: Error | null;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useUser();

  // Model selection state
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Preferences
  const [useSmartRouter, setUseSmartRouter] = useState(true);
  const [preferredModels, setPreferredModels] = useState<string[]>([]);

  // Cost tracking
  const [sessionCost, setSessionCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // Load available models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingModels(true);
        const response = await fetch('/api/ai/models');
        if (!response.ok) throw new Error('Failed to load models');
        const data = await response.json();
        setAvailableModels(data.models || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, []);

  // Initialize preferences from user profile
  useEffect(() => {
    if (profile) {
      setUseSmartRouter(profile.default_smart_router ?? true);
      setPreferredModels(profile.preferred_models || []);
    }
  }, [profile]);

  // Update preferred models in profile
  const updatePreferredModels = useCallback(
    async (models: string[]) => {
      setPreferredModels(models);
      if (user && profile) {
        try {
          await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              preferred_models: models,
            }),
          });
        } catch (error) {
          console.error('Failed to update preferred models:', error);
        }
      }
    },
    [user, profile]
  );

  // Update smart router preference
  const updateSmartRouter = useCallback(
    async (use: boolean) => {
      setUseSmartRouter(use);
      if (user && profile) {
        try {
          await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              default_smart_router: use,
            }),
          });
        } catch (error) {
          console.error('Failed to update smart router preference:', error);
        }
      }
    },
    [user, profile]
  );

  // Add cost to session
  const addCost = useCallback((cost: number) => {
    setSessionCost((prev) => prev + cost);
    setTotalCost((prev) => prev + cost);
  }, []);

  // Reset session cost
  const resetSessionCost = useCallback(() => {
    setSessionCost(0);
  }, []);

  // Filter models by capability
  const filterByCapability = useCallback(
    (capability: string): ModelConfig[] => {
      return availableModels.filter((model) => {
        const capabilities = model.capabilities as any;
        return capabilities[capability] === true;
      });
    },
    [availableModels]
  );

  // Filter models by provider
  const filterByProvider = useCallback(
    (provider: string): ModelConfig[] => {
      return availableModels.filter((model) => model.provider === provider);
    },
    [availableModels]
  );

  const value: AIContextType = {
    selectedModel,
    availableModels,
    setSelectedModel,
    useSmartRouter,
    setUseSmartRouter: updateSmartRouter,
    preferredModels,
    setPreferredModels: updatePreferredModels,
    sessionCost,
    totalCost,
    resetSessionCost,
    filterByCapability,
    filterByProvider,
    loadingModels,
    error,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

/**
 * Hook to track AI request cost
 */
export function useTrackCost() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useTrackCost must be used within an AIProvider');
  }

  return useCallback(
    (cost: number) => {
      // This will be implemented when we integrate the AIContext with cost tracking
      // For now, just log it
      console.log('Cost tracked:', cost);
    },
    []
  );
}
