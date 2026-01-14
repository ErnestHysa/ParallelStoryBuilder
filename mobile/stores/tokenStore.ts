import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { TokenManager, PURCHASE_OPTIONS, TokenTransaction } from '../lib/tokenManager';

interface TokenState {
  balance: number;
  tokens: number;
  transactions: TokenTransaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  addTokens: (amount: number, description: string, metadata?: any) => Promise<boolean>;
  spendTokens: (amount: number, description: string, metadata?: any) => Promise<boolean>;
  purchaseTokens: (optionId: string) => Promise<boolean>;
  deductTokens: (amount: number) => void;

  // Reset
  clearError: () => void;
  setBalance: (balance: number) => void;
  reset: () => void;
}

interface User {
  id: string | null;
}

// Get current user
const getCurrentUser = (): string | null => {
  const { data: { user } } = supabase.auth.getUser();
  return user?.id || null;
};

export const useTokenStore = create<TokenState>((set, get) => ({
  balance: 100,
  tokens: 100,
  transactions: [],
  isLoading: false,
  error: null,

  fetchBalance: async () => {
    try {
      set({ isLoading: true, error: null });
      const userId = getCurrentUser();
      if (!userId) {
        set({ error: 'No user logged in', isLoading: false });
        return;
      }

      const balance = await TokenManager.getTokenBalance(userId);
      set({ balance, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
        isLoading: false
      });
    }
  },

  fetchTransactions: async () => {
    try {
      set({ isLoading: true, error: null });
      const userId = getCurrentUser();
      if (!userId) {
        set({ error: 'No user logged in', isLoading: false });
        return;
      }

      const transactions = await TokenManager.getTransactionHistory(userId);
      set({ transactions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        isLoading: false
      });
    }
  },

  addTokens: async (amount: number, description: string, metadata?: any) => {
    try {
      const userId = getCurrentUser();
      if (!userId) return false;

      const success = await TokenManager.addTokens(userId, amount, description, metadata);
      if (success) {
        // Update local state
        set(state => ({
          balance: state.balance + amount,
          transactions: [
            {
              id: Date.now().toString(),
              user_id: userId,
              amount,
              type: 'earned',
              description,
              created_at: new Date().toISOString(),
              metadata,
            },
            ...state.transactions,
          ],
        }));
      }
      return success;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add tokens' });
      return false;
    }
  },

  spendTokens: async (amount: number, description: string, metadata?: any) => {
    try {
      const userId = getCurrentUser();
      if (!userId) return false;

      const success = await TokenManager.spendTokens(userId, amount, description, metadata);
      if (success) {
        // Update local state
        set(state => ({
          balance: state.balance - amount,
          transactions: [
            {
              id: Date.now().toString(),
              user_id: userId,
              amount: -amount,
              type: 'spent',
              description,
              created_at: new Date().toISOString(),
              metadata,
            },
            ...state.transactions,
          ],
        }));
      }
      return success;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to spend tokens' });
      return false;
    }
  },

  purchaseTokens: async (optionId: string) => {
    try {
      set({ isLoading: true, error: null });

      const option = PURCHASE_OPTIONS.find(opt => opt.id === optionId);
      if (!option) {
        set({ error: 'Invalid purchase option', isLoading: false });
        return false;
      }

      // TODO: Implement IAP integration
      // For now, simulate purchase
      const mockSuccess = await new Promise<boolean>(resolve => {
        setTimeout(() => {
          resolve(Math.random() > 0.1); // 90% success rate
        }, 1000);
      });

      if (mockSuccess) {
        const success = await TokenManager.addTokens(
          getCurrentUser()!,
          option.tokens,
          `Purchased ${option.name} package`,
          { purchase_id: optionId, price: option.price }
        );

        if (success) {
          set(state => ({
            balance: state.balance + option.tokens,
            isLoading: false,
          }));
          return true;
        }
      }

      set({ error: 'Purchase failed', isLoading: false });
      return false;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Purchase failed',
        isLoading: false
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  setBalance: (balance: number) => set({ balance, tokens: balance }),

  reset: () => set({ balance: 0, tokens: 0, transactions: [], error: null }),

  deductTokens: (amount: number) => {
    const currentBalance = get().balance;
    set({ balance: Math.max(0, currentBalance - amount), tokens: Math.max(0, currentBalance - amount) });
  },
}));