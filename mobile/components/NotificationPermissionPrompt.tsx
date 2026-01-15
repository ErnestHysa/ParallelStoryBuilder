/**
 * NotificationPermissionPrompt Component
 *
 * A friendly, non-intrusive prompt that appears after registration
 * to encourage users to enable notifications for daily intentions.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { notificationScheduler, scheduleDailyIntention } from '@/lib/notificationScheduler';
import { getBestDailyIntentionTime } from '@/lib/notificationTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationPermissionPromptProps {
  visible: boolean;
  onDismiss?: () => void;
  onEnabled?: () => void;
  partnerName?: string;
}

export function NotificationPermissionPrompt({
  visible,
  onDismiss,
  onEnabled,
  partnerName,
}: NotificationPermissionPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState(9); // Default 9 AM

  const translateY = useSharedValue(SCREEN_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0);
      opacity.value = withTiming(1);
    } else {
      translateY.value = withTiming(SCREEN_WIDTH);
      opacity.value = withTiming(0);
    }
  }, [visible]);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        // Initialize scheduler
        await notificationScheduler.initialize();

        // Schedule daily intention
        await scheduleDailyIntention(selectedTime, { partnerName });

        // Wait a moment for animation
        setTimeout(() => {
          setIsLoading(false);
          onEnabled?.();
        }, 500);
      } else {
        setIsLoading(false);
        // User denied - still allow them to continue
        onDismiss?.();
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      setIsLoading(false);
      onDismiss?.();
    }
  };

  const handleSkip = () => {
    onDismiss?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const bestTimes = getBestDailyIntentionTime();
  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Close button */}
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={20} color="#757575" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Feather name="bell" size={36} color="#E91E63" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Never Miss a Moment</Text>

          {/* Description */}
          <Text style={styles.description}>
            Get a daily reminder to share your intention with {partnerName || 'your partner'}. It only takes a moment!
          </Text>

          {/* Benefits */}
          <View style={styles.benefits}>
            <View style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Feather name="heart" size={16} color="#E91E63" />
              </View>
              <Text style={styles.benefitText}>Daily connection ritual</Text>
            </View>
            <View style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Feather name="zap" size={16} color="#FF9800" />
              </View>
              <Text style={styles.benefitText}>Build your streak</Text>
            </View>
            <View style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Feather name="smile" size={16} color="#4CAF50" />
              </View>
              <Text style={styles.benefitText}>Strengthen your bond</Text>
            </View>
          </View>

          {/* Time Selector */}
          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>What time works best for you?</Text>
            <View style={styles.timeOptions}>
              {bestTimes.slice(0, 5).map((time) => (
                <TouchableOpacity
                  key={time.hour}
                  style={[
                    styles.timeOption,
                    selectedTime === time.hour && styles.timeOptionSelected,
                  ]}
                  onPress={() => setSelectedTime(time.hour)}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      selectedTime === time.hour && styles.timeOptionTextSelected,
                    ]}
                  >
                    {formatTime(time.hour)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={handleEnable}
            style={styles.enableButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.enableButtonText}>Enable Reminders</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FCE4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefits: {
    width: '100%',
    marginBottom: 24,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  timeSection: {
    width: '100%',
    marginBottom: 24,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 12,
    textAlign: 'center',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeOptionSelected: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  enableButton: {
    width: '100%',
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 15,
    color: '#757575',
    fontWeight: '500',
  },
});

export default NotificationPermissionPrompt;
