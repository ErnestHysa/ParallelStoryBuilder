import React, { useState, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEditorStore } from '@/stores/editorStore';
import { useStoriesStore } from '@/stores/storiesStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/TextArea';
import { Card } from '@/components/Card';

const COLORS = {
  primary: '#E91E63',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FAFAFA',
  error: '#F44336',
};

export default function WriteChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { currentStory, fetchStory } = useStoriesStore();

  const {
    draftContent,
    contextSnippet,
    isEnhancing,
    isSubmitting,
    aiEnhancedContent,
    setDraftContent,
    setContextSnippet,
    enhanceWithAI,
    submitChapter,
    reset,
  } = useEditorStore();

  const [localError, setLocalError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStory(id);
    }

    return () => {
      reset();
    };
  }, [id]);

  const validate = () => {
    if (!draftContent.trim()) {
      setLocalError('Chapter content is required');
      return false;
    }
    return true;
  };

  const handleEnhance = async () => {
    if (!draftContent.trim()) {
      setLocalError('Please write some content first');
      return;
    }

    setLocalError('');
    try {
      await enhanceWithAI(id);
      setShowPreview(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to enhance content';
      setLocalError(message);
      Alert.alert('Enhancement Failed', message);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLocalError('');
    try {
      await submitChapter(id);
      Alert.alert(
        'Chapter Submitted!',
        'Your chapter has been added to the story.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit chapter';
      setLocalError(message);
      Alert.alert('Submission Failed', message);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
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

  const myMember = currentStory.members.find((m) => m.user_id === user?.id);
  const isMyTurn = myMember?.turn_order
    ? myMember.turn_order === 1
      ? 0 % 2 === 0
      : 0 % 2 === 1
    : true;

  if (!isMyTurn) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.notTurnTitle}>Not Your Turn</Text>
          <Text style={styles.notTurnText}>
            Please wait for your partner to write their chapter.
          </Text>
          <Button variant="ghost" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

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
        <View style={styles.header}>
          <Text style={styles.title}>Write Chapter</Text>
          <Text style={styles.subtitle}>{currentStory.title}</Text>
        </View>

        <View style={styles.content}>
          <Card variant="outlined" style={styles.card}>
            <Text style={styles.sectionLabel}>Context Snippet (Optional)</Text>
            <Input
              placeholder="Add a brief context or prompt for this chapter..."
              value={contextSnippet || ''}
              onChangeText={setContextSnippet}
              accessibilityLabel="Context snippet"
              accessibilityHint="Optional context for the chapter"
            />

            <Text style={styles.sectionLabel}>Chapter Content</Text>
            <TextArea
              placeholder="Write your chapter here... Let your creativity flow!"
              value={draftContent}
              onChangeText={setDraftContent}
              error={localError}
              accessibilityLabel="Chapter content"
              accessibilityHint="Write the main content of your chapter"
            />

            <View style={styles.buttonRow}>
              <Button
                style={styles.flexButton}
                onPress={handleEnhance}
                isLoading={isEnhancing}
                disabled={!draftContent.trim()}
                accessibilityLabel="Enhance with AI"
                accessibilityHint="Use AI to enhance your writing"
              >
                AI Enhance
              </Button>

              <Button
                variant="ghost"
                onPress={togglePreview}
                disabled={!aiEnhancedContent}
                accessibilityLabel="Toggle preview"
                accessibilityHint={showPreview ? 'Hide AI enhanced version' : 'Show AI enhanced version'}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </View>

            {localError && (
              <Text style={styles.errorText}>{localError}</Text>
            )}
          </Card>

          {showPreview && aiEnhancedContent && (
            <Card variant="elevated" style={styles.card}>
              <Text style={styles.previewTitle}>AI Enhanced Version</Text>
              <Text style={styles.previewText}>
                {aiEnhancedContent}
              </Text>
              <Button
                variant="secondary"
                onPress={() => {
                  setDraftContent(aiEnhancedContent || '');
                  setShowPreview(false);
                }}
                accessibilityLabel="Use enhanced version"
                accessibilityHint="Replace your draft with the AI enhanced version"
              >
                Use This Version
              </Button>
            </Card>
          )}

          <Button
            onPress={handleSubmit}
            isLoading={isSubmitting}
            disabled={!draftContent.trim()}
            accessibilityLabel="Submit chapter"
            accessibilityHint="Submit your chapter to the story"
          >
            Submit Chapter
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.back()}
            accessibilityLabel="Cancel"
            accessibilityHint="Return to story without submitting"
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  notTurnTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  notTurnText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  flexButton: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 12,
  },
});
