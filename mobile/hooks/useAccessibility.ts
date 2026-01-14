import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AccessibilityInfo, Animated, View, Text, Platform, Easing } from 'react-native';

// Types
export type AnnouncementPriority = 'high' | 'medium' | 'low';
export type ReducedMotionSetting = 'reduce' | 'no-preference';
export type HighContrastModeSetting = 'high' | 'low' | 'no-preference';

interface AccessibilityState {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersDarkMode: boolean;
  screenReaderEnabled: boolean;
  talkBackEnabled: boolean;
  voiceOverEnabled: boolean;
  enabledAccessibilityFeatures: string[];
  reducedMotionSetting: ReducedMotionSetting;
  highContrastSetting: HighContrastModeSetting;
}

interface AnnounceOptions {
  priority?: AnnouncementPriority;
  delay?: number;
  queue?: boolean;
  interrupt?: boolean;
}

interface AnimationSettings {
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  damping?: number;
  stiffness?: number;
}

interface FocusTrapOptions {
  initialFocus?: string;
  finalFocus?: string;
  escapeCloses?: boolean;
}

/**
 * Custom hook for managing accessibility features and behaviors
 */
export const useAccessibility = () => {
  // Accessibility state
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersDarkMode: false,
    screenReaderEnabled: false,
    talkBackEnabled: false,
    voiceOverEnabled: false,
    enabledAccessibilityFeatures: [],
    reducedMotionSetting: 'no-preference',
    highContrastSetting: 'no-preference',
  });

  // Announcement queue
  const [announcementQueue, setAnnouncementQueue] = useState<Array<{
    id: string;
    message: string;
    options: AnnounceOptions;
  }>>([]);

  // Animation settings
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>({
    duration: 300,
    easing: 'ease-in-out',
  });

  // Focus trap settings
  const [focusTrap, setFocusTrap] = useState<{
    isActive: boolean;
    options: FocusTrapOptions;
  } | null>(null);

  // Ref for focus management
  const focusTrapRef = useRef<View>(null);

  // Initialize accessibility detection
  useEffect(() => {
    const initAccessibility = async () => {
      // Get initial accessibility info
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      const reduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();
      // highContrastEnabled is not available in React Native, skipping

      // Set initial state
      setAccessibilityState(prev => ({
        ...prev,
        screenReaderEnabled,
        prefersReducedMotion: reduceMotionEnabled,
        prefersHighContrast: reduceTransparencyEnabled,
        enabledAccessibilityFeatures: getEnabledFeatures({
          screenReaderEnabled,
          reduceMotionEnabled,
          reduceTransparencyEnabled,
        }),
      }));

      // Listen for accessibility changes
      const screenReaderListener = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        isEnabled => {
          setAccessibilityState(prev => ({
            ...prev,
            screenReaderEnabled: isEnabled,
          }));
        }
      );

      const reduceMotionListener = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        enabled => {
          setAccessibilityState(prev => ({
            ...prev,
            prefersReducedMotion: enabled,
          }));
          updateAnimationSettings(enabled);
        }
      );

      // Detect specific screen readers
      detectScreenReaderType();

      // Clean up listeners
      return () => {
        screenReaderListener.remove();
        reduceMotionListener.remove();
      };
    };

    initAccessibility();
  }, []);

  // Detect specific screen reader type
  const detectScreenReaderType = useCallback(() => {
    const detectTalkBack = () => {
      // This is a simplified detection - in real app, you'd need more sophisticated detection
      return Platform.OS === 'android' && accessibilityState.screenReaderEnabled;
    };

    const detectVoiceOver = () => {
      // This is a simplified detection - in real app, you'd need more sophisticated detection
      return Platform.OS === 'ios' && accessibilityState.screenReaderEnabled;
    };

    setAccessibilityState(prev => ({
      ...prev,
      talkBackEnabled: detectTalkBack(),
      voiceOverEnabled: detectVoiceOver(),
    }));
  }, [accessibilityState.screenReaderEnabled]);

  // Get enabled features
  const getEnabledFeatures = (features: {
    screenReaderEnabled: boolean;
    reduceMotionEnabled: boolean;
    reduceTransparencyEnabled: boolean;
  }): string[] => {
    const enabledFeatures: string[] = [];

    if (features.screenReaderEnabled) enabledFeatures.push('screen-reader');
    if (features.reduceMotionEnabled) enabledFeatures.push('reduce-motion');
    if (features.reduceTransparencyEnabled) enabledFeatures.push('high-contrast');

    return enabledFeatures;
  };

  // Update animation settings based on reduced motion preference
  const updateAnimationSettings = (reducedMotion: boolean) => {
    if (reducedMotion) {
      setAnimationSettings({
        duration: 150,
        easing: 'ease-in',
      });
    } else {
      setAnimationSettings({
        duration: 300,
        easing: 'ease-in-out',
      });
    }
  };

  // Announce message to screen reader
  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const id = Date.now().toString();
      const priority = options.priority || 'medium';
      const delay = options.delay || 0;
      const queue = options.queue || false;
      const interrupt = options.interrupt || false;

      const announcement = { id, message, options };

      if (interrupt) {
        // Clear queue and announce immediately
        setAnnouncementQueue([announcement]);
        performAnnouncement(announcement);
      } else if (queue) {
        // Add to queue
        setAnnouncementQueue(prev => [...prev, announcement]);
      } else {
        // Clear queue and add new announcement
        setAnnouncementQueue([announcement]);
        if (delay > 0) {
          setTimeout(() => performAnnouncement(announcement), delay);
        } else {
          performAnnouncement(announcement);
        }
      }
    },
    []
  );

  // Perform the actual announcement
  const performAnnouncement = useCallback(
    (announcement: { id: string; message: string; options: AnnounceOptions }) => {
      if (!accessibilityState.screenReaderEnabled) return;

      // Use a hidden text element for announcement
      setTimeout(() => {
        // In a real implementation, this would use a screen reader library
        // For now, we'll log the announcement
        console.log('Screen Reader Announcement:', announcement.message);

        // Remove from queue after announcement
        setAnnouncementQueue(prev =>
          prev.filter(item => item.id !== announcement.id)
        );
      }, 100);
    },
    [accessibilityState.screenReaderEnabled]
  );

  // Create animated value with reduced motion consideration
  const createAnimatedValue = useCallback(
    (initialValue: number, options?: Partial<AnimationSettings>) => {
      const animationSettings = {
        ...useAnimationSettings,
        ...options,
      };

      // Use shorter duration if reduced motion is preferred
      const duration = accessibilityState.prefersReducedMotion
        ? animationSettings.duration / 2
        : animationSettings.duration;

      return new Animated.Value(initialValue);
    },
    [accessibilityState.prefersReducedMotion]
  );

  // Animate with accessibility considerations
  const animate = useCallback(
    (
      animatedValue: Animated.Value,
      toValue: number,
      options?: Partial<AnimationSettings>
    ) => {
      const animationSettings = {
        ...useAnimationSettings,
        ...options,
      };

      const duration = accessibilityState.prefersReducedMotion
        ? animationSettings.duration / 2
        : animationSettings.duration;

      Animated.timing(animatedValue, {
        toValue,
        duration,
        easing: animationSettings.easing === 'linear'
          ? Easing.linear
          : animationSettings.easing === 'ease-in'
          ? Easing.in(Easing.ease)
          : animationSettings.easing === 'ease-out'
          ? Easing.out(Easing.ease)
          : Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    },
    [accessibilityState.prefersReducedMotion]
  );

  // Set up focus trap
  const activateFocusTrap = useCallback((options: FocusTrapOptions = {}) => {
    setFocusTrap({
      isActive: true,
      options: {
        initialFocus: undefined,
        finalFocus: undefined,
        escapeCloses: true,
        ...options,
      },
    });
  }, []);

  // Remove focus trap
  const removeFocusTrap = useCallback(() => {
    setFocusTrap(null);
  }, []);

  // Trap focus within element
  const trapFocus = useCallback((elementRef: React.RefObject<View>) => {
    if (!focusTrap?.isActive) return;

    // Implementation would depend on how focus is managed in your app
    // This is a simplified version
    const element = elementRef.current;
    if (!element) return;

    // Focus management logic would go here
    // For React Native, this might involve using the focus() method on appropriate child elements
  }, [focusTrap?.isActive]);

  // Get appropriate animation values based on accessibility preferences
  const getAnimationValue = useCallback(
    (baseValue: number, reduceMotion: boolean = accessibilityState.prefersReducedMotion) => {
      return reduceMotion ? baseValue / 2 : baseValue;
    },
    [accessibilityState.prefersReducedMotion]
  );

  // Check if element should be visible to screen readers
  const isVisibleToScreenReader = useCallback(
    (isVisible: boolean) => {
      if (!accessibilityState.screenReaderEnabled) return true;
      return isVisible;
    },
    [accessibilityState.screenReaderEnabled]
  );

  // Create accessible label
  const createAccessibleLabel = useCallback(
    (label: string, additionalInfo?: string) => {
      if (!accessibilityState.screenReaderEnabled) return label;

      if (additionalInfo) {
        return `${label}. ${additionalInfo}`;
      }
      return label;
    },
    [accessibilityState.screenReaderEnabled]
  );

  // Get appropriate font size based on accessibility preferences
  const getFontSize = useCallback(
    (baseSize: number) => {
      // In a real implementation, this would consider system font size settings
      // For now, just return the base size
      return baseSize;
    },
    []
  );

  // Announce form field validation errors
  const announceValidationError = useCallback(
    (fieldName: string, errorMessage: string) => {
      announce(
        `${fieldName} field has an error: ${errorMessage}`,
        { priority: 'high', interrupt: true }
      );
    },
    [announce]
  );

  // Announce form field completion
  const announceFieldCompletion = useCallback(
    (fieldName: string) => {
      announce(
        `${fieldName} field completed`,
        { priority: 'medium', interrupt: false }
      );
    },
    [announce]
  );

  // Announce page navigation
  const announceNavigation = useCallback(
    (pageName: string) => {
      announce(
        `Navigated to ${pageName}`,
        { priority: 'high', interrupt: true }
      );
    },
    [announce]
  );

  // Announce state changes
  const announceStateChange = useCallback(
    (elementName: string, newState: string) => {
      announce(
        `${elementName} is now ${newState}`,
        { priority: 'medium', interrupt: false }
      );
    },
    [announce]
  );

  // Get current animation settings
  const getAnimationSettings = useCallback(() => {
    return animationSettings;
  }, [animationSettings]);

  // Get focus trap settings
  const getFocusTrapSettings = useCallback(() => {
    return focusTrap;
  }, [focusTrap]);

  // Check if feature is enabled
  const isFeatureEnabled = useCallback(
    (feature: string) => {
      return accessibilityState.enabledAccessibilityFeatures.includes(feature);
    },
    [accessibilityState.enabledAccessibilityFeatures]
  );

  return {
    // State
    accessibilityState,
    announcementQueue,
    animationSettings,
    focusTrap,

    // Methods
    announce,
    createAnimatedValue,
    animate,
    setFocusTrap: setFocusTrap,
    removeFocusTrap,
    trapFocus,
    getAnimationValue,
    isVisibleToScreenReader,
    createAccessibleLabel,
    getFontSize,
    announceValidationError,
    announceFieldCompletion,
    announceNavigation,
    announceStateChange,
    getAnimationSettings,
    getFocusTrapSettings,
    isFeatureEnabled,
  };
};

// Default animation settings
export const useAnimationSettings = {
  duration: 300,
  easing: 'ease-in-out' as const,
  damping: 0.8,
  stiffness: 100,
};

// Higher-order component for accessibility
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    announceOnMount?: boolean;
    announceLabel?: string;
    accessible?: boolean;
  }
): React.ComponentType<P> {
  return (props: P) => {
    const { announce, createAccessibleLabel } = useAccessibility();

    // Add accessibility announcements on mount if configured
    React.useEffect(() => {
      if (options?.announceOnMount && options.announceLabel) {
        announce(options.announceLabel, { priority: 'medium' });
      }
    }, [announce, options?.announceOnMount, options?.announceLabel]);

    // Enhance props with accessibility features
    const enhancedProps = {
      ...props,
      accessible: options?.accessible !== false,
      accessibilityLabel: options?.announceLabel,
    };

    return React.createElement(Component, enhancedProps);
  };
}