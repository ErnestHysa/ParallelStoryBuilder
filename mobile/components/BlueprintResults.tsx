/**
 * BlueprintResults Component
 *
 * Displays the personalized results after completing the Relationship Blueprint Quiz.
 * Shows relationship insights, recommended themes, and next steps.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuizStore } from '@/stores/quizStore';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import { supabase } from '@/lib/supabase';
import { QuizResult, Theme } from '@/lib/types';
import * as Notifications from 'expo-notifications';

const COLORS = {
  primary: '#E91E63',
  primaryLight: '#FCE4EC',
  secondary: '#9C27B0',
  accent: '#FFC107',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BlueprintResultsProps {
  onComplete?: () => void;
}

export function BlueprintResults({ onComplete }: BlueprintResultsProps) {
  const { result, getPersonalizedPrompts, getPersonalizedQuestions } = useQuizStore();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'prompts' | 'questions'>('insights');
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Save result to profile if logged in
    if (user && result) {
      saveBlueprintResult(result);
    }

    // Check notification permissions and show prompt after a delay
    const checkNotificationPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          // Show prompt after 2 seconds if permissions not granted
          const timer = setTimeout(() => {
            setShowNotificationPrompt(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Failed to check notification permissions:', error);
      }
    };

    checkNotificationPermissions();
  }, [result, user]);

  const saveBlueprintResult = async (quizResult: QuizResult) => {
    try {
      await supabase
        .from('profiles')
        .update({
          blueprint_data: quizResult,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to save blueprint result:', error);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    if (onComplete) {
      onComplete();
    } else {
      router.replace('/(app)');
    }
  };

  const handleCreateStory = () => {
    // Navigate to create story with recommended theme
    if (result?.storyPreferences[0]?.theme) {
      router.push({
        pathname: '/create-story',
        params: { theme: result.storyPreferences[0].theme },
      });
    } else {
      router.push('/create-story');
    }
  };

  if (!result) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your results...</Text>
      </View>
    );
  }

  const personalizedPrompts = getPersonalizedPrompts();
  const personalizedQuestions = getPersonalizedQuestions();

  const getRelationshipStageLabel = (stage: QuizResult['relationshipStage']) => {
    switch (stage) {
      case 'new_ldr':
        return { label: 'New Love', icon: '🌱', color: '#4CAF50', description: 'Just starting your journey' };
      case 'established_ldr':
        return { label: 'Going Strong', icon: '💪', color: '#E91E63', description: 'Building something real' };
      case 'veteran_ldr':
        return { label: 'Veterans', icon: '🏆', color: '#FF9800', description: 'Distance veterans' };
    }
  };

  const getCommunicationStyleLabel = (style: QuizResult['communicationStyle']) => {
    switch (style) {
      case 'writer':
        return { label: 'Expressive Writer', icon: '✍️', description: 'You express yourself best through writing' };
      case 'talker':
        return { label: 'Conversationalist', icon: '💬', description: 'Words flow easily in conversation' };
      case 'visual':
        return { label: 'Visual Thinker', icon: '🎨', description: 'You see the world in images' };
      case 'shared_experience':
        return { label: 'Experience Seeker', icon: '🌟', description: 'Shared activities strengthen your bond' };
    }
  };

  const getLoveLanguageLabel = (language: QuizResult['loveLanguage']) => {
    switch (language) {
      case 'words':
        return { label: 'Words of Affirmation', icon: '💬', color: '#E91E63' };
      case 'time':
        return { label: 'Quality Time', icon: '⏰', color: '#9C27B0' };
      case 'gifts':
        return { label: 'Gift Giving', icon: '🎁', color: '#FFC107' };
      case 'touch':
        return { label: 'Physical Touch', icon: '🤗', color: '#4CAF50' };
      case 'acts':
        return { label: 'Acts of Service', icon: '🛠️', color: '#2196F3' };
    }
  };

  const stageInfo = getRelationshipStageLabel(result.relationshipStage);
  const commStyleInfo = getCommunicationStyleLabel(result.communicationStyle);
  const loveLangInfo = getLoveLanguageLabel(result.loveLanguage);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.celebrationContainer}>
          <Text style={styles.celebrationIcon}>🎉</Text>
        </View>
        <Text style={styles.title}>Your Relationship Blueprint</Text>
        <Text style={styles.subtitle}>Personalized insights just for you two</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Relationship Stage Card */}
          <Card variant="elevated" style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIconContainer, { backgroundColor: stageInfo.color + '20' }]}>
                <Text style={styles.insightIcon}>{stageInfo.icon}</Text>
              </View>
              <View style={styles.insightHeaderContent}>
                <Text style={styles.insightTitle}>{stageInfo.label}</Text>
                <Text style={styles.insightDescription}>{stageInfo.description}</Text>
              </View>
            </View>
            <View style={styles.insightDetails}>
              <Text style={styles.insightDetailText}>
                Based on your relationship stage, we've curated prompts and experiences
                tailored to where you are in your journey.
              </Text>
            </View>
          </Card>

          {/* Communication Style Card */}
          <Card variant="elevated" style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                <Text style={styles.insightIcon}>{commStyleInfo.icon}</Text>
              </View>
              <View style={styles.insightHeaderContent}>
                <Text style={styles.insightTitle}>{commStyleInfo.label}</Text>
                <Text style={styles.insightDescription}>{commStyleInfo.description}</Text>
              </View>
            </View>
          </Card>

          {/* Love Language Card */}
          <Card variant="elevated" style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIconContainer, { backgroundColor: loveLangInfo.color + '20' }]}>
                <Text style={styles.insightIcon}>{loveLangInfo.icon}</Text>
              </View>
              <View style={styles.insightHeaderContent}>
                <Text style={styles.insightTitle}>{loveLangInfo.label}</Text>
                <Text style={styles.insightDescription}>Your primary love language</Text>
              </View>
            </View>
          </Card>

          {/* Theme Recommendations */}
          <Card variant="elevated" style={styles.insightCard}>
            <Text style={styles.sectionTitle}>Recommended Story Themes</Text>
            <View style={styles.themesContainer}>
              {result.storyPreferences.slice(0, 3).map((themeRec, index) => {
                const themeInfo: Record<Theme, { name: string; icon: string; color: string }> = {
                  romance: { name: 'Romance', icon: '💕', color: '#E91E63' },
                  fantasy: { name: 'Fantasy', icon: '🐉', color: '#9C27B0' },
                  our_future: { name: 'Our Future', icon: '🌟', color: '#2196F3' },
                };
                const info = themeInfo[themeRec.theme];
                return (
                  <View key={themeRec.theme} style={[styles.themeItem, { borderColor: info.color }]}>
                    <Text style={styles.themeIcon}>{info.icon}</Text>
                    <View style={styles.themeContent}>
                      <Text style={styles.themeName}>{info.name}</Text>
                      <Text style={styles.themeReason}>{themeRec.reason}</Text>
                    </View>
                    <View style={[styles.themeRank, { backgroundColor: info.color }]}>
                      <Text style={styles.themeRankText}>{index + 1}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Personality Traits */}
          {result.personalityTraits.length > 0 && (
            <Card variant="elevated" style={styles.insightCard}>
              <Text style={styles.sectionTitle}>Your Personality Traits</Text>
              <View style={styles.traitsContainer}>
                {result.personalityTraits.map((trait, index) => (
                  <View key={index} style={styles.traitBadge}>
                    <Text style={styles.traitText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
              onPress={() => setActiveTab('insights')}
            >
              <MaterialIcons
                name="lightbulb"
                size={20}
                color={activeTab === 'insights' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
                Recommendations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'prompts' && styles.activeTab]}
              onPress={() => setActiveTab('prompts')}
            >
              <MaterialIcons
                name="edit"
                size={20}
                color={activeTab === 'prompts' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'prompts' && styles.activeTabText]}>
                Writing Prompts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'questions' && styles.activeTab]}
              onPress={() => setActiveTab('questions')}
            >
              <MaterialIcons
                name="help"
                size={20}
                color={activeTab === 'questions' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'questions' && styles.activeTabText]}>
                Questions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <Card variant="outlined" style={styles.tabContentCard}>
            {activeTab === 'insights' && (
              <View style={styles.tabContent}>
                <Text style={styles.tabContentTitle}>Personalized Recommendations</Text>
                {result.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View
                      style={[
                        styles.recommendationBadge,
                        {
                          backgroundColor:
                            rec.priority === 'high'
                              ? '#E91E63'
                              : rec.priority === 'medium'
                              ? '#FF9800'
                              : '#9C27B0',
                        },
                      ]}
                    >
                      <MaterialIcons name="star" size={12} color="#fff" />
                    </View>
                    <Text style={styles.recommendationText}>{rec.content}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'prompts' && (
              <View style={styles.tabContent}>
                <Text style={styles.tabContentTitle}>Story Writing Prompts</Text>
                {personalizedPrompts.map((prompt, index) => (
                  <TouchableOpacity key={index} style={styles.promptItem}>
                    <View style={styles.promptNumber}>
                      <Text style={styles.promptNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.promptText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeTab === 'questions' && (
              <View style={styles.tabContent}>
                <Text style={styles.tabContentTitle}>Relationship Questions</Text>
                {personalizedQuestions.map((question, index) => (
                  <View key={index} style={styles.questionItem}>
                    <MaterialIcons name="chat-bubble" size={20} color={COLORS.primary} />
                    <Text style={styles.questionText}>{question}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          variant="ghost"
          onPress={handleComplete}
          style={styles.laterButton}
        >
          Do This Later
        </Button>
        <Button
          onPress={handleCreateStory}
          isLoading={isLoading}
          style={styles.createButton}
        >
          Create Your Story
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </Button>
      </View>

      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt
        visible={showNotificationPrompt}
        onDismiss={() => setShowNotificationPrompt(false)}
        onEnabled={() => setShowNotificationPrompt(false)}
        partnerName={result?.loveLanguage ? undefined : 'your partner'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  celebrationContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  celebrationIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  insightCard: {
    padding: 20,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightIcon: {
    fontSize: 24,
  },
  insightHeaderContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  insightDetails: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
  },
  insightDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  themesContainer: {
    gap: 12,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  themeContent: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  themeReason: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  themeRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  themeRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  traitText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  tabContentCard: {
    padding: 16,
  },
  tabContent: {
    minHeight: 150,
  },
  tabContentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  promptNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promptNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  laterButton: {
    flex: 1,
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default BlueprintResults;
