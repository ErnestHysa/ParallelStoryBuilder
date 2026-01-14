import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { useStoriesStore } from '@/stores/storiesStore';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

const COLORS = {
  text: '#212121',
  textSecondary: '#757575',
  error: '#F44336',
};

export default function JoinStoryScreen() {
  const [pairingCode, setPairingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const joinStorySupabase = useStoriesStore((state) => state.joinStory);
  const getStory = useDemoStore((state) => state.getStory);
  const isConfigured = useAuthStore((state) => state.isConfigured);

  const validate = () => {
    if (!pairingCode.trim()) {
      setError('Pairing code is required');
      return false;
    }
    if (pairingCode.length !== 6) {
      setError('Pairing code must be exactly 6 characters');
      return false;
    }
    return true;
  };

  const handleJoin = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isConfigured) {
        await joinStorySupabase(pairingCode.trim());
        router.back();
      } else {
        // Demo mode: find the story with the matching code
        const story = getStory(`demo-story-1`);
        if (story && story.pairing_code === pairingCode.trim().toUpperCase()) {
          Alert.alert('Demo Mode', `Joined "${story.title}" in demo mode!`);
          router.back();
        } else if (story) {
          // For demo purposes, accept any code and show the first story
          Alert.alert(
            'Demo Mode',
            'In demo mode, you can view the sample stories. Use code LOVE123 or DRAGON456 to see the demo stories.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          setError('No story found with that code. Try LOVE123 or DRAGON456 in demo mode.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join story';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Join Story</Text>
        <Text style={styles.subtitle}>Connect with your partner's story</Text>

        <Card variant="outlined">
          <Text style={styles.infoText}>
            Enter the 6-character pairing code shared by your story partner to join their collaborative story.
          </Text>

          <Input
            label="Pairing Code"
            placeholder="Enter 6-character code"
            value={pairingCode}
            onChangeText={(text) => {
              setPairingCode(text.toUpperCase());
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            textAlign="center"
            style={styles.inputSpacing}
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            onPress={handleJoin}
            isLoading={isLoading}
            accessibilityLabel="Join story"
            accessibilityHint="Joins an existing story using the pairing code"
            style={styles.buttonSpacing}
          >
            Join Story
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.back()}
            accessibilityLabel="Cancel"
            accessibilityHint="Return to previous screen"
          >
            Cancel
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  inputSpacing: {
    marginTop: 12,
  },
  buttonSpacing: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 12,
    marginBottom: 8,
  },
});
