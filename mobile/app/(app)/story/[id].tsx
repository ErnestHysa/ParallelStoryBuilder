import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useStoriesStore } from '@/stores/storiesStore';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { supabase } from '@/lib/supabase';
import { Story, Chapter, Media } from '@/lib/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import StreakDisplay from '@/components/StreakDisplay';
import MediaGallery from '@/components/MediaGallery';
import { AICoverArtGenerator } from '@/components/AICoverArtGenerator';
import { ExportDialog } from '@/components/ExportDialog';
import { ShareableCardDialog } from '@/components/ShareableCardDialog';
import { Theme } from '@/lib/types';

const ACTIONS_ROW_HEIGHT = 80;

const COLORS = {
  primary: '#E91E63',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FAFAFA',
  border: '#E0E0E0',
  error: '#F44336',
  success: '#4CAF50',
  accent: '#9C27B0',
  presence: '#4CAF50',
  typing: '#2196F3',
};

const THEME_INFO: Record<Theme, { label: string; emoji: string; color: string }> = {
  romance: { label: 'Romance', emoji: '💕', color: '#E91E63' },
  fantasy: { label: 'Fantasy', emoji: '🐉', color: '#9C27B0' },
  our_future: { label: 'Our Future', emoji: '🌟', color: '#2196F3' },
};

// Demo user profiles
const DEMO_PROFILES: Record<string, { display_name: string; avatar?: string }> = {
  'demo-user': { display_name: 'You', avatar: '👤' },
  'demo-partner': { display_name: 'Partner', avatar: '👥' },
};

// Presence indicators
const PRESENCE_STATES = {
  online: { color: COLORS.presence, text: 'Online', icon: '🟢' },
  typing: { color: COLORS.typing, text: 'Typing...', icon: '✍️' },
  away: { color: '#FF9800', text: 'Away', icon: '🟡' },
  offline: { color: '#9E9E9E', text: 'Offline', icon: '⚫' },
};

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentStory, isLoading, fetchStory, subscribeToStory, unsubscribe, isConfigured } = useStoriesStore();
  const { getStory, getChapters } = useDemoStore();
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const { streak } = useGamificationStore();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [error, setError] = useState<string>('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareCardDialog, setShowShareCardDialog] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showAICoverArt, setShowAICoverArt] = useState(false);
  const [presence, setPresence] = useState(PRESENCE_STATES.offline);
  const presenceAnim = useRef(new Animated.Value(0)).current;

  const showRelationshipInsights = false;
  const setShowRelationshipInsights = () => {};

  useEffect(() => {
    if (id) {
      if (isAuthConfigured) {
        fetchStory(id);
        subscribeToStory(id);

        const fetchChapters = async () => {
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

            // Fetch media
            const { data: mediaData } = await supabase
              .from('media')
              .select('*')
              .eq('story_id', id);

            setMedia(mediaData || []);
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
      } else {
        // Demo mode
        const demoStory = getStory(id);
        if (demoStory) {
          setStory(demoStory);
          setChapters(getChapters(id || ''));
        }
        // Simulate partner presence
        setTimeout(() => setPresence(PRESENCE_STATES.online), 2000);
      }
    }
  }, [id, isAuthConfigured]);

  // Animate presence changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(presenceAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(presenceAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [presence]);

  // Use currentStory from Supabase or demo story
  const displayStory = isAuthConfigured ? currentStory : story;
  const displayChapters = isAuthConfigured ? chapters : getChapters(id || '');

  if ((isAuthConfigured && (isLoading || !currentStory)) || (!isAuthConfigured && !story)) {
    return <LoadingSpinner />;
  }

  if (!displayStory) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Story not found</Text>
          <Button variant="ghost" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  const theme = THEME_INFO[displayStory.theme];
  const hasPartner = true; // Always true in demo mode
  const isMyTurn = true; // Demo mode allows writing anytime

  const getAuthorName = (authorId: string): string => {
    if (!isAuthConfigured) {
      const profile = DEMO_PROFILES[authorId];
      return profile?.display_name || 'Author';
    }
    return 'Author';
  };

  const handleWriteChapter = () => {
    router.push(`/write/${id}`);
  };

  const handleInspirations = () => {
    router.push(`/inspirations/${id}`);
  };

  const handleChapterPress = (chapter: Chapter) => {
    Alert.alert(
      `Chapter ${chapter.chapter_number}`,
      chapter.content?.substring(0, 200) + (chapter.content?.length > 200 ? '...' : ''),
      [{ text: 'Close' }]
    );
  };

  const handleExportStory = () => {
    setShowExportDialog(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Story Header */}
        <View style={[styles.header, { backgroundColor: theme.color }]}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{displayStory.title}</Text>
            <View style={styles.themeBadge}>
              <Text style={styles.themeEmoji}>{theme.emoji}</Text>
            </View>
          </View>
          <Text style={styles.meta}>
            {theme.label} • Code: {displayStory.pairing_code}
          </Text>

          {/* Streak Display */}
          <StreakDisplay streak={typeof streak === 'object' ? streak.current : streak} style={styles.streakDisplay} />
        </View>

        {/* Partner Presence */}
        {hasPartner && (
          <View style={styles.presenceContainer}>
            <Animated.View
              style={[
                styles.presenceIndicator,
                { opacity: presenceAnim },
              ]}
            >
              <Text style={styles.presenceIcon}>{presence.icon}</Text>
              <Text style={[styles.presenceText, { color: presence.color }]}>
                {presence.text}
              </Text>
            </Animated.View>
            <Text style={styles.partnerStatus}>
              Writing with {isAuthConfigured ? 'Partner' : 'Partner'}
            </Text>
          </View>
        )}

        {/* Status Card */}
        <Card variant="outlined" style={styles.statusCard}>
          {hasPartner ? (
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Writing Status</Text>
              <Text style={styles.partnerName}>
                {isAuthConfigured ? 'Partner' : 'Partner'}
              </Text>
              <Text style={styles.turnStatus}>
                {isMyTurn ? "It's your turn to write!" : "Waiting for partner's turn"}
              </Text>
              <View style={styles.quickActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleWriteChapter}
                >
                  ✍️ Write
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleInspirations}
                >
                  💡 Ideas
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Share this code to invite a partner</Text>
              <Text style={styles.pairingCode}>{displayStory.pairing_code}</Text>
            </View>
          )}
        </Card>

        {/* AI Cover Art */}
        <Card variant="elevated" style={styles.coverArtCard}>
          <View style={styles.coverArtHeader}>
            <Text style={styles.coverArtTitle}>Story Cover Art</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setShowAICoverArt(true)}
            >
              🎨 Generate
            </Button>
          </View>
          <View style={styles.coverArtPlaceholder}>
            <Text style={styles.coverArtText}>🖼️ AI-generated art will appear here</Text>
          </View>
        </Card>

        {/* Relationship Insights */}
        <Card variant="outlined" style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsTitle}>Story Stats</Text>
          </View>
          <View style={styles.insightsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{displayChapters.length}</Text>
              <Text style={styles.statLabel}>Chapters</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {displayChapters.reduce((sum, c) => sum + c.content.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Characters</Text>
            </View>
          </View>
        </Card>

        {/* Chapters Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chapters ({displayChapters.length})</Text>
            <View style={styles.sectionActions}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowShareCardDialog(true)}
              >
                📤 Share Card
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={handleExportStory}
              >
                📥 Export
              </Button>
            </View>
          </View>

          {isLoadingChapters ? (
            <LoadingSpinner fullScreen={false} size="small" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : displayChapters.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No chapters yet</Text>
              <Text style={styles.emptySubtext}>
                Start writing your story together!
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayChapters}
              renderItem={({ item }) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleChapterPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Read chapter ${item.chapter_number}`}
                >
                  <Card variant="elevated" style={styles.chapterCard}>
                    <View style={styles.chapterHeader}>
                      <Text style={styles.chapterNumber}>Chapter {item.chapter_number}</Text>
                      {item.ai_enhanced_content && (
                        <View style={styles.aiBadge}>
                          <Text style={styles.aiBadgeText}>✨ AI Enhanced</Text>
                        </View>
                      )}
                      {item.media && item.media.length > 0 && (
                        <View style={styles.mediaBadge}>
                          <Text style={styles.mediaBadgeText}>📷 {item.media.length}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.chapterPreview} numberOfLines={4}>
                      {item.ai_enhanced_content || item.content}
                    </Text>
                    <Text style={styles.authorLabel}>By {getAuthorName(item.author_id)}</Text>
                  </Card>
                </Pressable>
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Media Gallery Preview */}
        {media.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Media Gallery ({media.length})</Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowMediaGallery(true)}
              >
                View All
              </Button>
            </View>
            <View style={styles.mediaPreview}>
              {media.slice(0, 3).map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.mediaPreviewItem,
                    index === 0 && { marginRight: 8 },
                  ]}
                >
                  <Text style={styles.mediaIcon}>📷</Text>
                </View>
              ))}
              {media.length > 3 && (
                <View style={styles.moreMedia}>
                  <Text style={styles.moreMediaText}>
                    +{media.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {!isAuthConfigured && (
          <Card variant="outlined" style={styles.infoCard}>
            <Text style={styles.infoTitle}>Demo Mode</Text>
            <Text style={styles.infoText}>
              This is a preview. Set up Supabase for real-time collaboration with your partner.
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Button
          onPress={handleWriteChapter}
          accessibilityLabel="Write chapter"
          accessibilityHint="Write a new chapter"
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

      {/* Modals */}
      <Modal
        visible={showMediaGallery}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Media Gallery</Text>
            <Button
              variant="ghost"
              onPress={() => setShowMediaGallery(false)}
            >
              Close
            </Button>
          </View>
          <MediaGallery
            media={media.map(m => ({
              id: m.id || '',
              uri: m.uri,
              type: m.type,
              title: m.title,
              size: m.size,
              uploadedAt: new Date(m.uploadedAt || Date.now()),
            }))}
            onClose={() => setShowMediaGallery(false)}
          />
        </View>
      </Modal>

      <Modal
        visible={showAICoverArt}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AICoverArtGenerator
          storyId={id}
          storyTitle={displayStory.title}
          theme={displayStory.theme}
          onClose={() => setShowAICoverArt(false)}
          onCoverGenerated={(coverUrl: any) => {
            // Save cover art
            console.log('Cover art generated:', coverUrl);
          }}
        />
      </Modal>

      {/* RelationshipInsights modal removed - component not available */}

      <ExportDialog
        visible={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        story={displayStory}
        chapters={displayChapters}
        inspirations={[]}
      />

      <ShareableCardDialog
        visible={showShareCardDialog}
        onClose={() => setShowShareCardDialog(false)}
        story={displayStory}
        chapters={displayChapters}
      />
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
    paddingBottom: ACTIONS_ROW_HEIGHT + 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  header: {
    padding: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.surface,
    flex: 1,
  },
  themeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeEmoji: {
    fontSize: 20,
  },
  meta: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.9,
    marginBottom: 12,
  },
  streakDisplay: {
    marginTop: 8,
  },
  presenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
  },
  presenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  presenceIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  presenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  partnerStatus: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
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
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  coverArtCard: {
    marginBottom: 8,
  },
  coverArtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coverArtTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  coverArtPlaceholder: {
    height: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverArtText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  insightsCard: {
    marginBottom: 8,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  insightsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
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
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chapterNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  aiBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  mediaBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediaBadgeText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '500',
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
  mediaPreview: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mediaPreviewItem: {
    width: 80,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaIcon: {
    fontSize: 24,
  },
  moreMedia: {
    width: 80,
    height: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreMediaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoCard: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
});
