import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEditorStore } from '@/stores/editorStore';
import { useStoriesStore } from '@/stores/storiesStore';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import { useTokenStore } from '@/stores/tokenStore';
import { Story } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/TextArea';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import RichTextEditor from '@/components/RichTextEditor';
import { Theme } from '@/lib/types';

// Placeholder components for missing ones
const AutoSaveIndicator: React.FC<{ lastSaved: number | null; style?: any }> = ({ lastSaved, style }) => (
  <Text style={[styles.autoSaveText, style]}>
    {lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : 'Not saved'}
  </Text>
);

const TokenCostIndicator: React.FC<{ content: string; isAuthConfigured: boolean; style?: any }> = ({ content, isAuthConfigured, style }) => {
  const cost = content.length * 0.5;
  return isAuthConfigured ? (
    <Text style={[styles.tokenCostText, style]}>Estimated cost: {cost.toFixed(1)} 💎</Text>
  ) : null;
};

const MediaPicker: React.FC<{ onMediaSelect: (media: any) => void; onClose: () => void }> = ({ onMediaSelect, onClose }) => (
  <View style={styles.modalContainer}>
    <Text style={styles.modalTitle}>Media Picker</Text>
    <Button onPress={onClose}>Close</Button>
  </View>
);

const CharacterSuggestions: React.FC<{ story: Story; onCharacterSelect: (character: any) => void }> = ({ onCharacterSelect }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Character suggestions coming soon</Text>
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
};

const THEME_INFO: Record<Theme, { label: string; emoji: string; color: string }> = {
  romance: { label: 'Romance', emoji: '💕', color: '#E91E63' },
  fantasy: { label: 'Fantasy', emoji: '🐉', color: '#9C27B0' },
  our_future: { label: 'Our Future', emoji: '🌟', color: '#2196F3' },
};

// Demo AI enhancement - simulates AI enhancement
const demoEnhanceContent = (content: string): string => {
  const enhancements = [
    {
      pattern: /rain/i,
      addition: ' Each droplet painted a thousand memories on the windowpane, echoing the rhythm of a heart beating across the miles.',
    },
    {
      pattern: /love/i,
      addition: ' The feeling blossomed like spring flowers after a long winter, warming every corner of their soul.',
    },
    {
      pattern: /smile/i,
      addition: ' It reached their eyes, crinkling the corners with genuine joy that transcended the digital distance.',
    },
  ];

  let enhanced = content;
  for (const { pattern, addition } of enhancements) {
    if (pattern.test(enhanced)) {
      enhanced += ' ' + addition;
      break;
    }
  }

  // Add some general flair if no specific pattern matched
  if (enhanced === content) {
    enhanced += ' The moment lingered, suspended in time, as if the universe itself was holding its breath.';
  }

  return enhanced;
};

// AI tools for rich text editing
const aiTools = [
  {
    id: 'grammar',
    name: 'Grammar Check',
    description: 'Fix grammar and spelling',
    icon: '✏️',
    cost: 5,
  },
  {
    id: 'style',
    name: 'Style Enhancement',
    description: 'Improve writing style',
    icon: '✨',
    cost: 10,
  },
  {
    id: 'expand',
    name: 'Expand Ideas',
    description: 'Expand on your ideas',
    icon: '📝',
    cost: 15,
  },
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Summarize this section',
    icon: '📊',
    cost: 8,
  },
];

export default function WriteChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentStory, fetchStory } = useStoriesStore();
  const { getStory, addChapter } = useDemoStore();
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const { tokens } = useTokenStore();

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
    saveDraft,
    reset,
    selectedFormat,
    setFormat,
    applyFormatting,
  } = useEditorStore();

  const [story, setStory] = useState<Story | null>(null);
  const [localError, setLocalError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isDemoEnhancing, setIsDemoEnhancing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showCharacterSuggestions, setShowCharacterSuggestions] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const lastSavedContentRef = useRef(draftContent);

  useEffect(() => {
    if (id) {
      if (isAuthConfigured) {
        fetchStory(id);
      } else {
        const demoStory = getStory(id);
        if (demoStory) {
          setStory(demoStory);
        }
      }
    }

    // Auto-save functionality - actually saves draft every 30 seconds
    // Note: We use refs to avoid recreating the interval when content changes
    const saveInterval = setInterval(async () => {
      const currentContent = draftContent.trim();
      const lastSaved = lastSavedContentRef.current.trim();

      // Only save if content has changed
      if (currentContent && currentContent !== lastSaved && id && isAuthConfigured) {
        try {
          await saveDraft(id);
          setLastSaved(Date.now());
          lastSavedContentRef.current = draftContent;
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      } else if (currentContent && currentContent !== lastSaved && id && !isAuthConfigured) {
        // Demo mode: just update the timestamp
        setLastSaved(Date.now());
        lastSavedContentRef.current = draftContent;
      }
    }, 30000);

    return () => {
      clearInterval(saveInterval);
      reset();
    };
  }, [id, isAuthConfigured, saveDraft, reset, fetchStory, getStory]);

  const displayStory = isAuthConfigured ? currentStory : story;

  const validate = () => {
    if (!draftContent.trim()) {
      setLocalError('Chapter content is required');
      return false;
    }
    // Add minimum length validation
    if (draftContent.trim().length < 50) {
      setLocalError('Chapter content must be at least 50 characters long');
      return false;
    }
    return true;
  };

  const handleEnhance = async (toolId?: string) => {
    if (!draftContent.trim()) {
      setLocalError('Please write some content first');
      return;
    }

    setLocalError('');
    setIsDemoEnhancing(true);
    setSelectedTool(toolId || 'enhance');

    try {
      if (isAuthConfigured) {
        await enhanceWithAI(id);
      } else {
        // Demo mode: simulate AI enhancement
        await new Promise(resolve => setTimeout(resolve, 1500));
        let enhanced = draftContent;

        if (toolId === 'grammar') {
          enhanced = demoEnhanceContent(demoEnhanceContent(draftContent));
        } else if (toolId === 'style') {
          enhanced = demoEnhanceContent(demoEnhanceContent(demoEnhanceContent(draftContent)));
        } else if (toolId === 'expand') {
          enhanced = draftContent + ' ' + demoEnhanceContent('');
        } else {
          enhanced = demoEnhanceContent(draftContent);
        }

        // Store demo enhanced content locally
        setLocalError('');
        setShowPreview(true);
        (handleEnhance as any).demoEnhanced = enhanced;
      }
      setShowPreview(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to enhance content';
      setLocalError(message);
      Alert.alert('Enhancement Failed', message);
    } finally {
      setIsDemoEnhancing(false);
    }
  };

  const handleApplyFormatting = (format: string) => {
    applyFormatting(format);
  };

  const handleMediaInsert = (media: any) => {
    const mediaText = `\n\n[Image: ${media.type}]${media.caption ? ` - ${media.caption}` : ''}\n`;
    setDraftContent(draftContent + mediaText);
    setShowMediaPicker(false);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    // Check token balance
    const estimatedCost = draftContent.length * 0.5; // 0.5 tokens per character
    if (isAuthConfigured && tokens < estimatedCost) {
      Alert.alert(
        'Insufficient Tokens',
        `This chapter will cost approximately ${estimatedCost.toFixed(1)} tokens, but you only have ${tokens} tokens.`,
        [
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setLocalError('');
    try {
      if (isAuthConfigured) {
        await submitChapter(id);
      } else {
        // Demo mode: add chapter to demo store
        const contentToSubmit = showPreview && (handleEnhance as any).demoEnhanced
          ? (handleEnhance as any).demoEnhanced
          : draftContent;
        addChapter(id, contentToSubmit);
      }
      Alert.alert(
        'Chapter Submitted!',
        'Your chapter has been added to the story.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Check if navigation is possible
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(app)');
              }
            },
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

  if (!displayStory) {
    return <LoadingSpinner />;
  }

  const theme = THEME_INFO[displayStory.theme];
  const isLoading = isEnhancing || isDemoEnhancing;
  const demoEnhancedContent = (handleEnhance as any).demoEnhanced;
  const displayEnhanced = isAuthConfigured ? aiEnhancedContent : demoEnhancedContent;

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
        <View style={[styles.header, { backgroundColor: theme.color }]}>
          <Text style={styles.title}>Write Chapter</Text>
          <Text style={styles.subtitle}>{displayStory.title}</Text>
          <Text style={styles.themeLabel}>{theme.emoji} {theme.label}</Text>

          <AutoSaveIndicator lastSaved={lastSaved} />
        </View>

        <View style={styles.content}>
          <Card variant="outlined" style={styles.card}>
            <Text style={styles.sectionLabel}>Context Snippet (Optional)</Text>
            <Text style={styles.sectionHint}>
              Add a brief note about the direction of this chapter
            </Text>
            <Input
              placeholder="E.g., 'Focus on the emotional reunion...'"
              value={contextSnippet || ''}
              onChangeText={setContextSnippet}
              accessibilityLabel="Context snippet"
              accessibilityHint="Optional context for the chapter"
              style={styles.inputSpacing}
            />

            <View style={styles.editorHeader}>
              <Text style={styles.sectionLabel}>Chapter Content</Text>
              <View style={styles.editorTools}>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowCharacterSuggestions(true)}
                  style={styles.editorToolButton}
                >
                  👥 Characters
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowMediaPicker(true)}
                  style={styles.editorToolButton}
                >
                  📷 Media
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowAIPanel(!showAIPanel)}
                  style={styles.editorToolButton}
                >
                  🤖 AI
                </Button>
              </View>
            </View>

            <Text style={styles.sectionHint}>
              Write your chapter here. Let your creativity flow!
            </Text>

            {/* Rich Text Editor */}
            <RichTextEditor
              value={draftContent}
              onChangeText={setDraftContent}
              onFormat={handleApplyFormatting}
              error={localError && !draftContent.trim() ? localError : ''}
              style={styles.inputSpacing}
            />

            {/* Token Cost Indicator */}
            <TokenCostIndicator
              content={draftContent}
              isAuthConfigured={isAuthConfigured}
              style={styles.inputSpacing}
            />

            <View style={styles.buttonRow}>
              <Button
                style={styles.flexButton}
                onPress={() => handleEnhance()}
                isLoading={isLoading}
                disabled={!draftContent.trim()}
                accessibilityLabel="Enhance with AI"
                accessibilityHint="Use AI to enhance your writing"
              >
                {isAuthConfigured ? '✨ AI Enhance' : '✨ Demo Enhance'}
              </Button>

              <Button
                variant="ghost"
                onPress={togglePreview}
                disabled={!displayEnhanced}
                accessibilityLabel="Toggle preview"
                accessibilityHint={showPreview ? 'Hide enhanced version' : 'Show enhanced version'}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </View>

            {localError && draftContent.trim() && (
              <Text style={styles.errorText}>{localError}</Text>
            )}
          </Card>

          {/* AI Panel */}
          {showAIPanel && (
            <Card variant="elevated" style={styles.aiPanelCard}>
              <View style={styles.aiPanelHeader}>
                <Text style={styles.aiPanelTitle}>AI Writing Assistant</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowAIPanel(false)}
                >
                  ×
                </Button>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.aiToolsContainer}>
                  {aiTools.map((tool) => (
                    <TouchableOpacity
                      key={tool.id}
                      style={[
                        styles.aiTool,
                        selectedTool === tool.id && styles.aiToolSelected
                      ]}
                      onPress={() => handleEnhance(tool.id)}
                      disabled={!draftContent.trim() || tokens < tool.cost}
                    >
                      <Text style={styles.aiToolIcon}>{tool.icon}</Text>
                      <Text style={styles.aiToolName}>{tool.name}</Text>
                      <Text style={styles.aiToolCost}>{tool.cost} 💎</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.aiToolsHint}>
                Select a tool to enhance your writing. Each tool uses tokens.
              </Text>
            </Card>
          )}

          {/* Character Suggestions */}
          {showCharacterSuggestions && (
            <Card variant="elevated" style={styles.suggestionsCard}>
              <View style={styles.suggestionsHeader}>
                <Text style={styles.suggestionsTitle}>Character Suggestions</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowCharacterSuggestions(false)}
                >
                  ×
                </Button>
              </View>

              <CharacterSuggestions
                story={displayStory}
                onCharacterSelect={(character) => {
                  setDraftContent(draftContent + `\n\n${character.name}: ${character.description}`);
                  setShowCharacterSuggestions(false);
                }}
              />
            </Card>
          )}

          {/* Enhanced Preview */}
          {showPreview && displayEnhanced && (
            <Card variant="elevated" style={styles.card}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>
                  {selectedTool ? `${aiTools.find(t => t.id === selectedTool)?.name} Version` : '✨ Enhanced Version'}
                </Text>
                <Text style={styles.previewSubtitle}>AI-powered suggestions</Text>
              </View>
              <Text style={styles.previewText}>
                {displayEnhanced}
              </Text>
              <Button
                variant="secondary"
                onPress={() => {
                  setDraftContent(displayEnhanced || '');
                  setShowPreview(false);
                  (handleEnhance as any).demoEnhanced = null;
                  setSelectedTool(null);
                }}
                accessibilityLabel="Use enhanced version"
                accessibilityHint="Replace your draft with the enhanced version"
              >
                Use This Version
              </Button>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
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
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(app)');
                }
              }}
              accessibilityLabel="Cancel"
              accessibilityHint="Return to story without submitting"
            >
              Cancel
            </Button>
          </View>

          {!isAuthConfigured && (
            <Card variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoTitle}>Demo Mode</Text>
              <Text style={styles.infoText}>
                AI enhancement is simulated. Set up Supabase for real AI-powered writing assistance.
              </Text>
            </Card>
          )}
        </View>

        {/* Media Picker Modal */}
        <Modal
          visible={showMediaPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <MediaPicker
            onMediaSelect={handleMediaInsert}
            onClose={() => setShowMediaPicker(false)}
          />
        </Modal>
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
  header: {
    padding: 24,
    position: 'relative',
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
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inputSpacing: {
    marginTop: 8,
  },
  editorHeader: {
    marginBottom: 12,
  },
  editorTools: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editorToolButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  aiPanelCard: {
    padding: 16,
  },
  aiPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  aiToolsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  aiTool: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    opacity: 0.6,
  },
  aiToolSelected: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
    opacity: 1,
  },
  aiToolIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  aiToolName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  aiToolCost: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  aiToolsHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
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
  previewHeader: {
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  previewSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  autoSaveText: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.8,
    marginTop: 8,
  },
  tokenCostText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  placeholderContainer: {
    padding: 16,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});