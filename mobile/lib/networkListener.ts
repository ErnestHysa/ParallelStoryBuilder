import React from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from '@/stores/offlineStore';

// Network listener for offline support
export class NetworkListener {
  private static instance: NetworkListener;
  private unsubscribe?: () => void;

  static getInstance(): NetworkListener {
    if (!NetworkListener.instance) {
      NetworkListener.instance = new NetworkListener();
    }
    return NetworkListener.instance;
  }

  /**
   * Start listening to network changes
   */
  startListening(): void {
    if (this.unsubscribe) {
      this.stopListening();
    }

    this.unsubscribe = NetInfo.addEventListener((state) => {
      console.log('Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details,
      });

      // Update offline store
      useOfflineStore.getState().setConnectionStatus(
        !!state.isConnected && !!state.isInternetReachable
      );

      // Log network change to Sentry
      if (state.isConnected && state.isInternetReachable) {
        // Connection restored
        console.log('Network connection restored');
      } else {
        // Connection lost
        console.log('Network connection lost');
      }
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      useOfflineStore.getState().setConnectionStatus(
        !!state.isConnected && !!state.isInternetReachable
      );
    });
  }

  /**
   * Stop listening to network changes
   */
  stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  /**
   * Get current network state
   */
  async getCurrentState(): Promise<{
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string | null;
  }> {
    const state = await NetInfo.fetch();
    return {
      isConnected: !!state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    };
  }
}

// Create singleton instance
export const networkListener = NetworkListener.getInstance();

// Hook for using network state in components
export function useNetworkState() {
  const { isConnected } = useOfflineStore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  return {
    isConnected: isMounted ? isConnected : true, // Default to connected on mount for SSR compatibility
  };
}

// Network status hook with more details
export function useNetworkStatus() {
  const [networkState, setNetworkState] = React.useState({
    isConnected: true,
    isInternetReachable: true,
    type: null as string | null,
  });

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Initial fetch
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkState;
}

// Higher-order component for network-aware components
export function withNetworkAwareness<P extends object>(
  Component: React.ComponentType<P & { isConnected: boolean }>
): React.FC<P> {
  return (props: P) => {
    const { isConnected } = useNetworkState();

    return React.createElement(Component, { ...props, isConnected });
  };
}