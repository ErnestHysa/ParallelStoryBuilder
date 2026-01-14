import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  Alert,
  FlatList,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useInspirationsStore } from '@/stores/inspirationsStore';
import { useStoriesStore } from '@/stores/storiesStore';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import { useTokenStore } from '@/stores/tokenStore';
import { Story, Inspiration, Media } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Placeholder components for missing ones
const MediaPicker: React.FC<{
  onMediaSelect: (media: any) => void;
  onClose: () => void;
  maxSelection?: number;
}> = ({ onMediaSelect, onClose }) => (
  <View style={styles.aiPanelContainer}>
    <Text style={styles.aiPanelTitle}>Media Picker</Text>
    <Button onPress={onClose}>Close</Button>
  </View>
);

const AISuggestionCard: React.FC<{
  suggestion: string;
  cost?: number;
  boosted?: boolean;
  onPress: () => void;
  style?: any;
}> = ({ suggestion, cost, boosted, onPress, style }) => (
  <TouchableOpacity style={[styles.suggestionCard, style]} onPress={onPress}>
    <Text style={styles.suggestionText}>{suggestion}</Text>
    {cost && <Text style={styles.suggestionCost}>{cost} 💎</Text>}
  </TouchableOpacity>
);

const TokenCostIndicator: React.FC<{
  content: string;
  isAuthConfigured: boolean;
}> = ({ isAuthConfigured }) => (
  isAuthConfigured ? <Text style={styles.tokenCost}>5-20 💎 per suggestion</Text> : null
);

const AIPanel: React.FC<{
  theme: string;
  onSuggestionSelect: (suggestion: string, cost?: number) => void;
  onClose: () => void;
}> = ({ onSuggestionSelect, onClose }) => (
  <View style={styles.aiPanelContent}>
    <Text style={styles.aiPanelText}>AI suggestions coming soon</Text>
    <Button onPress={onClose}>Close</Button>
  </View>
);

const COLORS = {
  primary: '#E91E63',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FAFAFA',
  error: '#F44336',
  success: '#4CAF50',
  accent: '#9C27B0',
  border: '#E0E0E0',
  aiSuggestion: '#E3F2FD',
};

const THEME_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  romance: { label: 'Romance', emoji: '💕', color: '#E91E63' },
  fantasy: { label: 'Fantasy', emoji: '🐉', color: '#9C27B0' },
  our_future: { label: 'Our Future', emoji: '🌟', color: '#2196F3' },
};

// AI suggestion prompts for different themes
const AI_PROMPTS = {
  romance: [
    "A chance encounter in a coffee shop leads to...",
    "Write about a love letter that's never delivered",
    "Describe a perfect first date under the stars",
    "What if they meet again after years apart?",
    "A love story told through objects they share",
  ],
  fantasy: [
    "A hidden world exists behind the mirror in your bedroom",
    "The last dragon and its unlikely human companion",
    "A kingdom where magic is forbidden",
    "An ancient prophecy about two strangers",
    "A journey to find the mythical Phoenix feather",
  ],
  our_future: [
    "What if we could relive our past decisions?",
    "A time traveler who can only move forward",
    "Life in a city that floats above the clouds",
    "The day AI became conscious",
    "Two souls connected across different timelines",
  ],
};

// Demo user profiles
const DEMO_PROFILES: Record<string, { display_name: string; avatar?: string }> = {
  'demo-user': { display_name: 'You', avatar: '👤' },
  'demo-partner': { display_name: 'Partner', avatar: '👥' },
};

export default function InspirationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentStory, fetchStory } = useStoriesStore();
  const { getStory, getInspirations, addInspiration: addDemoInspiration, deleteInspiration: deleteDemoInspiration } = useDemoStore();
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const { tokens } = useTokenStore();

  const {
    inspirations: supabaseInspirations,
    isLoading,
    error,
    fetchInspirations,
    addInspiration: addSupabaseInspiration,
    deleteInspiration: deleteSupabaseInspiration,
  } = useInspirationsStore();

  const [story, setStory] = useState<Story | null>(null);
  const [newInspiration, setNewInspiration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [boostedSuggestions, setBoostedSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      if (isAuthConfigured) {
        fetchStory(id);
        fetchInspirations(id);

        // Generate AI suggestions
        if (currentStory?.theme) {
          generateAISuggestions(currentStory.theme);
        }
      } else {
        const demoStory = getStory(id);
        if (demoStory) {
          setStory(demoStory);
          // Generate demo AI suggestions
          generateAISuggestions(demoStory.theme);
        }
      }
    }
  }, [id, isAuthConfigured, currentStory]);

  const generateAISuggestions = async (theme: string) => {
    const prompts = AI_PROMPTS[theme as keyof typeof AI_PROMPTS] || AI_PROMPTS.our_future;

    // Regular suggestions
    setAiSuggestions(prompts.slice(0, 3));

    // Boosted suggestions (with token cost)
    if (isAuthConfigured && tokens >= 10) {
      const boosted = prompts.slice(3).map(prompt => ({
        text: prompt,
        cost: Math.floor(Math.random() * 20) + 10,
        boosted: true,
      }));
      setBoostedSuggestions(boosted as any);
    }
  };

  const displayStory = isAuthConfigured ? currentStory : story;
  const displayInspirations = isAuthConfigured ? supabaseInspirations : getInspirations(id || '');

  const getAuthorName = (inspiration: Inspiration): string => {
    if (!isAuthConfigured) {
      const profile = DEMO_PROFILES[inspiration.user_id];
      if (inspiration.user_id === 'demo-user') {
        return 'You';
      }
      return profile?.display_name || 'Partner';
    }
    return inspiration.user_id === 'demo-user' ? 'You' : 'Partner';
  };

  const canDelete = (inspiration: Inspiration): boolean => {
    if (!isAuthConfigured) {
      return inspiration.user_id === 'demo-user';
    }
    return true;
  };

  const handleAddInspiration = async () => {
    if (!newInspiration.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isAuthConfigured) {
        await addSupabaseInspiration(id, newInspiration.trim());
      } else {
        addDemoInspiration(id, newInspiration.trim());
      }
      setNewInspiration('');
      setSelectedMedia([]);
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
              if (isAuthConfigured) {
                await deleteSupabaseInspiration(inspiration.id);
              } else {
                deleteDemoInspiration(inspiration.id);
              }
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Failed to delete inspiration';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const handleUseSuggestion = (suggestion: string, cost: number = 0) => {
    if (isAuthConfigured && cost > 0 && tokens < cost) {
      Alert.alert(
        'Insufficient Tokens',
        `This suggestion costs ${cost} tokens, but you only have ${tokens} tokens.`,
        [
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setNewInspiration(suggestion);
    setShowAIPanel(false);

    // Deduct tokens for boosted suggestions
    if (isAuthConfigured && cost > 0) {
      // Deduct tokens logic here
    }
  };

  const renderMediaAttachment = (media: Media) => {
    return (
      <View style={styles.mediaAttachment}>
        <Text style={styles.mediaIcon}>📷</Text>
        <Text style={styles.mediaCaption}>{media.title || 'Untitled'}</Text>
      </View>
    );
  };

  const renderInspirationItem = ({ item }: { item: Inspiration }) => {
    const authorName = getAuthorName(item);
    const canDeleteItem = canDelete(item);

    return (
      <Card key={item.id} variant="elevated" style={styles.inspirationCard}>
        <View style={styles.inspirationContent}>
          <View style={styles.inspirationTextContainer}>
            <Text style={styles.contentText}>{item.content}</Text>
            {item.media && item.media.length > 0 && (
              <View style={styles.mediaList}>
                {item.media.map((media, index) => (
                  <React.Fragment key={media.id || index}>
                    {renderMediaAttachment(media)}
                  </React.Fragment>
                ))}
              </View>
            )}
            <Text style={styles.authorLabel}>By {authorName}</Text>
          </View>

          <View style={styles.inspirationActions}>
            {canDeleteItem && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteInspiration(item)}
                accessibilityLabel="Delete inspiration"
                accessibilityHint="Remove this inspiration from the story"
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (!displayStory) {
    return <LoadingSpinner />;
  }

  const theme = THEME_INFO[displayStory.theme] || THEME_INFO.our_future;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.color }]}>
        <Text style={styles.title}>Inspirations</Text>
        <Text style={styles.subtitle}>{displayStory.title}</Text>
        <Text style={styles.themeLabel}>{theme.emoji} {theme.label}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Add Inspiration Card */}
          <Card variant="outlined" style={styles.card}>
            <View style={styles.addInspirationHeader}>
              <Text style={styles.sectionTitle}>Add Inspiration</Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowAIPanel(true)}
                style={styles.aiButton}
              >
                🤖 AI Suggest
              </Button>
            </View>
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
              style={styles.inputSpacing}
            />

            {/* Media Attachments */}
            {selectedMedia.length > 0 && (
              <View style={styles.selectedMediaContainer}>
                <Text style={styles.selectedMediaLabel}>Attached Media:</Text>
                <View style={styles.selectedMediaList}>
                  {selectedMedia.map((media, index) => (
                    <View key={index} style={styles.selectedMediaItem}>
                      <Text style={styles.selectedMediaIcon}>📷</Text>
                      <Text style={styles.selectedMediaText} numberOfLines={1}>
                        {media.title || 'Untitled'}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => {
                          setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
                        }}
                      >
                        <Text style={styles.removeMediaText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.actionRow}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowMediaPicker(true)}
                disabled={!isAuthConfigured}
                style={styles.mediaButton}
              >
                📷 Add Media
              </Button>

              <Button
                onPress={handleAddInspiration}
                isLoading={isSubmitting}
                disabled={!newInspiration.trim()}
                accessibilityLabel="Add inspiration"
                accessibilityHint="Add this inspiration to the story"
              >
                Add Inspiration
              </Button>
            </View>
          </Card>

          {/* AI Suggestions Section */}
          {(aiSuggestions.length > 0 || boostedSuggestions.length > 0) && (
            <Card variant="elevated" style={styles.suggestionsCard}>
              <View style={styles.suggestionsHeader}>
                <Text style={styles.suggestionsTitle}>AI-Powered Suggestions</Text>
                <TokenCostIndicator content="AI suggestions" isAuthConfigured={isAuthConfigured} />
              </View>

              <View style={styles.suggestionsList}>
                {aiSuggestions.map((suggestion, index) => (
                  <AISuggestionCard
                    key={`regular-${index}`}
                    suggestion={suggestion}
                    onPress={() => handleUseSuggestion(suggestion)}
                    style={styles.suggestionItem}
                  />
                ))}

                {boostedSuggestions.map((suggestion: any, index: number) => (
                  <AISuggestionCard
                    key={`boosted-${index}`}
                    suggestion={suggestion.text}
                    cost={suggestion.cost}
                    boosted={true}
                    onPress={() => handleUseSuggestion(suggestion.text, suggestion.cost)}
                    style={styles.suggestionItem}
                  />
                ))}
              </View>
            </Card>
          )}

          {/* Story Inspirations */}
          <Text style={styles.sectionTitle}>Story Inspirations ({displayInspirations.length})</Text>

          {isLoading && isAuthConfigured ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner fullScreen={false} />
            </View>
          ) : error && isAuthConfigured ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : displayInspirations.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.emptyIcon}>💡</Text>
              <Text style={styles.emptyText}>No inspirations yet</Text>
              <Text style={styles.emptySubtext}>
                Add your first inspiration to get started
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayInspirations}
              renderItem={renderInspirationItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.inspirationsList}
            />
          )}

          {!isAuthConfigured && (
            <Card variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoTitle}>Demo Mode</Text>
              <Text style={styles.infoText}>
                Inspirations are stored locally. Set up Supabase to share inspirations with your partner in real-time.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Media Picker Modal */}
      <Modal
        visible={showMediaPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <MediaPicker
          onMediaSelect={(media) => {
            setSelectedMedia(prev => [...prev, ...media]);
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
          maxSelection={3}
        />
      </Modal>

      {/* AI Panel Modal */}
      <Modal
        visible={showAIPanel}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.aiPanelContainer}>
          <View style={styles.aiPanelHeader}>
            <Text style={styles.aiPanelTitle}>AI Suggestions</Text>
            <Button
              variant="ghost"
                size="sm"
              onPress={() => setShowAIPanel(false)}
            >
              ×
            </Button>
          </View>

          <AIPanel
            theme={displayStory.theme}
            onSuggestionSelect={handleUseSuggestion}
            onClose={() => setShowAIPanel(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.95,
  },
  themeLabel: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.8,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
  },
  addInspirationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  inputSpacing: {
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
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
  inspirationActions: {
    justifyContent: 'center',
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
  infoCard: {
    marginTop: 8,
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
  aiButton: {
    paddingHorizontal: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  mediaButton: {
    flex: 0,
  },
  selectedMediaContainer: {
    marginTop: 8,
  },
  selectedMediaLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  selectedMediaList: {
    gap: 8,
  },
  selectedMediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
  },
  selectedMediaIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  selectedMediaText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  removeMediaButton: {
    padding: 4,
    marginLeft: 8,
  },
  removeMediaText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  suggestionsCard: {
    padding: 16,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionItem: {
    marginBottom: 4,
  },
  inspirationsList: {
    marginTop: 8,
  },
  aiPanelContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  aiPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  aiPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  mediaAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  mediaList: {
    marginTop: 8,
    gap: 4,
  },
  mediaIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  mediaCaption: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  suggestionCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  suggestionCost: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  tokenCost: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  aiPanelContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aiPanelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
});