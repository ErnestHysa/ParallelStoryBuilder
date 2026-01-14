import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  LayoutAnimation,
  Platform,
} from 'react-native';
import { useTypingIndicators } from '@/stores/presenceStore';

interface TypingIndicatorProps {
  style?: ViewStyle;
  textStyle?: TextStyle;
  showAvatars?: boolean;
  maxVisibleUsers?: number;
  chapterId?: string;
  storyId?: string;
  onPress?: () => void;
  showDots?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  style,
  textStyle,
  showAvatars = true,
  maxVisibleUsers = 3,
  chapterId,
  storyId,
  onPress,
  showDots = true,
}) => {
  const typingUsers = useTypingIndicators(storyId, chapterId);

  // Only show if there are typing users
  if (typingUsers.length === 0) {
    return null;
  }

  // Limit to maxVisibleUsers
  const visibleUsers = typingUsers.slice(0, maxVisibleUsers);

  // Determine if there are more users than visible
  const hasMore = typingUsers.length > maxVisibleUsers;

  // Animation values for the dots
  const dotAnimations = React.useMemo(
    () => [
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
    ],
    []
  );

  // Animate the dots
  React.useEffect(() => {
    if (showDots) {
      const animate = () => {
        dotAnimations.forEach((dot, index) => {
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 500,
              delay: index * 150,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 500,
              delay: index * 150,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ]).start();
        });
      };

      animate();
    }
  }, [dotAnimations, showDots]);

  // Layout animation for smooth appearance/disappearance
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [typingUsers.length]);

  const renderUser = (user: any, index: number) => (
    <View key={user.userId} style={[styles.userContainer, { marginLeft: index > 0 ? 8 : 0 }]}>
      {showAvatars && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
      )}
      <Text style={[styles.userName, textStyle]}>
        {user.displayName || 'User'}
      </Text>
      {index < visibleUsers.length - 1 && (
        <Text style={[styles.comma, textStyle]}>,</Text>
      )}
    </View>
  );

  const renderMoreUsers = () => {
    if (!hasMore) return null;

    const remainingCount = typingUsers.length - maxVisibleUsers;

    return (
      <View style={styles.moreContainer}>
        <Text style={[styles.moreText, textStyle]}>
          +{remainingCount} {remainingCount === 1 ? 'other' : 'others'}
        </Text>
      </View>
    );
  };

  const renderTypingDots = () => {
    if (!showDots || !visibleUsers.length) return null;

    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: dotAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    scale: dotAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const containerStyle = typingUsers.length === 0 ? {} : styles.container;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[containerStyle, style]}>
        <View style={styles.content}>
          {visibleUsers.map(renderUser)}
          {renderMoreUsers()}
          {renderTypingDots()}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <View style={styles.content}>
        {visibleUsers.map(renderUser)}
        {renderMoreUsers()}
        {renderTypingDots()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginTop: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E91E6310',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E91E63',
  },
  userName: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
  },
  comma: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  moreContainer: {
    marginLeft: 8,
  },
  moreText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9C27B0',
    marginHorizontal: 2,
  },
});

export default TypingIndicator;