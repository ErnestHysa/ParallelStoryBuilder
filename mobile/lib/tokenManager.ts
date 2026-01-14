import { supabase } from './supabase';

export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earned' | 'spent';
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface PurchaseOption {
  id: string;
  name: string;
  tokens: number;
  price: number;
  currency: string;
}

export const PURCHASE_OPTIONS: PurchaseOption[] = [
  { id: 'starter', name: 'Starter', tokens: 100, price: 0.99, currency: 'USD' },
  { id: 'monthly', name: 'Monthly', tokens: 500, price: 3.99, currency: 'USD' },
  { id: 'devoted', name: 'Devoted', tokens: 1200, price: 7.99, currency: 'USD' },
  { id: 'eternal', name: 'Eternal', tokens: 3000, price: 14.99, currency: 'USD' },
  { id: 'annual', name: 'Annual', tokens: 15000, price: 49.99, currency: 'USD' },
];

export class TokenManager {
  static async getTokenBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record exists, create one with default balance
        const { data: newRecord } = await supabase
          .from('user_tokens')
          .insert([{ user_id: userId, balance: 0 }])
          .select()
          .single();

        return newRecord?.balance || 0;
      }

      if (error) throw error;

      return data?.balance || 0;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }

  static async addTokens(
    userId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get current balance
      const currentBalance = await this.getTokenBalance(userId);

      // Update balance
      const { error } = await supabase
        .from('user_tokens')
        .update({ balance: currentBalance + amount })
        .eq('user_id', userId);

      if (error) throw error;

      // Record transaction
      await supabase
        .from('token_transactions')
        .insert([{
          user_id: userId,
          amount,
          type: 'earned',
          description,
          metadata,
        }]);

      return true;
    } catch (error) {
      console.error('Error adding tokens:', error);
      return false;
    }
  }

  static async spendTokens(
    userId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get current balance
      const currentBalance = await this.getTokenBalance(userId);

      if (currentBalance < amount) {
        throw new Error('Insufficient token balance');
      }

      // Update balance
      const { error } = await supabase
        .from('user_tokens')
        .update({ balance: currentBalance - amount })
        .eq('user_id', userId);

      if (error) throw error;

      // Record transaction
      await supabase
        .from('token_transactions')
        .insert([{
          user_id: userId,
          amount: -amount,
          type: 'spent',
          description,
          metadata,
        }]);

      return true;
    } catch (error) {
      console.error('Error spending tokens:', error);
      return false;
    }
  }

  static async getTransactionHistory(userId: string, limit: number = 50): Promise<TokenTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  static async recordDailyActivity(userId: string): Promise<void> {
    try {
      // Check if activity already recorded today
      const today = new Date().toISOString().split('T')[0];

      const { data: existingActivity } = await supabase
        .from('user_daily_activity')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (!existingActivity) {
        // Record new activity
        await supabase
          .from('user_daily_activity')
          .insert([{ user_id: userId, date: today, activities: 1 }]);
      } else {
        // Increment activity count
        await supabase
          .from('user_daily_activity')
          .update({ activities: supabase.raw('activities + 1') })
          .eq('id', existingActivity.id);
      }
    } catch (error) {
      console.error('Error recording daily activity:', error);
    }
  }

  static async getStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_streak', { user_id: userId });

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('Error fetching streak:', error);
      return 0;
    }
  }
}