import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/TextArea';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

// Sample relationship questions
const RELATIONSHIP_QUESTIONS = [
  "What's something you're grateful about in our relationship today?",
  "What's a dream you've been wanting to share with me?",
  "What's one thing I could do to make your day better?",
  "What's your favorite memory of us together?",
  "What's something you appreciate about me that you haven't said?",
  "What's a challenge you're facing that I can help with?",
  "What's something you're looking forward to in our future?",
  "What's a quality in our relationship you're most proud of?",
  "What's a small act of kindness that meant a lot to you recently?",
  "What's something you've been curious about but haven't asked?",
  "What's a tradition you'd like to start together?",
  "What's something I do that makes you feel most loved?",
];

interface QuestionAnswer {
  id: string;
  question_text: string;
  user_answer: string | null;
  partner_answer: string | null;
  created_at: string;
  revealed_at: string | null;
  relationship_id: string;
  category: string;
  answered_by?: string;
  answered_at?: string;
}

export default function RelationshipQuestions() {
  const { id: relationshipId } = useLocalSearchParams();
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState<QuestionAnswer | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<QuestionAnswer[]>([]);

  const {
    relationshipQuestions,
    fetchQuestions
  } = useRelationshipStore();

  useEffect(() => {
    loadDailyQuestion();
  }, [relationshipId]);

  const loadDailyQuestion = async () => {
    if (!relationshipId) return;

    setLoading(true);
    try {
      await fetchQuestions();
    } catch (error) {
      console.error('Error loading daily question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim()) {
      Alert.alert('Please provide an answer');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update local state
      const updatedQuestion: QuestionAnswer = {
        ...currentQuestion,
        user_answer: userAnswer,
      };
      setCurrentQuestion(updatedQuestion);

      Alert.alert(
        'Answer Submitted!',
        'Your answer has been saved.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting answer:', error);
      Alert.alert('Error', 'Failed to submit your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealAnswers = async () => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    try {
      // Update local state
      const updatedQuestion: QuestionAnswer = {
        ...currentQuestion,
        revealed_at: new Date().toISOString(),
      };
      setCurrentQuestion(updatedQuestion);
      setShowAnswers(true);

      Alert.alert(
        'Answers Revealed!',
        'You can now see both answers.'
      );
    } catch (error) {
      console.error('Error revealing answers:', error);
      Alert.alert('Error', 'Failed to reveal answers. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipQuestion = () => {
    // Pick a random question
    const randomQuestion = RELATIONSHIP_QUESTIONS[Math.floor(Math.random() * RELATIONSHIP_QUESTIONS.length)];
    const newQuestion: QuestionAnswer = {
      id: `q-${Date.now()}`,
      question_text: randomQuestion,
      user_answer: null,
      partner_answer: null,
      created_at: new Date().toISOString(),
      revealed_at: null,
      relationship_id: relationshipId as string,
      category: 'daily',
    };
    setCurrentQuestion(newQuestion);
    setUserAnswer('');
    setShowAnswers(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Daily Questions',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const displayQuestion = currentQuestion || {
    id: 'default',
    question_text: RELATIONSHIP_QUESTIONS[0],
    user_answer: null,
    partner_answer: null,
    created_at: new Date().toISOString(),
    revealed_at: null,
    relationship_id: relationshipId as string,
    category: 'daily',
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Daily Questions',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Question Card */}
        <Card style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <MaterialIcons name="question-answer" size={24} color={theme.colors.primary} />
            <Text style={styles.questionHeaderTitle}>Today's Question</Text>
          </View>
          <Text style={styles.questionText}>{displayQuestion.question_text}</Text>

          <View style={styles.answerSection}>
            {displayQuestion.user_answer ? (
              <View style={styles.answeredContainer}>
                <View style={styles.answeredBadge}>
                  <AntDesign name="checkcircle" size={16} color="#4CAF50" />
                  <Text style={styles.answeredText}>Your Answer:</Text>
                </View>
                <Text style={styles.answerText}>{displayQuestion.user_answer}</Text>

                {!showAnswers && displayQuestion.partner_answer && (
                  <Button
                    onPress={handleRevealAnswers}
                    variant="primary"
                    style={styles.revealButton}
                  >
                    Reveal Partner's Answer
                  </Button>
                )}

                {showAnswers && (
                  <View style={styles.partnerAnswerContainer}>
                    <Text style={styles.partnerAnswerLabel}>Partner's Answer:</Text>
                    <Text style={styles.partnerAnswerText}>
                      {displayQuestion.partner_answer || 'Waiting for partner to respond...'}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.inputSection}>
                <TextArea
                  placeholder="Share your thoughts..."
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  style={styles.answerInput}
                  numberOfLines={4}
                />
                <Button
                  onPress={handleSubmitAnswer}
                  disabled={!userAnswer.trim() || isSubmitting}
                  isLoading={isSubmitting}
                  style={styles.submitButton}
                >
                  Submit Answer
                </Button>
              </View>
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            onPress={handleSkipQuestion}
            variant="ghost"
            style={styles.actionButton}
          >
            <MaterialIcons name="skip-next" size={18} color="#666" />
            Skip Question
          </Button>
          <Button
            onPress={() => router.back()}
            variant="ghost"
            style={styles.actionButton}
          >
            Back to Dashboard
          </Button>
        </View>

        {/* Question History */}
        {answeredQuestions.length > 0 && (
          <Card style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Conversations</Text>
              <MaterialIcons name="history" size={20} color={theme.colors.primary} />
            </View>
            {answeredQuestions.slice(0, 3).map((qa) => (
              <View key={qa.id} style={styles.historyItem}>
                <Text style={styles.historyQuestion}>{qa.question_text}</Text>
                {qa.revealed_at && (
                  <View style={styles.historyAnswers}>
                    <Text style={styles.historyAnswerLabel}>You: {qa.user_answer?.substring(0, 50)}...</Text>
                    <Text style={styles.historyAnswerLabel}>Partner: {qa.partner_answer?.substring(0, 50)}...</Text>
                  </View>
                )}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  questionHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    lineHeight: 26,
    marginBottom: 20,
  },
  answerSection: {
    minHeight: 100,
  },
  inputSection: {
    gap: 12,
  },
  answerInput: {
    minHeight: 100,
  },
  submitButton: {
    marginTop: 8,
  },
  answeredContainer: {
    gap: 16,
  },
  answeredBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  answeredText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2E7D32',
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  revealButton: {
    marginTop: 8,
  },
  partnerAnswerContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  partnerAnswerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#E65100',
    marginBottom: 8,
  },
  partnerAnswerText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  historyCard: {
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  historyQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  historyAnswers: {
    gap: 4,
  },
  historyAnswerLabel: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
