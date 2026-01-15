import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  PixelRatio,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

import { Button } from './Button';
import { QuoteCard } from './QuoteCard';
import { MilestoneCard } from './MilestoneCard';
import { IllustratedCard } from './IllustratedCard';
import {
  CardData,
  CardStyle,
  CardAspectRatio,
  generateCardData,
  generateCardSuggestions,
  CARD_STYLE_PRESETS,
} from '../lib/cardGenerator';
import { shareCard, ShareResult, CardGenerationState } from '../lib/cardRenderer';
import { getRecommendedPlatforms, createShareMessage } from '../lib/socialShare';
import { Story, Chapter } from '../lib/types';

interface StoryMember {
  user_id: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

const { width: screenWidth } = Dimensions.get('window');
const scale = PixelRatio.get();

interface ShareableCardDialogProps {
  visible: boolean;
  onClose: () => void;
  story: Story;
  chapters: Chapter[];
  members?: StoryMember[];
  currentUserId?: string;
}

type GenerationStage = 'idle' | 'preview' | 'generating' | 'sharing';

export function ShareableCardDialog({
  visible,
  onClose,
  story,
  chapters,
  members = [],
  currentUserId,
}: ShareableCardDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('quote');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<CardAspectRatio>('story');
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [generationStage, setGenerationStage] = useState<GenerationStage>('idle');
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Generate card suggestions when modal opens or story changes
  const [cardSuggestions, setCardSuggestions] = useState<CardData[]>([]);

  useEffect(() => {
    if (visible && story && chapters.length > 0) {
      const suggestions = generateCardSuggestions(story, chapters, 3);
      setCardSuggestions(suggestions);
      setSelectedSuggestion(0);
    }
  }, [visible, story.id, chapters.length]);

  const cardRef = useRef<View>(null);

  // Get current card data
  const currentCard: CardData = cardSuggestions[selectedSuggestion] ||
    generateCardData(story, chapters, selectedStyle, selectedAspectRatio);

  // Get partner name for display on cards
  const partnerName = React.useMemo(() => {
    if (!members || members.length === 0) return null;
    const creatorId = story.created_by || currentUserId;
    const partner = members.find(m => m.user_id !== creatorId);
    if (!partner) return null;
    return partner.profile?.display_name || partner.profile?.email || null;
  }, [members, story.created_by, currentUserId]);

  // Recommended platforms for selected aspect ratio
  const recommendedPlatforms = getRecommendedPlatforms(selectedAspectRatio);

  // Generate and share card
  const handleShare = useCallback(async () => {
    if (!cardRef.current) {
      Alert.alert('Error', 'Unable to capture card. Please try again.');
      return;
    }

    setGenerationStage('generating');

    try {
      // Capture the card as an image
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        width: CARD_DIMENSIONS[selectedAspectRatio].width / scale,
        height: CARD_DIMENSIONS[selectedAspectRatio].height / scale,
        result: 'tmpfile',
      });

      setGenerationStage('sharing');

      // Share the card
      const result = await shareCard(uri, currentCard, 'png');

      setShareResult(result);

      if (result.success) {
        // Track successful share
        setGenerationStage('idle');
      } else {
        setGenerationStage('idle');
        Alert.alert('Share Failed', result.error || 'Unable to share card. Please try again.');
      }
    } catch (error) {
      setGenerationStage('idle');
      console.error('Error sharing card:', error);
      Alert.alert('Error', 'Failed to generate or share card. Please try again.');
    }
  }, [cardRef, selectedAspectRatio, currentCard]);

  // Handle style selection
  const handleStyleSelect = useCallback((style: CardStyle) => {
    setSelectedStyle(style);
    setSelectedSuggestion(
      cardSuggestions.findIndex(c => c.config.style === style) || 0
    );
  }, [cardSuggestions]);

  // Handle aspect ratio selection
  const handleAspectRatioChange = useCallback((ratio: CardAspectRatio) => {
    setSelectedAspectRatio(ratio);
    // Regenerate suggestions with new aspect ratio
    const suggestions = generateCardSuggestions(story, chapters, 3);
    setCardSuggestions(suggestions.map(s => ({ ...s, aspectRatio: ratio })));
  }, [story, chapters]);

  // Toggle preview mode
  const togglePreview = useCallback(() => {
    setPreviewMode(prev => !prev);
  }, []);

  // Close dialog
  const handleClose = useCallback(() => {
    setGenerationStage('idle');
    setShareResult(null);
    setPreviewMode(false);
    onClose();
  }, [onClose]);

  // Render card preview
  const renderCardPreview = () => {
    const cardWidth = Math.min(screenWidth * 0.8, 300);
    const cardHeight = cardWidth * (selectedAspectRatio === 'story' ? 16/9 :
                                    selectedAspectRatio === 'square' ? 1 : 4/3);

    const cardStyle = currentCard.config.style;

    return (
      <View style={styles.previewContainer}>
        <View
          ref={cardRef}
          collapsable={false}
          style={[
            styles.cardPreview,
            {
              width: cardWidth,
              height: previewMode ? 'auto' : cardHeight,
            },
          ]}
        >
          {cardStyle === 'quote' && (
            <QuoteCard
              config={currentCard.config}
              theme={story.theme}
              aspectRatio={selectedAspectRatio}
              width={previewMode ? undefined : cardWidth * scale}
              height={previewMode ? undefined : cardHeight * scale}
              partnerName={partnerName}
            />
          )}
          {cardStyle === 'milestone' && (
            <MilestoneCard
              config={currentCard.config}
              aspectRatio={selectedAspectRatio}
              width={previewMode ? undefined : cardWidth * scale}
              height={previewMode ? undefined : cardHeight * scale}
            />
          )}
          {cardStyle === 'illustrated' && (
            <IllustratedCard
              config={currentCard.config}
              theme={story.theme}
              aspectRatio={selectedAspectRatio}
              width={previewMode ? undefined : cardWidth * scale}
              height={previewMode ? undefined : cardHeight * scale}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Share Your Story</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#757575" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Card Preview */}
          {renderCardPreview()}

          {/* Preview toggle */}
          <TouchableOpacity onPress={togglePreview} style={styles.previewToggle}>
            <Feather name={previewMode ? 'minimize-2' : 'maximize-2'} size={18} color="#E91E63" />
            <Text style={styles.previewToggleText}>
              {previewMode ? 'Show Mini Preview' : 'Show Full Size'}
            </Text>
          </TouchableOpacity>

          {/* Card Style Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Style</Text>
            <View style={styles.styleGrid}>
              {Object.entries(CARD_STYLE_PRESETS).map(([style, preset]) => {
                const isSelected = selectedStyle === style;
                return (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.styleOption,
                      isSelected && styles.selectedStyleOption,
                    ]}
                    onPress={() => handleStyleSelect(style as CardStyle)}
                    activeOpacity={0.7}
                    accessibilityLabel={`${preset.label} style`}
                    accessibilityHint={preset.description}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View
                      style={[
                        styles.stylePreview,
                        { backgroundColor: preset.previewColors[0] },
                      ]}
                    >
                      <Feather
                        name={preset.icon as any}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text
                      style={[
                        styles.styleLabel,
                        isSelected && styles.selectedStyleLabel,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Aspect Ratio Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size & Format</Text>
            <View style={styles.aspectRatioRow}>
              {(['story', 'square', 'portrait'] as const).map((ratio) => {
                const isSelected = selectedAspectRatio === ratio;
                const labels = {
                  story: 'Story\n9:16',
                  square: 'Square\n1:1',
                  portrait: 'Portrait\n4:5',
                };
                return (
                  <TouchableOpacity
                    key={ratio}
                    style={[
                      styles.aspectRatioOption,
                      isSelected && styles.selectedAspectRatio,
                    ]}
                    onPress={() => handleAspectRatioChange(ratio)}
                    accessibilityLabel={labels[ratio]}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Feather
                      name={ratio === 'story' ? 'smartphone' :
                            ratio === 'square' ? 'square' : 'tablet'}
                      size={18}
                      color={isSelected ? '#FFFFFF' : '#757575'}
                    />
                    <Text
                      style={[
                        styles.aspectRatioLabel,
                        isSelected && styles.selectedAspectRatioLabel,
                      ]}
                    >
                      {labels[ratio]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.recommendedText}>
              Best for: {recommendedPlatforms.map(p => p.name).join(', ')}
            </Text>
          </View>

          {/* Share Info */}
          <View style={styles.section}>
            <View style={styles.shareInfo}>
              <Feather name="info" size={20} color="#E91E63" />
              <View style={styles.shareInfoContent}>
                <Text style={styles.shareInfoTitle}>
                  {currentCard.config.style === 'quote'
                    ? 'Share a meaningful quote'
                    : currentCard.config.style === 'milestone'
                    ? 'Celebrate your progress'
                    : 'Share your beautiful story'}
                </Text>
                <Text style={styles.shareInfoText}>
                  Your card will be shared as a high-quality image.
                  Tag @parallelstorybuilder for a chance to be featured!
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            variant="ghost"
            onPress={handleClose}
            style={styles.footerButton}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleShare}
            style={styles.footerButton}
            isLoading={generationStage === 'generating' || generationStage === 'sharing'}
            disabled={generationStage !== 'idle'}
          >
            {generationStage === 'generating' ? 'Creating Card...' :
             generationStage === 'sharing' ? 'Opening Share Sheet...' :
             'Share Card'}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const CARD_DIMENSIONS = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    // Add shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 24,
    gap: 8,
  },
  previewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E91E63',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  styleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  styleOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#FAFAFA',
  },
  selectedStyleOption: {
    borderColor: '#E91E63',
    backgroundColor: '#FCE4EC',
  },
  stylePreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  styleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
    textAlign: 'center',
  },
  selectedStyleLabel: {
    color: '#E91E63',
  },
  aspectRatioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aspectRatioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  selectedAspectRatio: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  aspectRatioLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
  },
  selectedAspectRatioLabel: {
    color: '#FFFFFF',
  },
  recommendedText: {
    fontSize: 13,
    color: '#757575',
    marginTop: 8,
  },
  shareInfo: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FCE4EC',
  },
  shareInfoContent: {
    flex: 1,
  },
  shareInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  shareInfoText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  footerButton: {
    flex: 1,
  },
});

export default ShareableCardDialog;
