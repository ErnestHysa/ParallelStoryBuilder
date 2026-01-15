/**
 * Gift Sparks Manager
 *
 * Allows users to purchase sparks as gifts for other users.
 * Includes:
 * - Creating gift codes
 * - Redeeming gift codes
 * - Sending gifts directly to users
 * - Gift history tracking
 */

import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// ============================================================================
// Constants
// ============================================================================

const GIFT_CODE_LENGTH = 12;
const GIFT_EXPIRY_DAYS = 30;

// ============================================================================
// Types
// ============================================================================

export type SparkPackSize = 100 | 500 | 1200 | 3000 | 15000;

export interface SparkPack {
  amount: SparkPackSize;
  price: number;
  name: string;
  bonus: number;
}

export interface GiftCode {
  id: string;
  code: string;
  amount: number;
  purchaser_id: string;
  recipient_email?: string;
  message?: string;
  redeemed: boolean;
  redeemed_by?: string;
  redeemed_at?: string;
  expires_at: string;
  created_at: string;
}

export interface Gift {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  message?: string;
  created_at: string;
  claimed_at?: string;
}

// ============================================================================
// Spark Packs Configuration
// ============================================================================

export const SPARK_PACKS: Record<SparkPackSize, SparkPack> = {
  100: { amount: 100, price: 0.99, name: 'Starter', bonus: 0 },
  500: { amount: 500, price: 3.99, name: 'Monthly', bonus: 100 }, // 600 total
  1200: { amount: 1200, price: 7.99, name: 'Devoted', bonus: 400 }, // 1600 total
  3000: { amount: 3000, price: 14.99, name: 'Eternal', bonus: 1500 }, // 4500 total
  15000: { amount: 15000, price: 49.99, name: 'Annual', bonus: 10000 }, // 25000 total
};

export function getTotalSparks(packSize: SparkPackSize): number {
  const pack = SPARK_PACKS[packSize];
  return pack.amount + pack.bonus;
}

// ============================================================================
// Gift Code Generation
// ============================================================================

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for clarity
  let code = '';
  for (let i = 0; i < GIFT_CODE_LENGTH; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================================
// Gift Manager Class
// ============================================================================

class GiftSparksManager {
  /**
   * Purchase sparks as a gift code
   */
  async purchaseGiftCode(
    userId: string,
    packSize: SparkPackSize,
    recipientEmail?: string,
    message?: string
  ): Promise<GiftCode | null> {
    const pack = SPARK_PACKS[packSize];
    const totalAmount = pack.amount + pack.bonus;

    try {
      // Create gift code record
      const code = generateGiftCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + GIFT_EXPIRY_DAYS);

      const { data, error } = await supabase
        .from('gift_codes')
        .insert({
          code,
          amount: totalAmount,
          purchaser_id: userId,
          recipient_email: recipientEmail,
          message,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Track the purchase
      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_name: 'gift_code_purchased',
        event_properties: {
          amount: totalAmount,
          pack_size: packSize,
          has_recipient: !!recipientEmail,
        },
      });

      return data as GiftCode;
    } catch (error) {
      console.error('[GiftSparks] Failed to purchase gift code:', error);
      return null;
    }
  }

  /**
   * Redeem a gift code
   */
  async redeemGiftCode(userId: string, code: string): Promise<{ success: boolean; amount?: number; error?: string }> {
    try {
      // Find the gift code
      const { data: giftCode, error: findError } = await supabase
        .from('gift_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (findError || !giftCode) {
        return { success: false, error: 'Invalid gift code' };
      }

      // Check if already redeemed
      if (giftCode.redeemed) {
        return { success: false, error: 'This gift code has already been redeemed' };
      }

      // Check if expired
      if (new Date(giftCode.expires_at) < new Date()) {
        return { success: false, error: 'This gift code has expired' };
      }

      // Check if user is trying to redeem their own gift
      if (giftCode.purchaser_id === userId) {
        return { success: false, error: 'You cannot redeem your own gift code' };
      }

      // Mark as redeemed and add tokens
      const { error: redeemError } = await supabase
        .from('gift_codes')
        .update({
          redeemed: true,
          redeemed_by: userId,
          redeemed_at: new Date().toISOString(),
        })
        .eq('id', giftCode.id);

      if (redeemError) throw redeemError;

      // Add tokens to user's balance
      await supabase.rpc('add_tokens', {
        user_id: userId,
        amount: giftCode.amount,
        transaction_type: 'gift',
        feature_type: 'gift_redemption',
      });

      // Track the redemption
      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_name: 'gift_code_redeemed',
        event_properties: {
          amount: giftCode.amount,
          gift_code_id: giftCode.id,
        },
      });

      return { success: true, amount: giftCode.amount };
    } catch (error) {
      console.error('[GiftSparks] Failed to redeem gift code:', error);
      return { success: false, error: 'Failed to redeem gift code. Please try again.' };
    }
  }

  /**
   * Send sparks directly to a user
   */
  async sendGiftDirectly(
    fromUserId: string,
    toUserId: string,
    amount: number,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check sender has enough balance
      const { data: senderBalance } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', fromUserId)
        .single();

      if (!senderBalance || senderBalance.balance < amount) {
        return { success: false, error: 'Insufficient spark balance' };
      }

      // Deduct from sender
      await supabase.rpc('add_tokens', {
        user_id: fromUserId,
        amount: -amount,
        transaction_type: 'gift_sent',
        feature_type: 'direct_gift',
      });

      // Add to recipient
      await supabase.rpc('add_tokens', {
        user_id: toUserId,
        amount: amount,
        transaction_type: 'gift',
        feature_type: 'direct_gift',
      });

      // Create gift record
      await supabase.from('gifts').insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount,
        message,
      });

      // Track analytics
      await supabase.from('analytics_events').insert({
        user_id: fromUserId,
        event_name: 'gift_sent',
        event_properties: { amount, to_user_id: toUserId },
      });

      return { success: true };
    } catch (error) {
      console.error('[GiftSparks] Failed to send gift:', error);
      return { success: false, error: 'Failed to send gift. Please try again.' };
    }
  }

  /**
   * Get user's gift history
   */
  async getGiftHistory(userId: string): Promise<{
    sent: Gift[];
    received: Gift[];
    codes: GiftCode[];
  }> {
    try {
      const [sentResult, receivedResult, codesResult] = await Promise.all([
        supabase
          .from('gifts')
          .select('*, profiles!gifts_to_user_id_fkey(display_name)')
          .eq('from_user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('gifts')
          .select('*, profiles!gifts_from_user_id_fkey(display_name)')
          .eq('to_user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('gift_codes')
          .select('*')
          .eq('purchaser_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      return {
        sent: (sentResult.data || []) as Gift[],
        received: (receivedResult.data || []) as Gift[],
        codes: (codesResult.data || []) as GiftCode[],
      };
    } catch (error) {
      console.error('[GiftSparks] Failed to get gift history:', error);
      return { sent: [], received: [], codes: [] };
    }
  }

  /**
   * Get unredeemed gift codes for a user
   */
  async getUnredeemedCodes(userId: string): Promise<GiftCode[]> {
    try {
      const { data, error } = await supabase
        .from('gift_codes')
        .select('*')
        .eq('purchaser_id', userId)
        .eq('redeemed', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as GiftCode[];
    } catch (error) {
      console.error('[GiftSparks] Failed to get unredeemed codes:', error);
      return [];
    }
  }

  /**
   * Claim a pending gift
   */
  async claimGift(userId: string, giftId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('gifts')
        .update({ claimed_at: new Date().toISOString() })
        .eq('id', giftId)
        .eq('to_user_id', userId)
        .is('claimed_at', null);

      if (error) throw error;

      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_name: 'gift_claimed',
        event_properties: { gift_id: giftId },
      });

      return { success: true };
    } catch (error) {
      console.error('[GiftSparks] Failed to claim gift:', error);
      return { success: false, error: 'Failed to claim gift' };
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const giftSparksManager = new GiftSparksManager();

export default giftSparksManager;

// ============================================================================
// Convenience Functions
// ============================================================================

export const purchaseGiftCode = (
  userId: string,
  packSize: SparkPackSize,
  recipientEmail?: string,
  message?: string
) => giftSparksManager.purchaseGiftCode(userId, packSize, recipientEmail, message);

export const redeemGiftCode = (userId: string, code: string) =>
  giftSparksManager.redeemGiftCode(userId, code);

export const sendGiftDirectly = (
  fromUserId: string,
  toUserId: string,
  amount: number,
  message?: string
) => giftSparksManager.sendGiftDirectly(fromUserId, toUserId, amount, message);

export const getGiftHistory = (userId: string) => giftSparksManager.getGiftHistory(userId);

export const getUnredeemedCodes = (userId: string) => giftSparksManager.getUnredeemedCodes(userId);

export const claimGift = (userId: string, giftId: string) => giftSparksManager.claimGift(userId, giftId);
