import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useTokenStore } from '@/stores/tokenStore';
import { router } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { GiftSparksDialog } from '@/components/GiftSparksDialog';
import { theme } from '@/lib/theme';
import { COLORS } from '@/lib/theme';

const PURCHASE_OPTIONS = [
  { id: 'starter', name: 'Starter Pack', tokens: 50, price: 0.99, description: 'Perfect for beginners' },
  { id: 'regular', name: 'Regular Pack', tokens: 150, price: 2.99, description: 'Most popular' },
  { id: 'premium', name: 'Premium Pack', tokens: 500, price: 7.99, description: 'Best value' },
  { id: 'ultimate', name: 'Ultimate Pack', tokens: 1500, price: 19.99, description: 'For serious writers' },
];

interface Transaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
}

export default function WalletScreen() {
  const { profile } = useAuthStore();
  const { balance, tokens, setBalance, deductTokens } = useTokenStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [giftDialogVisible, setGiftDialogVisible] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    // In a real app, this would load from Supabase
    setTransactions([
      { id: '1', amount: 100, description: 'Welcome bonus', created_at: new Date().toISOString() },
    ]);
  };

  const refreshData = async () => {
    setIsLoading(true);
    await loadTransactions();
    setIsLoading(false);
  };

  const handlePurchase = async (optionId: string) => {
    const option = PURCHASE_OPTIONS.find(o => o.id === optionId);
    if (!option) return;

    Alert.alert(
      'Confirm Purchase',
      `Are you sure you want to purchase ${option.name} (${option.tokens} tokens) for $${option.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            Alert.alert('Coming Soon', 'In-app purchases will be available soon!');
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isPositive = item.amount > 0;
    const formattedAmount = isPositive ? `+${item.amount}` : `${item.amount}`;

    return (
      <View style={styles.transaction}>
        <View style={styles.transactionInfo}>
          <View style={[styles.transactionIcon, { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={styles.icon}>{isPositive ? '💰' : '💸'}</Text>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            <Text style={styles.transactionDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color: isPositive ? '#4CAF50' : '#F44336' }]}>
          {formattedAmount}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Header */}
        <View style={styles.balanceHeader}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceAmount}>{tokens || balance || 0} Tokens</Text>
            <TouchableOpacity style={styles.earnButton} onPress={() => router.back()}>
              <Text style={styles.earnButtonText}>How to Earn</Text>
              <Feather name="chevron-right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Purchase Options */}
        <View style={styles.purchaseSection}>
          <Text style={styles.sectionTitle}>Get More Tokens</Text>
          <Text style={styles.sectionSubtitle}>Unlock premium features and boost your creativity</Text>

          {/* Gift Sparks Button */}
          <TouchableOpacity
            style={styles.giftButton}
            onPress={() => setGiftDialogVisible(true)}
          >
            <View style={styles.giftButtonContent}>
              <MaterialIcons name="card-giftcard" size={28} color="#E91E63" />
              <View style={styles.giftTextContainer}>
                <Text style={styles.giftTitle}>Gift Sparks</Text>
                <Text style={styles.giftDescription}>Send tokens to someone special</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#BDBDBD" />
            </View>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.purchaseList}
          >
            {PURCHASE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.purchaseCard}
                onPress={() => handlePurchase(item.id)}
              >
                <View style={styles.purchaseHeader}>
                  <View>
                    <Text style={styles.packageName}>{item.name}</Text>
                    <Text style={styles.packageTokens}>{item.tokens} Tokens</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.packagePrice}>${item.price}</Text>
                  </View>
                </View>
                <View style={styles.purchaseFooter}>
                  <Text style={styles.packageDescription}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <Text style={styles.transactionCount}>{transactions.length} transactions</Text>
          </View>

          {transactions.length > 0 ? (
            <View style={styles.transactionList}>
              {transactions.map((item) => (
                <View key={item.id}>{renderTransaction({ item })}</View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTransactions}>
              <Feather name="inbox" size={48} color="#BDBDBD" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to Earn Tokens</Text>
            <Text style={styles.infoText}>
              Complete daily streaks{"\n"}
              Unlock achievements{"\n"}
              Collaborate with other writers{"\n"}
              Participate in special events
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Gift Sparks Dialog */}
      <GiftSparksDialog
        visible={giftDialogVisible}
        onClose={() => setGiftDialogVisible(false)}
        userId={profile?.id || ''}
        onGiftPurchased={(code, amount) => {
          Alert.alert('Gift Created!', `Your gift code is: ${code}\n\nShare it with someone special!`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  balanceHeader: {
    backgroundColor: '#E91E63',
    padding: 30,
    paddingTop: 50,
    paddingBottom: 40,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
  },
  earnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  earnButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  purchaseSection: {
    padding: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212121',
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#757575',
  },
  giftButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  giftButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  giftTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  giftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  giftDescription: {
    fontSize: 14,
    color: '#757575',
  },
  purchaseList: {
    paddingHorizontal: 5,
  },
  purchaseCard: {
    width: 260,
    marginRight: 15,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  packageTokens: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#E91E63',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  purchaseFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
  },
  packageDescription: {
    fontSize: 12,
    color: '#757575',
  },
  transactionSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  transactionCount: {
    fontSize: 14,
    color: '#757575',
  },
  transactionList: {
    paddingBottom: 20,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#212121',
  },
  transactionDate: {
    fontSize: 14,
    color: '#757575',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'right',
  },
  emptyTransactions: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    color: '#212121',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#757575',
  },
  infoSection: {
    paddingHorizontal: 20,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#212121',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#757575',
  },
});
