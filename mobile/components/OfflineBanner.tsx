import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineStore } from '@/stores/offlineStore';

interface OfflineBannerProps {
  style?: any;
  testID?: string;
}

// Simple theme colors since we removed @rneui/themed
const colors = {
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  white: '#FFFFFF',
};

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  style,
  testID = 'offline-banner'
}) => {
  const { isConnected, isSyncing, queue, syncOfflineData } = useOfflineStore();
  const [isVisible, setIsVisible] = useState(!isConnected);
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = React.useRef(new Animated.Value(0)).current;
  const animatedOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isConnected && !isVisible) {
      setIsVisible(true);
      animateBannerIn();
    } else if (isConnected && isVisible) {
      // Delay hiding to show success message if syncing
      if (queue.length > 0 && isSyncing) {
        setTimeout(() => {
          setIsVisible(false);
          animateBannerOut();
        }, 2000);
      } else {
        setIsVisible(false);
        animateBannerOut();
      }
    }
  }, [isConnected, queue.length, isSyncing]);

  const animateBannerIn = () => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateBannerOut = () => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!isConnected) return;

    if (isExpanded) {
      setIsExpanded(false);
      Animated.timing(animatedHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      setIsExpanded(true);
      const contentHeight = isSyncing
        ? 120
        : queue.length > 0
          ? 100
          : 80;
      Animated.timing(animatedHeight, {
        toValue: contentHeight / 80, // Normalize to our base height
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSync = () => {
    syncOfflineData();
  };

  if (!isVisible) {
    return null;
  }

  const getBannerColor = () => {
    if (isConnected && queue.length === 0) {
      return colors.success;
    }
    if (isConnected && isSyncing) {
      return colors.warning;
    }
    return colors.error;
  };

  const getStatusText = () => {
    if (!isConnected) {
      return 'You\'re offline';
    }

    if (isSyncing) {
      return 'Syncing offline data...';
    }

    if (queue.length > 0) {
      return `${queue.length} action${queue.length > 1 ? 's' : ''} ready to sync`;
    }

    return 'All data synced!';
  };

  const getStatusIcon = () => {
    if (!isConnected) {
      return <Ionicons name="close-circle" size={20} color="white" />;
    }

    if (isSyncing) {
      return <Ionicons name="refresh" size={20} color="white" />;
    }

    return <Ionicons name="checkmark-circle" size={20} color="white" />;
  };

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: getBannerColor(),
          opacity: animatedOpacity,
          height: animatedHeight,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.leftContent}>
          {getStatusIcon()}
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        {isConnected && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSync}
            activeOpacity={0.7}
          >
            {isSyncing ? (
              <Ionicons name="refresh" size={16} color="white" />
            ) : (
              <Text style={styles.syncButtonText}>Sync</Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.queueInfo}>
            <Ionicons
              name="list"
              size={16}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.queueText}>
              {queue.length} action{queue.length > 1 ? 's' : ''} in queue
            </Text>
          </View>

          {queue.slice(0, 3).map((action, index) => (
            <View key={action.id} style={styles.actionItem}>
              <Text style={styles.actionText}>
                {action.type.replace('_', ' ').toLowerCase()}
                {action.retries > 0 && ` (${action.retries} retry${action.retries > 1 ? 's' : ''})`}
              </Text>
              <Text style={styles.timestampText}>
                {new Date(action.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}

          {queue.length > 3 && (
            <Text style={styles.moreText}>
              +{queue.length - 3} more actions
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    marginBottom: 4,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    flex: 1,
  },
  timestampText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  moreText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default OfflineBanner;
