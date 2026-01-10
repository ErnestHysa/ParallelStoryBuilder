import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';

export default function Index() {
  const user = useAuthStore((state) => state.user);
  const isConfigured = useAuthStore((state) => state.isConfigured);
  const initialize = useAuthStore((state) => state.initialize);
  const [isReady, setIsReady] = useState(!isConfigured);

  useEffect(() => {
    if (isConfigured) {
      initialize().then(() => setIsReady(true));
    }
  }, []);

  if (!isReady) {
    return null;
  }

  if (!isConfigured) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href={user ? "/(app)" : "/(auth)/login"} />;
}
