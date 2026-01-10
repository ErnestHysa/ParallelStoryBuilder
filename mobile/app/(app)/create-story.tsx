import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useStoriesStore } from '@/stores/storiesStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { Theme } from '@/lib/types';

const COLORS = {
  text: '#212121',
  textSecondary: '#757575',
  error: '#F44336',
  primary: '#E91E63',
  border: '#E0E0E0',
  surface: '#FFFFFF',
  primaryLight: '#F8BBD0',
};

const THEME_OPTIONS = [
  { value: 'romance' as Theme, emoji: '💕', label: 'Romance' },
  { value: 'fantasy' as Theme, emoji: '⚔️', label: 'Fantasy Adventure' },
  { value: 'our_future' as Theme, emoji: '🏠', label: 'Our Future Together' },
];

export default function CreateStoryScreen() {
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<Theme | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const createStory = useStoriesStore((state) => state.createStory);

  const validate = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (theme) {
        await createStory(title, theme);
      } else {
        await createStory(title, 'romance');
      }
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create story';
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
        <Text style={styles.title}>Create New Story</Text>
        <Text style={styles.subtitle}>Start your collaborative storytelling adventure</Text>

        <Card variant="outlined" style={styles.card}>
          <Input
            label="Story Title"
            placeholder="Our Love Story"
            value={title}
            onChangeText={setTitle}
            autoComplete="off"
          />

          <Text style={styles.themeLabel}>Select Theme</Text>
          {THEME_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.themeOption,
                theme === option.value && styles.themeOptionSelected,
              ]}
              onPress={() => setTheme(option.value)}
              accessibilityLabel={`Select ${option.label} theme`}
              accessibilityHint={`Choose ${option.label} as the story theme`}
              accessibilityRole="radio"
              accessibilityState={{ selected: theme === option.value }}
            >
              <Text style={styles.themeOptionText}>
                {option.emoji} {option.label}
              </Text>
            </Pressable>
          ))}

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            onPress={handleCreate}
            isLoading={isLoading}
            accessibilityLabel="Create story"
            accessibilityHint="Creates a new collaborative story"
            style={styles.buttonSpacing}
          >
            Create Story
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
  card: {
    padding: 16,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  themeOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
  },
  themeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
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
