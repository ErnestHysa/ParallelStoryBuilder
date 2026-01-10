import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useStoriesStore } from '@/stores/storiesStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Chapter } from '@/lib/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

const ACTIONS_ROW_HEIGHT = 80;

const COLORS = {
  primary: '#E91E63',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FAFAFA',
  border: '#E0E0E0',
  error: '#F44336',
};

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentStory, isLoading, fetchStory, subscribeToStory, unsubscribe } = useStoriesStore();
  const user = useAuthStore((state) => state.user);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchStory(id);
      subscribeToStory(id);

      const fetchChapters = async () => {
        if (!id) return;

        setIsLoadingChapters(true);
        setError('');
        try {
          const { data, error: fetchError } = await supabase
            .from('chapters')
            .select('*')
            .eq('story_id', id)
            .order('chapter_number', { ascending: true });

          if (fetchError) throw fetchError;
          setChapters(data || []);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chapters';
          setError(errorMessage);
          console.error('Error fetching chapters:', err);
        } finally {
          setIsLoadingChapters(false);
        }
      };
      fetchChapters();

      return () => {
        unsubscribe();
      };
    }
  }, [id]);

  if (isLoading || !currentStory) {
    return <LoadingSpinner />;
  }

  const myMember = currentStory.members.find((m) => m.user_id === user?.id);
  const partnerMember = currentStory.members.find((m) => m.user_id !== user?.id);
  const hasPartner = !!partnerMember;

  const isMyTurn = myMember?.turn_order
    ? myMember.turn_order === 1
      ? chapters.length % 2 === 0
      : chapters.length % 2 === 1
    : false;

  const getAuthorName = (authorId: string): string => {
    const member = currentStory.members.find((m) => m.user_id === authorId);
    return member?.profile?.display_name || 'Unknown Author';
  };

  const handleWriteChapter = () => {
    router.push(`/write/${id}`);
  };

  const handleInspirations = () => {
    router.push(`/inspirations/${id}`);
  };

  const handleChapterPress = (chapter: Chapter) => {
    Alert.alert('Chapter ' + chapter.chapter_number, chapter.content?.substring(0, 200) + '...');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{currentStory.title}</Text>
          <Text style={styles.meta}>
            Theme: {currentStory.theme} • Members: {currentStory.members.length}
          </Text>
        </View>

        <View style={styles.content}>
          <Card variant="outlined" style={styles.statusCard}>
            {hasPartner && partnerMember ? (
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Writing with</Text>
                <Text style={styles.partnerName}>
                  {partnerMember.profile?.display_name || 'Partner'}
                </Text>
                <Text style={styles.turnStatus}>
                  {isMyTurn ? "It's your turn!" : `${partnerMember.profile?.display_name || 'Partner'}'s turn`}
                </Text>
              </View>
            ) : (
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Share this code to invite a partner</Text>
                <Text style={styles.pairingCode}>{currentStory.pairing_code}</Text>
              </View>
            )}
          </Card>

          <Text style={styles.sectionTitle}>Chapters</Text>

          {isLoadingChapters ? (
            <LoadingSpinner fullScreen={false} size="small" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : chapters.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No chapters yet</Text>
              <Text style={styles.emptySubtext}>
                {isMyTurn ? 'Start writing your story!' : 'Waiting for partner to write'}
              </Text>
            </View>
          ) : (
            chapters.map((chapter) => (
              <Pressable
                key={chapter.id}
                onPress={() => handleChapterPress(chapter)}
                accessibilityRole="button"
                accessibilityLabel={`Read chapter ${chapter.chapter_number}`}
              >
                <Card variant="elevated" style={styles.chapterCard}>
                  <Text style={styles.chapterNumber}>Chapter {chapter.chapter_number}</Text>
                  <Text style={styles.chapterPreview}>
                    {chapter.ai_enhanced_content || chapter.content}
                  </Text>
                  <Text style={styles.authorLabel}>By {getAuthorName(chapter.author_id)}</Text>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.actionsRow}>
        <Button
          onPress={handleWriteChapter}
          disabled={!isMyTurn}
          accessibilityLabel="Write chapter"
          accessibilityHint={!isMyTurn ? "Wait for your turn to write" : "Write a new chapter"}
          style={styles.actionButton}
        >
          Write Chapter
        </Button>
        <Button
          variant="ghost"
          onPress={handleInspirations}
          accessibilityLabel="View inspirations"
          accessibilityHint="View story inspirations and ideas"
        >
          Inspirations
        </Button>
      </View>
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
    paddingBottom: ACTIONS_ROW_HEIGHT,
  },
  header: {
    padding: 24,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.9,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statusCard: {
    marginBottom: 8,
  },
  statusContent: {
    alignItems: 'center',
    gap: 4,
  },
  statusTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  turnStatus: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  pairingCode: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
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
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    paddingVertical: 24,
  },
  chapterCard: {
    marginBottom: 12,
  },
  chapterNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  chapterPreview: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  authorLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  actionsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
