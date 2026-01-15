/**
 * Invite Partner Screen
 *
 * Allows users to invite their partner to join their story
 * or create a new story together.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';

const INVITE_MESSAGE = `Join me on Parallel Story Builder!\n\nWe can write stories together and deepen our connection through creative collaboration.\n\nDownload the app and enter the code below to join my story.`;

export default function InvitePartnerScreen() {
  const { user } = useAuthStore();
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load pairing code on mount
  React.useEffect(() => {
    loadOrCreatePairingCode();
  }, []);

  const loadOrCreatePairingCode = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get existing stories with pairing codes
      const { data: stories } = await (supabase
        .from('stories')
        .select('pairing_code')
        .eq('created_by', user.id)
        .eq('status', 'active')
        .limit(1) as any);

      if (stories && stories.length > 0) {
        setPairingCode(stories[0].pairing_code);
      } else {
        // Generate a new pairing code
        await generateNewCode();
      }
    } catch (error) {
      console.error('Failed to load pairing code:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewCode = async () => {
    setGenerating(true);
    try {
      // Generate a random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setPairingCode(code);
      setCopied(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate pairing code');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareCode = async () => {
    if (!pairingCode) return;

    try {
      await Share.share({
        message: `${INVITE_MESSAGE}\n\nPairing Code: ${pairingCode}`,
        url: `https://parallelstorybuilder.app/join?code=${pairingCode}`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    // Use Share as a simple copy mechanism
    Share.share({
      message: `My pairing code: ${pairingCode}`,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateStory = () => {
    router.push('/create-story');
  };

  const handleJoinStory = () => {
    router.push('/join-story');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite Your Partner</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="favorite" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.heading}>Share Your Story</Text>
        <Text style={styles.description}>
          Your partner can join your story using this pairing code. Share it via your favorite
          messaging app.
        </Text>

        {/* Pairing Code Card */}
        <Card variant="elevated" style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR PAIRING CODE</Text>
          <TouchableOpacity style={styles.codeContainer} onPress={handleCopyCode}>
            <Text style={styles.codeText}>{pairingCode || 'Generate Code'}</Text>
            <MaterialIcons
              name={copied ? "check-circle" : "content-copy"}
              size={24}
              color={copied ? COLORS.success : COLORS.primary}
            />
          </TouchableOpacity>
          <View style={styles.codeActions}>
            <TouchableOpacity
              style={styles.codeActionButton}
              onPress={handleCopyCode}
            >
              <MaterialIcons name="content-copy" size={18} color={COLORS.textSecondary} />
              <Text style={styles.codeActionText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.codeActionButton}
              onPress={handleShareCode}
            >
              <MaterialIcons name="share" size={18} color={COLORS.textSecondary} />
              <Text style={styles.codeActionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.codeActionButton}
              onPress={generateNewCode}
              disabled={generating}
            >
              <MaterialIcons
                name="refresh"
                size={18}
                color={COLORS.textSecondary}
              />
              <Text style={styles.codeActionText}>
                {generating ? 'Generating...' : 'New Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Instructions */}
        <Card variant="outlined" style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to invite:</Text>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Copy the pairing code above using the Copy button
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Share it with your partner via text, email, or any messaging app
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Your partner enters the code in the app to join your story
            </Text>
          </View>
        </Card>

        {/* Alternative Actions */}
        <View style={styles.actionsContainer}>
          <Button
            variant="secondary"
            onPress={handleCreateStory}
            style={styles.actionButton}
          >
            Create New Story
          </Button>
          <Button
            variant="ghost"
            onPress={handleJoinStory}
            style={styles.actionButton}
          >
            Join Their Story
          </Button>
        </View>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  codeCard: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 16,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    width: '100%',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 24,
  },
  codeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeActionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  instructionsCard: {
    width: '100%',
    padding: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.surface,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
