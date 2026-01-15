/**
 * BlueprintQuiz Component
 *
 * A comprehensive onboarding quiz that personalizes the app experience
 * based on relationship stage, communication style, and story preferences.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuizStore } from '@/stores/quizStore';
import {
  QUIZ_QUESTIONS,
  QUIZ_CATEGORIES,
  QuizQuestion,
  QuizOption,
  QuestionType,
  QuizCategory,
} from '@/lib/blueprintQuiz';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

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
  error: '#F44336',
  success: '#4CAF50',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BlueprintQuizProps {
  onComplete?: () => void;
  onSkip?: () => void;
  standalone?: boolean;
}

export function BlueprintQuiz({
  onComplete,
  onSkip,
  standalone = true,
}: BlueprintQuizProps) {
  const {
    currentQuestionIndex,
    answers,
    setCurrentQuestion,
    nextQuestion,
    previousQuestion,
    setAnswer,
    skipQuestion,
    completeQuiz,
    skipQuiz,
    getCurrentQuestion,
    getProgress,
    canProceed,
  } = useQuizStore();

  const [selectedValue, setSelectedValue] = useState<string | number | string[]>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  const currentQuestion = getCurrentQuestion();

  // Update selected value when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = answers.find((a) => a.questionId === currentQuestion.id);
      if (existingAnswer && !existingAnswer.skipped) {
        setSelectedValue(existingAnswer.value);
      } else {
        setSelectedValue(currentQuestion.type === 'multiple' ? [] : '');
      }
    }
  }, [currentQuestion, answers]);

  // Animate slide transition
  const animateTransition = (direction: 'next' | 'prev' | 'stay') => {
    setIsAnimating(true);
    const directionValue = direction === 'next' ? 1 : direction === 'prev' ? -1 : 0;

    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: directionValue * SCREEN_WIDTH * 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnimation.setValue(directionValue * -SCREEN_WIDTH * 0.3);
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    // Save the answer
    if (selectedValue !== '' && selectedValue !== undefined) {
      setAnswer(currentQuestion.id, selectedValue);
    }

    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      animateTransition('next');
      setTimeout(() => {
        nextQuestion();
      }, 150);
    } else {
      // Quiz completed
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      animateTransition('prev');
      setTimeout(() => {
        previousQuestion();
      }, 150);
    }
  };

  const handleSkip = () => {
    if (!currentQuestion) return;
    skipQuestion(currentQuestion.id);
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      animateTransition('next');
      setTimeout(() => nextQuestion(), 150);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const result = completeQuiz();
    if (standalone) {
      router.replace('/blueprint-results');
    } else {
      onComplete?.();
    }
  };

  const handleSkipQuiz = () => {
    skipQuiz();
    if (standalone) {
      router.replace('/(app)');
    } else {
      onSkip?.();
    }
  };

  const getCategoryInfo = (category: QuizCategory) => QUIZ_CATEGORIES[category];

  const progress = getProgress();
  const canGoNext = canProceed() || currentQuestion?.type === 'choice';

  if (!currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const categoryInfo = getCategoryInfo(currentQuestion.category);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={handleSkipQuiz}
            style={styles.skipButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
            <Text style={styles.categoryName}>{categoryInfo.name}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: categoryInfo.color,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{currentQuestionIndex + 1} / {QUIZ_QUESTIONS.length}</Text>
        </View>
      </View>

      {/* Question Card */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.questionContainer,
            {
              transform: [{ translateX: slideAnimation }],
              opacity: fadeAnimation,
            },
          ]}
        >
          <Card variant="elevated" style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionIcon}>{currentQuestion.icon}</Text>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>

            {/* Options */}
            {currentQuestion.type === 'choice' && (
              <ChoiceOptions
                options={currentQuestion.options || []}
                selectedValue={selectedValue as string}
                onSelect={(value) => setSelectedValue(value)}
                categoryColor={categoryInfo.color}
              />
            )}

            {currentQuestion.type === 'multiple' && (
              <MultipleOptions
                options={currentQuestion.options || []}
                selectedValues={selectedValue as string[]}
                onSelect={(values) => setSelectedValue(values)}
                categoryColor={categoryInfo.color}
              />
            )}

            {currentQuestion.type === 'slider' && (
              <SliderOption
                question={currentQuestion}
                value={selectedValue as number}
                onChange={(value) => setSelectedValue(value)}
                categoryColor={categoryInfo.color}
              />
            )}

            {currentQuestion.type === 'text' && (
              <TextOption
                value={selectedValue as string}
                onChange={(value) => setSelectedValue(value)}
                placeholder="Share your thoughts..."
              />
            )}
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          {currentQuestionIndex > 0 && (
            <Button
              variant="ghost"
              onPress={handlePrevious}
              disabled={isAnimating}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={20} color={COLORS.textSecondary} />
            </Button>
          )}

          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipQuestionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="skip-next" size={20} color={COLORS.textSecondary} />
            <Text style={styles.skipQuestionText}>Skip</Text>
          </TouchableOpacity>

          <Button
            onPress={handleNext}
            disabled={!canGoNext || isAnimating}
            style={styles.nextButton}
            isLoading={isAnimating}
          >
            {currentQuestionIndex === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next'}
            <MaterialIcons
              name={currentQuestionIndex === QUIZ_QUESTIONS.length - 1 ? 'check' : 'arrow-forward'}
              size={20}
              color="#fff"
            />
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* Sub-components */

interface ChoiceOptionsProps {
  options: QuizOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  categoryColor: string;
}

function ChoiceOptions({ options, selectedValue, onSelect, categoryColor }: ChoiceOptionsProps) {
  return (
    <View style={styles.optionsContainer}>
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              isSelected && { ...styles.selectedOption, borderColor: categoryColor },
            ]}
            onPress={() => onSelect(option.value as string)}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              {option.icon && (
                <View style={[styles.optionIconContainer, { backgroundColor: categoryColor + '20' }]}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                </View>
              )}
              <Text style={[styles.optionLabel, isSelected && { color: categoryColor }]}>
                {option.label}
              </Text>
            </View>
            {isSelected && (
              <View style={[styles.checkmark, { backgroundColor: categoryColor }]}>
                <MaterialIcons name="check" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface MultipleOptionsProps {
  options: QuizOption[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  categoryColor: string;
}

function MultipleOptions({ options, selectedValues, onSelect, categoryColor }: MultipleOptionsProps) {
  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelect(selectedValues.filter((v) => v !== value));
    } else {
      onSelect([...selectedValues, value]);
    }
  };

  return (
    <View style={styles.optionsContainer}>
      <Text style={styles.multipleHint}>Select all that apply</Text>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value as string);
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              isSelected && { ...styles.selectedOption, borderColor: categoryColor },
            ]}
            onPress={() => toggleOption(option.value as string)}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              {option.icon && (
                <View style={[styles.optionIconContainer, { backgroundColor: categoryColor + '20' }]}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                </View>
              )}
              <Text style={[styles.optionLabel, isSelected && { color: categoryColor }]}>
                {option.label}
              </Text>
            </View>
            {isSelected && (
              <View style={[styles.checkmark, { backgroundColor: categoryColor }]}>
                <MaterialIcons name="check" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface SliderOptionProps {
  question: QuizQuestion;
  value: number;
  onChange: (value: number) => void;
  categoryColor: string;
}

function SliderOption({ question, value, onChange, categoryColor }: SliderOptionProps) {
  const min = question.min || 1;
  const max = question.max || 5;
  const step = question.step || 1;
  const options = question.options || [];

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderLabels}>
        {options.map((option, index) => {
          const optionValue = (option.value as number) || index + 1;
          const isSelected = value === optionValue;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sliderOption,
                isSelected && { ...styles.selectedSliderOption, backgroundColor: categoryColor },
              ]}
              onPress={() => onChange(optionValue)}
              activeOpacity={0.8}
            >
              <Text style={[styles.sliderOptionLabel, isSelected && { color: '#fff' }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface TextOptionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function TextOption({ value, onChange, placeholder }: TextOptionProps) {
  return (
    <View style={styles.textInputContainer}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={4}
        maxLength={500}
        textAlignVertical="top"
      />
      <Text style={styles.characterCount}>{value?.length || 0} / 500</Text>
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
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skipButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionContainer: {
    minHeight: 400,
  },
  questionCard: {
    padding: 24,
  },
  questionHeader: {
    marginBottom: 24,
  },
  questionIcon: {
    fontSize: 48,
    marginBottom: 16,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  multipleHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: COLORS.primaryLight + '40',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionLabel: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderContainer: {
    padding: 8,
  },
  sliderLabels: {
    gap: 8,
  },
  sliderOption: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedSliderOption: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  textInputContainer: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    backgroundColor: COLORS.background,
  },
  characterCount: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 48,
    height: 48,
  },
  skipQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipQuestionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default BlueprintQuiz;
