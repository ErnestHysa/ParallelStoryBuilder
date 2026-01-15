/**
 * A/B Testing Store
 *
 * Zustand store for managing A/B testing state in React components.
 * Provides reactive access to A/B test variants and assignments.
 */

import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initABTesting,
  getVariant,
  getVariantValue,
  isVariant,
  getABAssignments,
  resetABAssignments,
  getExperiments,
  trackABExposure,
  type Variant,
  type Experiment,
} from '@/lib/abTesting';

// ============================================================================
// Types
// ============================================================================

export interface ABTestState {
  // Initialization
  initialized: boolean;
  initializing: boolean;

  // Current assignments
  assignments: Record<string, string>;

  // All experiments
  experiments: Record<string, Experiment>;

  // Actions
  init: (remoteConfigUrl?: string) => Promise<void>;
  getVariant: <T>(experimentId: string) => Variant<T> | null;
  getVariantValue: <T>(experimentId: string, defaultValue?: T) => T | null;
  isVariant: (experimentId: string, variantId: string) => boolean;
  reset: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  trackExposure: (experimentId: string, variantId: string) => void;
}

// ============================================================================
// Create Store
// ============================================================================

export const useABTestStore = create<ABTestState>()(
  persist(
    (set, get) => ({
      // State
      initialized: false,
      initializing: false,
      assignments: {},
      experiments: {},

      // Initialize A/B testing
      init: async (remoteConfigUrl?: string) => {
        const { initializing } = get();
        if (initializing) return;

        set({ initializing: true });

        try {
          await initABTesting(remoteConfigUrl);

          set({
            initialized: true,
            initializing: false,
            assignments: getABAssignments(),
            experiments: getExperiments(),
          });
        } catch (error) {
          console.error('[ABTestStore] Failed to initialize:', error);
          set({ initializing: false });
        }
      },

      // Get variant for experiment
      getVariant: <T,>(experimentId: string) => {
        const variant = getVariant<T>(experimentId);
        if (variant) {
          get().trackExposure(experimentId, variant.id);
        }
        return variant;
      },

      // Get variant value
      getVariantValue: <T,>(experimentId: string, defaultValue?: T) => {
        const value = getVariantValue<T>(experimentId, defaultValue);
        const variant = get().getVariant(experimentId);
        if (variant) {
          get().trackExposure(experimentId, variant.id);
        }
        return value;
      },

      // Check if user is in specific variant
      isVariant: (experimentId: string, variantId: string) => {
        const result = isVariant(experimentId, variantId);
        if (result) {
          get().trackExposure(experimentId, variantId);
        }
        return result;
      },

      // Reset all assignments
      reset: async () => {
        await resetABAssignments();
        set({
          assignments: {},
        });
      },

      // Refresh remote config
      refreshConfig: async () => {
        const manager = getABManager();
        if (manager) {
          await manager.fetchRemoteConfig();
          set({
            experiments: getExperiments(),
          });
        }
      },

      // Track exposure event
      trackExposure: (experimentId: string, variantId: string) => {
        trackABExposure(experimentId, variantId);
        // Update assignments if this is a new assignment
        const currentAssignments = getABAssignments();
        if (currentAssignments[experimentId] !== variantId) {
          set({
            assignments: currentAssignments,
          });
        }
      },
    }),
    {
      name: 'ps-ab-test-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        assignments: state.assignments,
      }),
    }
  )
);

// ============================================================================
// Hooks for convenience
// ============================================================================

/**
 * Hook to get the current variant for an experiment
 */
export function useVariant<T = unknown>(experimentId: string): Variant<T> | null {
  return useABTestStore((state) => state.getVariant<T>(experimentId));
}

/**
 * Hook to get the variant value
 */
export function useVariantValue<T = unknown>(
  experimentId: string,
  defaultValue?: T
): T | null {
  return useABTestStore((state) => state.getVariantValue<T>(experimentId, defaultValue));
}

/**
 * Hook to check if user is in a specific variant
 */
export function useIsVariant(experimentId: string, variantId: string): boolean {
  return useABTestStore((state) => state.isVariant(experimentId, variantId));
}

/**
 * Hook to get the variant value with a default fallback
 */
export function useVariantOrDefault<T = unknown>(
  experimentId: string,
  defaultValue: T
): T {
  const value = useVariantValue<T>(experimentId);
  return value ?? defaultValue;
}

/**
 * Hook to check if an experiment is active for the user
 */
export function useExperimentActive(experimentId: string): boolean {
  return useVariant(experimentId) !== null;
}

// ============================================================================
// React Component for Feature Flags
// ============================================================================

export interface ABTestVariantProps<T extends VariantValue = VariantValue> {
  experimentId: string;
  variantId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render based on variant
 */
export function ABTestVariant({
  experimentId,
  variantId,
  children,
  fallback = null,
}: ABTestVariantProps) {
  const isInVariant = useIsVariant(experimentId, variantId);
  return <>{isInVariant ? children : fallback}</>;
}

// ============================================================================
// React Component for Multiple Variants
// ============================================================================

export interface ABTestSwitchProps {
  experimentId: string;
  variants: Record<string, React.ReactNode>;
  fallback?: React.ReactNode;
}

/**
 * Component to render different content based on variant
 */
export function ABTestSwitch({ experimentId, variants, fallback = null }: ABTestSwitchProps) {
  const currentVariant = useVariant(experimentId);
  const variantId = currentVariant?.id;

  if (variantId && variants[variantId]) {
    return <>{variants[variantId]}</>;
  }

  return <>{fallback}</>;
}

// Re-export types from abTesting
export type { Variant, Experiment, ABTestConfig } from '@/lib/abTesting';

// Import the manager type helper
function getABManager() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const abTesting = require('@/lib/abTesting');
    return abTesting.default || abTesting;
  } catch {
    return null;
  }
}

export default useABTestStore;
