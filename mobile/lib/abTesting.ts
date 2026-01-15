/**
 * A/B Testing Framework
 *
 * Provides client-side A/B testing functionality with:
 * - Consistent user assignment to variants
 * - Remote configuration support
 * - Analytics integration
 * - Feature flag support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const AB_STORAGE_KEY = 'ps_ab_tests';
const USER_ID_KEY = 'ps_ab_user_id';

// ============================================================================
// Types
// ============================================================================

export type VariantValue = string | number | boolean | Record<string, unknown> | null;

export interface Variant<T extends VariantValue = VariantValue> {
  id: string;
  name: string;
  value: T;
  weight: number; // 0-1, relative to other variants
}

export interface Experiment<T extends VariantValue = VariantValue> {
  id: string;
  name: string;
  description: string;
  variants: Variant<T>[];
  startDate?: string;
  endDate?: string;
  targeting?: {
    userProperties?: Record<string, unknown>;
    percentage?: number; // Rollout percentage (0-100)
  };
  isActive: boolean;
}

export interface ABTestConfig {
  experiments: Record<string, Experiment>;
  lastUpdated: string;
}

export interface UserAssignment {
  userId: string;
  assignments: Record<string, {
    variantId: string;
    assignedAt: string;
  }>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_EXPERIMENTS: ABTestConfig = {
  experiments: {
    // AI enhancement button placement
    ai_button_placement: {
      id: 'ai_button_placement',
      name: 'AI Enhancement Button Placement',
      description: 'Test whether placing the AI button at the top or bottom of the editor increases usage',
      variants: [
        { id: 'top', name: 'Top Button', value: 'top', weight: 0.5 },
        { id: 'bottom', name: 'Bottom Button', value: 'bottom', weight: 0.5 },
      ],
      isActive: true,
    },
    // Daily intention reminder timing
    intention_reminder_time: {
      id: 'intention_reminder_time',
      name: 'Daily Intention Reminder Time',
      description: 'Test optimal time for daily intention reminders',
      variants: [
        { id: 'morning', name: 'Morning (8am)', value: '08:00', weight: 0.33 },
        { id: 'midday', name: 'Midday (12pm)', value: '12:00', weight: 0.33 },
        { id: 'evening', name: 'Evening (6pm)', value: '18:00', weight: 0.34 },
      ],
      isActive: true,
    },
    // Onboarding flow length
    onboarding_length: {
      id: 'onboarding_length',
      name: 'Onboarding Flow Length',
      description: 'Test short vs detailed onboarding',
      variants: [
        { id: 'short', name: 'Quick Onboarding', value: 'short', weight: 0.5 },
        { id: 'detailed', name: 'Detailed Onboarding', value: 'detailed', weight: 0.5 },
      ],
      isActive: true,
    },
    // Story card layout
    story_card_layout: {
      id: 'story_card_layout',
      name: 'Story Card Layout',
      description: 'Test different story card layouts',
      variants: [
        { id: 'compact', name: 'Compact', value: 'compact', weight: 0.5 },
        { id: 'detailed', name: 'Detailed with preview', value: 'detailed', weight: 0.5 },
      ],
      isActive: true,
    },
    // Gamification elements visibility
    gamification_visibility: {
      id: 'gamification_visibility',
      name: 'Gamification Elements',
      description: 'Test showing/hiding gamification elements',
      variants: [
        { id: 'visible', name: 'Show gamification', value: true, weight: 0.7 },
        { id: 'hidden', name: 'Hide gamification', value: false, weight: 0.3 },
      ],
      isActive: true,
    },
  },
  lastUpdated: new Date().toISOString(),
};

// ============================================================================
// A/B Testing Manager
// ============================================================================

class ABTestingManager {
  private config: ABTestConfig = DEFAULT_EXPERIMENTS;
  private userId: string | null = null;
  private assignment: UserAssignment | null = null;
  private remoteConfigUrl: string | null = null;
  private initialized = false;

  /**
   * Initialize the A/B testing framework
   */
  async initialize(remoteConfigUrl?: string): Promise<void> {
    if (this.initialized) return;

    this.remoteConfigUrl = remoteConfigUrl || null;

    try {
      // Get or create user ID for consistent assignments
      let storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      if (!storedUserId) {
        storedUserId = uuidv4();
        await AsyncStorage.setItem(USER_ID_KEY, storedUserId);
      }
      this.userId = storedUserId;

      // Load stored assignments
      const storedAssignment = await AsyncStorage.getItem(AB_STORAGE_KEY);
      if (storedAssignment) {
        this.assignment = JSON.parse(storedAssignment) as UserAssignment;
      } else {
        // Create new assignment
        this.assignment = {
          userId: this.userId,
          assignments: {},
        };
      }

      // Try to fetch remote config
      if (this.remoteConfigUrl) {
        await this.fetchRemoteConfig();
      }

      this.initialized = true;
    } catch (error) {
      console.error('[ABTesting] Failed to initialize:', error);
      // Use defaults on error
      this.userId = uuidv4();
      this.assignment = {
        userId: this.userId,
        assignments: {},
      };
    }
  }

  /**
   * Fetch remote configuration
   */
  async fetchRemoteConfig(): Promise<void> {
    if (!this.remoteConfigUrl) return;

    try {
      const response = await fetch(this.remoteConfigUrl);
      if (response.ok) {
        const remoteConfig = (await response.json()) as ABTestConfig;
        this.config = remoteConfig;
      }
    } catch (error) {
      console.error('[ABTesting] Failed to fetch remote config:', error);
    }
  }

  /**
   * Get the variant assigned to the user for an experiment
   */
  getVariant<T extends VariantValue = VariantValue>(
    experimentId: string
  ): Variant<T> | null {
    if (!this.initialized || !this.assignment) {
      console.warn('[ABTesting] Not initialized');
      return null;
    }

    const experiment = this.config.experiments[experimentId];
    if (!experiment) {
      console.warn(`[ABTesting] Experiment not found: ${experimentId}`);
      return null;
    }

    // Check if experiment is active and within date range
    if (!experiment.isActive) return null;
    if (experiment.startDate && new Date(experiment.startDate) > new Date()) return null;
    if (experiment.endDate && new Date(experiment.endDate) < new Date()) return null;

    // Check targeting
    if (experiment.targeting?.percentage && Math.random() * 100 > experiment.targeting.percentage) {
      return null;
    }

    // Return existing assignment if exists
    const existingAssignment = this.assignment.assignments[experimentId];
    if (existingAssignment) {
      const variant = experiment.variants.find((v) => v.id === existingAssignment.variantId);
      if (variant) return variant as Variant<T>;
    }

    // Assign new variant
    const variant = this.assignVariant(experiment);
    if (variant) {
      this.assignment.assignments[experimentId] = {
        variantId: variant.id,
        assignedAt: new Date().toISOString(),
      };
      this.saveAssignment();
    }

    return variant as Variant<T>;
  }

  /**
   * Get the value of the assigned variant
   */
  getVariantValue<T extends VariantValue = VariantValue>(
    experimentId: string,
    defaultValue?: T
  ): T | null {
    const variant = this.getVariant<T>(experimentId);
    return variant?.value ?? defaultValue ?? null;
  }

  /**
   * Check if user is in a specific variant
   */
  isVariant(experimentId: string, variantId: string): boolean {
    const variant = this.getVariant(experimentId);
    return variant?.id === variantId;
  }

  /**
   * Assign a variant based on weighted distribution
   */
  private assignVariant(experiment: Experiment): Variant | null {
    if (experiment.variants.length === 0) return null;
    if (experiment.variants.length === 1) return experiment.variants[0];

    // Normalize weights
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    const normalizedVariants = experiment.variants.map((v) => ({
      ...v,
      weight: v.weight / totalWeight,
    }));

    // Use consistent hashing with user ID
    const hash = this.hashString(this.userId + experiment.id);
    const random = hash / 0xffffffff; // Normalize to 0-1

    let accumulatedWeight = 0;
    for (const variant of normalizedVariants) {
      accumulatedWeight += variant.weight;
      if (random <= accumulatedWeight) {
        return variant;
      }
    }

    return normalizedVariants[normalizedVariants.length - 1];
  }

  /**
   * Simple hash function for consistent assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Save assignment to storage
   */
  private async saveAssignment(): Promise<void> {
    if (!this.assignment) return;
    try {
      await AsyncStorage.setItem(AB_STORAGE_KEY, JSON.stringify(this.assignment));
    } catch (error) {
      console.error('[ABTesting] Failed to save assignment:', error);
    }
  }

  /**
   * Get all current assignments
   */
  getAssignments(): Record<string, string> {
    if (!this.assignment) return {};
    const result: Record<string, string> = {};
    for (const [experimentId, assignment] of Object.entries(this.assignment.assignments)) {
      result[experimentId] = assignment.variantId;
    }
    return result;
  }

  /**
   * Get user ID (for analytics integration)
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Reset all assignments (for testing)
   */
  async resetAssignments(): Promise<void> {
    this.assignment = {
      userId: this.userId || uuidv4(),
      assignments: {},
    };
    await this.saveAssignment();
  }

  /**
   * Override configuration (for testing or remote updates)
   */
  setConfig(config: Partial<ABTestConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      experiments: {
        ...this.config.experiments,
        ...(config.experiments || {}),
      },
    };
  }

  /**
   * Get all experiments
   */
  getExperiments(): Record<string, Experiment> {
    return this.config.experiments;
  }

  /**
   * Get a specific experiment
   */
  getExperiment(experimentId: string): Experiment | null {
    return this.config.experiments[experimentId] || null;
  }

  /**
   * Track exposure event for analytics
   */
  trackExposure(experimentId: string, variantId: string): void {
    // This would integrate with your analytics system
    console.log(`[ABTesting] Exposure: ${experimentId} -> ${variantId}`);
    // Example: analytics.track('ab_test_exposure', { experimentId, variantId });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const abTestingManager = new ABTestingManager();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Initialize A/B testing
 */
export const initABTesting = (remoteConfigUrl?: string) =>
  abTestingManager.initialize(remoteConfigUrl);

/**
 * Get variant for an experiment
 */
export const getVariant = <T extends VariantValue = VariantValue>(
  experimentId: string
): Variant<T> | null => abTestingManager.getVariant<T>(experimentId);

/**
 * Get variant value
 */
export const getVariantValue = <T extends VariantValue = VariantValue>(
  experimentId: string,
  defaultValue?: T
): T | null => abTestingManager.getVariantValue<T>(experimentId, defaultValue);

/**
 * Check if user is in specific variant
 */
export const isVariant = (experimentId: string, variantId: string): boolean =>
  abTestingManager.isVariant(experimentId, variantId);

/**
 * Get all assignments
 */
export const getABAssignments = () => abTestingManager.getAssignments();

/**
 * Reset assignments
 */
export const resetABAssignments = () => abTestingManager.resetAssignments();

/**
 * Get experiments
 */
export const getExperiments = () => abTestingManager.getExperiments();

/**
 * Track exposure
 */
export const trackABExposure = (experimentId: string, variantId: string) =>
  abTestingManager.trackExposure(experimentId, variantId);

/**
 * Get manager instance (for advanced usage)
 */
export const getABManager = () => abTestingManager;

export default abTestingManager;
