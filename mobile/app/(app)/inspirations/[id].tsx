import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Text,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useInspirationsStore } from '@/stores/inspirationsStore';
import { useStoriesStore } from '@/stores/storiesStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { Inspiration } from '@/lib/types';

const COLORS = {
  primary: '#E91E63',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FAFAFA',
  error: '#F44336',
  errorLight: '#FFCDD2',
};

export default function InspirationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { currentStory, fetchStory } = useStoriesStore();

  const {
    inspirations,
    isLoading,
    error,
    fetchInspirations,
    addInspiration,
    deleteInspiration,
  } = useInspirationsStore();

  const [newInspiration, setNewInspiration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStory(id);
      fetchInspirations(id);
    }
  }, [id]);

  const getAuthorName = (inspiration: Inspiration): string => {
    if (!currentStory) return 'Unknown';

    const member = currentStory.members.find((m) => m.user_id === inspiration.user_id);
    const displayName = member?.profile?.display_name;

    if (inspiration.user_id === user?.id) {
      return displayName ? `${displayName} (You)` : 'You';
    }

    return displayName || 'Partner';
  };

  const canDelete = (inspiration: Inspiration): boolean => {
    return inspiration.user_id === user?.id;
  };

  const handleAddInspiration = async () => {
    if (!newInspiration.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addInspiration(id, newInspiration.trim());
      setNewInspiration('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add inspiration';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInspiration = (inspiration: Inspiration) => {
    Alert.alert(
      'Delete Inspiration',
      'Are you sure you want to delete this inspiration?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInspiration(inspiration.id);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Failed to delete inspiration';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  if (!currentStory) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading story...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inspirations</Text>
        <Text style={styles.subtitle}>{currentStory.title}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Card variant="outlined" style={styles.card}>
            <Text style={styles.sectionTitle}>Add Inspiration</Text>
            <Text style={styles.sectionSubtitle}>
              Share ideas, prompts, or themes for your story
            </Text>

            <Input
              placeholder="E.g., 'What if they meet during a thunderstorm?'"
              value={newInspiration}
              onChangeText={setNewInspiration}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="New inspiration"
              accessibilityHint="Enter an idea or prompt for the story"
              onSubmitEditing={handleAddInspiration}
            />

            <Button
              onPress={handleAddInspiration}
              isLoading={isSubmitting}
              disabled={!newInspiration.trim()}
              accessibilityLabel="Add inspiration"
              accessibilityHint="Add this inspiration to the story"
            >
              Add Inspiration
            </Button>
          </Card>

          <Text style={styles.sectionTitle}>Story Inspirations</Text>

          {isLoading ? (
            <View style={styles.centerContainer}>
              <Text style={styles.loadingText}>Loading inspirations...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : inspirations.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No inspirations yet</Text>
              <Text style={styles.emptySubtext}>
                Add your first inspiration to get started
              </Text>
            </View>
          ) : (
            inspirations.map((inspiration) => (
              <Card key={inspiration.id} variant="elevated" style={styles.inspirationCard}>
                <View style={styles.inspirationContent}>
                  <View style={styles.inspirationTextContainer}>
                    <Text style={styles.contentText}>{inspiration.content}</Text>
                    <Text style={styles.authorLabel}>By {getAuthorName(inspiration)}</Text>
                  </View>

                  {canDelete(inspiration) && (
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteInspiration(inspiration)}
                      accessibilityLabel="Delete inspiration"
                      accessibilityHint="Remove this inspiration from the story"
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </Pressable>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  header: {
    padding: 24,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.9,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inspirationCard: {
    marginBottom: 8,
  },
  inspirationContent: {
    flexDirection: 'row',
    gap: 8,
  },
  inspirationTextContainer: {
    flex: 1,
    gap: 4,
  },
  contentText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  authorLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
