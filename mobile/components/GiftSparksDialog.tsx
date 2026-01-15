/**
 * Gift Sparks Dialog
 *
 * Modal dialog for purchasing and sending sparks as gifts.
 * Users can buy spark packs as gift codes or send directly to another user.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import {
  SPARK_PACKS,
  getTotalSparks,
  purchaseGiftCode,
  type SparkPackSize,
} from '@/lib/giftSparks';
import { COLORS } from '@/lib/theme';

// ============================================================================
// Types
// ============================================================================

export interface GiftSparksDialogProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onGiftPurchased?: (code: string, amount: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export function GiftSparksDialog({
  visible,
  onClose,
  userId,
  onGiftPurchased,
}: GiftSparksDialogProps) {
  const [mode, setMode] = useState<'code' | 'direct'>('code');
  const [selectedPack, setSelectedPack] = useState<SparkPackSize | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!visible) {
      setMode('code');
      setSelectedPack(null);
      setRecipientEmail('');
      setRecipientUserId('');
      setMessage('');
    }
  }, [visible]);

  const handlePurchaseGiftCode = async () => {
    if (!selectedPack) {
      Alert.alert('Select a Pack', 'Please select a spark pack to purchase.');
      return;
    }

    setGenerating(true);
    try {
      const result = await purchaseGiftCode(
        userId,
        selectedPack,
        recipientEmail || undefined,
        message || undefined
      );

      if (result) {
        onGiftPurchased?.(result.code, result.amount);
        Alert.alert(
          'Gift Code Created!',
          `Your gift code is: ${result.code}\n\n${result.amount} sparks can be redeemed using this code.`,
          [
            { text: 'Copy', onPress: () => {/* TODO: Copy to clipboard */ } },
            { text: 'Done', onPress: onClose },
          ]
        );
      } else {
        Alert.alert('Purchase Failed', 'Could not create gift code. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendDirectGift = async () => {
    if (!selectedPack) {
      Alert.alert('Select a Pack', 'Please select a spark pack to send.');
      return;
    }

    if (!recipientUserId.trim()) {
      Alert.alert('Enter Recipient', 'Please enter the recipient user ID.');
      return;
    }

    // TODO: Implement direct gift sending
    Alert.alert('Coming Soon', 'Direct gifting will be available soon!');
  };

  const packEntries: Array<[SparkPackSize, typeof SPARK_PACKS[SparkPackSize]]> = [
    [100, SPARK_PACKS[100]],
    [500, SPARK_PACKS[500]],
    [1200, SPARK_PACKS[1200]],
    [3000, SPARK_PACKS[3000]],
    [15000, SPARK_PACKS[15000]],
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Gift Sparks</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'code' && styles.modeButtonActive]}
              onPress={() => setMode('code')}
            >
              <MaterialIcons
                name="card-giftcard"
                size={20}
                color={mode === 'code' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.modeButtonText, mode === 'code' && styles.modeButtonTextActive]}>
                Gift Code
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'direct' && styles.modeButtonActive]}
              onPress={() => setMode('direct')}
            >
              <MaterialIcons
                name="send"
                size={20}
                color={mode === 'direct' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.modeButtonText, mode === 'direct' && styles.modeButtonTextActive]}>
                Send Direct
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={styles.description}>
              {mode === 'code'
                ? 'Create a gift code that can be redeemed by anyone. Perfect for sharing via message or email.'
                : 'Send sparks directly to another user. They will receive a notification and can claim the gift.'}
            </Text>

            {/* Spark Packs */}
            <Text style={styles.sectionTitle}>Select Spark Pack</Text>
            <View style={styles.packsGrid}>
              {packEntries.map(([size, pack]) => {
                const total = getTotalSparks(size);
                const isSelected = selectedPack === size;
                const hasBonus = pack.bonus > 0;

                return (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.packCard,
                      isSelected && styles.packCardSelected,
                    ]}
                    onPress={() => setSelectedPack(size)}
                  >
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
                      </View>
                    )}
                    <Text style={styles.packName}>{pack.name}</Text>
                    <Text style={styles.packAmount}>{total} Sparks</Text>
                    {hasBonus && (
                      <Text style={styles.packBonus}>+{pack.bonus} bonus</Text>
                    )}
                    <Text style={styles.packPrice}>${pack.price}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Recipient Input */}
            {mode === 'code' ? (
              <>
                <Text style={styles.sectionTitle}>Recipient Email (Optional)</Text>
                <Input
                  placeholder="friend@example.com"
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  style={styles.input}
                />
                <Text style={styles.hint}>
                  Leave empty to create a generic code that anyone can use.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Recipient User ID</Text>
                <Input
                  placeholder="Enter user ID"
                  value={recipientUserId}
                  onChangeText={setRecipientUserId}
                  autoCapitalize="none"
                  style={styles.input}
                />
              </>
            )}

            {/* Message */}
            <Text style={styles.sectionTitle}>Personal Message (Optional)</Text>
            <View style={styles.messageContainer}>
              <Input
                placeholder="Add a personal note..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                style={styles.messageInput}
                containerStyle={styles.messageInputContainer}
              />
            </View>

            {/* Summary */}
            {selectedPack && (
              <Card variant="outlined" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Sparks:</Text>
                  <Text style={styles.summaryValue}>{getTotalSparks(selectedPack)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Price:</Text>
                  <Text style={styles.summaryValue}>${SPARK_PACKS[selectedPack].price}</Text>
                </View>
              </Card>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              onPress={mode === 'code' ? handlePurchaseGiftCode : handleSendDirectGift}
              isLoading={generating}
              disabled={!selectedPack || generating}
              style={styles.purchaseButton}
            >
              {generating ? 'Creating...' : mode === 'code' ? 'Create Gift Code' : 'Send Gift'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    margin: 20,
    marginBottom: 0,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeButtonTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  packCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  packCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  packName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  packAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  packBonus: {
    fontSize: 12,
    color: COLORS.success,
    marginBottom: 4,
  },
  packPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageInputContainer: {
    minHeight: 80,
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  purchaseButton: {
    minHeight: 52,
  },
});

export default GiftSparksDialog;
