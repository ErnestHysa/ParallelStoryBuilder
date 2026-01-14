import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface AIPanelProps {
  visible: boolean;
  onClose: () => void;
  storyId?: string;
  chapterId?: string;
}

interface AIResult {
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
  tokens_used?: number;
  estimated_cost?: number;
}

const COLORS = {
  primary: '#9C27B0',
  secondary: '#E91E63',
  accent: '#FF9800',
  warning: '#FFC107',
  success: '#4CAF50',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E0E0E0',
};

export function AIPanel({ visible, onClose, storyId, chapterId }: AIPanelProps) {
  const { user } = useAuthStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'analysis' | 'settings'>('tools');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AIResult | null>(null);
  const [costTracker, setCostTracker] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');

  const tools = [
    {
      id: 'cover-art',
      name: 'Generate Cover Art',
      icon: 'image' as const,
      description: 'Create beautiful book covers',
      color: COLORS.primary,
      action: 'coverArt',
    },
    {
      id: 'story-summary',
      name: 'Story Summary',
      icon: 'file-text' as const,
      description: 'Generate summaries for your story',
      color: COLORS.secondary,
      action: 'summary',
    },
    {
      id: 'character-avatar',
      name: 'Character Avatar',
      icon: 'star' as const,
      description: 'Create character portraits',
      color: COLORS.accent,
      action: 'characterAvatar',
    },
    {
      id: 'narrative-analysis',
      name: 'Narrative Analysis',
      icon: 'bar-chart' as const,
      description: 'Analyze story structure',
      color: COLORS.warning,
      action: 'narrativeAnalysis',
    },
    {
      id: 'style-transfer',
      name: 'Style Transfer',
      icon: 'edit-2' as const,
      description: 'Transform writing style',
      color: COLORS.success,
      action: 'styleTransfer',
    },
    {
      id: 'continuation',
      name: 'Continue Writing',
      icon: 'zap' as const,
      description: 'AI-powered writing continuation',
      color: COLORS.primary,
      action: 'continuation',
    },
  ];

  const handleToolSelect = async (toolId: string) => {
    setSelectedTool(toolId);
    setIsLoading(true);
    setAiResults(null);

    try {
      let result: AIResult;

      switch (toolId) {
        case 'cover-art':
          Alert.alert(
            'Cover Art Generator',
            'This feature is available in the cover art generator. Navigate there to use it.',
          );
          setIsLoading(false);
          return;

        case 'story-summary':
          result = {
            success: true,
            data: {
              summary:
                'Your story summary would appear here. This is a placeholder for the actual AI-generated summary.',
            },
            estimated_cost: 0.02,
          };
          break;

        case 'character-avatar':
          result = {
            success: true,
            data: {
              message: 'Character avatar generation is available in the character creator.',
            },
            estimated_cost: 0.01,
          };
          break;

        case 'narrative-analysis':
          result = {
            success: true,
            data: {
              analysis:
                'Narrative analysis would include plot structure, character arcs, pacing, and thematic elements.',
            },
            estimated_cost: 0.03,
          };
          break;

        case 'style-transfer':
          result = {
            success: true,
            data: {
              transformed: 'Your text with the new style applied would appear here.',
            },
            estimated_cost: 0.02,
          };
          break;

        case 'continuation':
          result = {
            success: true,
            data: {
              continuation: 'AI-generated continuation of your story would appear here...',
            },
            estimated_cost: 0.04,
          };
          break;

        default:
          result = {
            success: false,
            error: 'Unknown tool selected',
          };
      }

      setAiResults(result);
      if (result.estimated_cost) {
        setCostTracker((prev) => prev + result.estimated_cost!);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process request');
      setAiResults({
        success: false,
        error: error.message || 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Writing Assistant</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#212121" />
          </TouchableOpacity>
        </View>

        {/* Cost Tracker */}
        <View style={styles.costTracker}>
          <Text style={styles.costText}>Session Cost: ${costTracker.toFixed(4)}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tools' && styles.tabActive]}
            onPress={() => setActiveTab('tools')}
          >
            <Text style={[styles.tabText, activeTab === 'tools' && styles.tabTextActive]}>
              Tools
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analysis' && styles.tabActive]}
            onPress={() => setActiveTab('analysis')}
          >
            <Text style={[styles.tabText, activeTab === 'analysis' && styles.tabTextActive]}>
              Analysis
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'tools' && (
            <>
              <Text style={styles.sectionTitle}>Select an AI Tool</Text>
              {tools.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[
                    styles.toolCard,
                    selectedTool === tool.id && styles.toolCardSelected,
                  ]}
                  onPress={() => handleToolSelect(tool.id)}
                  disabled={isLoading}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${tool.color}20` }]}>
                    <Feather name={tool.icon} size={24} color={tool.color} />
                  </View>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>{tool.name}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#BDBDBD" />
                </TouchableOpacity>
              ))}
            </>
          )}

          {activeTab === 'analysis' && (
            <>
              <Text style={styles.sectionTitle}>Story Analysis</Text>
              <View style={styles.analysisCard}>
                <Text style={styles.analysisText}>
                  Story analysis features include:
                </Text>
                <Text style={styles.analysisBullet}>• Plot structure analysis</Text>
                <Text style={styles.analysisBullet}>• Character arc tracking</Text>
                <Text style={styles.analysisBullet}>• Pacing assessment</Text>
                <Text style={styles.analysisBullet}>• Thematic analysis</Text>
                <Text style={styles.analysisBullet}>• Consistency checking</Text>
              </View>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <Text style={styles.sectionTitle}>AI Settings</Text>
              <View style={styles.settingCard}>
                <Text style={styles.settingTitle}>Model Settings</Text>
                <Text style={styles.settingDescription}>
                  Configure AI behavior and response style
                </Text>
              </View>
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          {/* AI Results */}
          {aiResults && !isLoading && (
            <View style={styles.resultsCard}>
              {aiResults.success ? (
                <>
                  <View style={styles.resultHeader}>
                    <Feather name="check-circle" size={20} color={COLORS.success} />
                    <Text style={styles.resultTitle}>Success</Text>
                  </View>
                  {aiResults.data && (
                    <Text style={styles.resultText}>
                      {typeof aiResults.data === 'string'
                        ? aiResults.data
                        : JSON.stringify(aiResults.data, null, 2)}
                    </Text>
                  )}
                  {aiResults.estimated_cost && (
                    <Text style={styles.costText}>
                      Cost: ${aiResults.estimated_cost.toFixed(4)}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.resultHeader}>
                    <Feather name="alert-circle" size={20} color={COLORS.secondary} />
                    <Text style={styles.resultTitle}>Error</Text>
                  </View>
                  <Text style={styles.errorText}>{aiResults.error}</Text>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  closeButton: {
    padding: 8,
  },
  costTracker: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  costText: {
    fontSize: 14,
    color: '#757575',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#9C27B0',
  },
  tabText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#9C27B0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
    marginTop: 8,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toolCardSelected: {
    borderColor: '#9C27B0',
    backgroundColor: '#F3E5F5',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 14,
    color: '#757575',
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  analysisText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 12,
  },
  analysisBullet: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
    marginLeft: 8,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#757575',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 16,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginLeft: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
  },
});
