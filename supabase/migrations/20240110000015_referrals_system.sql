-- Referrals System Migration
-- Adds support for user referral program with spark rewards

-- Add referral columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_count INT DEFAULT 0;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount INT DEFAULT 50,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_user_id)
);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Gift codes table
CREATE TABLE IF NOT EXISTS gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  amount INT NOT NULL,
  purchaser_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT,
  message TEXT,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for gift codes
CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_gift_codes_purchaser ON gift_codes(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_gift_codes_redeemed ON gift_codes(redeemed);
CREATE INDEX IF NOT EXISTS idx_gift_codes_expires ON gift_codes(expires_at);

-- Gifts table (for direct gifting)
CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  UNIQUE(from_user_id, to_user_id, created_at)
);

-- Create indexes for gifts
CREATE INDEX IF NOT EXISTS idx_gifts_from ON gifts(from_user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_to ON gifts(to_user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_claimed ON gifts(claimed_at) WHERE claimed_at IS NULL;

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || SUBSTRING(chars, FLOOR(1 + RANDOM() * LENGTH(chars))::INT, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to award referral bonus
CREATE OR REPLACE FUNCTION award_referral_bonus(
  referrer_id UUID,
  bonus_amount INT DEFAULT 50
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Add bonus to referrer's balance
  INSERT INTO user_tokens (user_id, balance, purchased_total, last_earned_at)
  VALUES (referrer_id, bonus_amount, 0, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET
    balance = user_tokens.balance + bonus_amount,
    last_earned_at = NOW();

  -- Record the transaction
  INSERT INTO token_transactions (user_id, amount, type, feature_type)
  VALUES (referrer_id, bonus_amount, 'bonus', 'referral');

  -- Increment referral count
  UPDATE profiles
  SET referral_count = COALESCE(referral_count, 0) + 1
  WHERE id = referrer_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to add tokens (used by gift redemption)
CREATE OR REPLACE FUNCTION add_tokens(
  user_id UUID,
  amount INT,
  transaction_type TEXT DEFAULT 'purchase',
  feature_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Handle negative amounts (deduction)
  IF amount < 0 THEN
    -- Check sufficient balance
    IF NOT EXISTS (
      SELECT 1 FROM user_tokens
      WHERE user_id = add_tokens.user_id AND balance >= ABS(amount)
    ) THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;

    UPDATE user_tokens
    SET
      balance = balance + amount,
      last_earned_at = NOW()
    WHERE user_id = add_tokens.user_id;
  ELSE
    -- Add tokens
    INSERT INTO user_tokens (user_id, balance, purchased_total, last_earned_at)
    VALUES (user_id, amount, CASE WHEN transaction_type = 'purchase' THEN amount ELSE 0 END, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET
      balance = user_tokens.balance + amount,
      purchased_total = user_tokens.purchased_total +
        CASE WHEN transaction_type = 'purchase' THEN amount ELSE 0 END,
      last_earned_at = NOW();
  END IF;

  -- Record transaction
  INSERT INTO token_transactions (user_id, amount, type, feature_type)
  VALUES (user_id, amount, transaction_type, feature_type);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate referral code on signup
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();

    -- Retry if code already exists (unlikely but possible)
    WHILE EXISTS (SELECT 1 FROM profiles WHERE referral_code = NEW.referral_code AND id != NEW.id) LOOP
      NEW.referral_code := generate_referral_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS ensure_referral_code_trigger ON profiles;
CREATE TRIGGER ensure_referral_code_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_referral_code();

-- RLS Policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Referrals RLS
CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can insert their own referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_user_id);

-- Gift codes RLS
CREATE POLICY "Users can view their purchased gift codes"
  ON gift_codes FOR SELECT
  USING (auth.uid() = purchaser_id);

CREATE POLICY "Users can view redeemed gift codes"
  ON gift_codes FOR SELECT
  USING (auth.uid() = redeemed_by);

CREATE POLICY "Users can create gift codes"
  ON gift_codes FOR INSERT
  WITH CHECK (auth.uid() = purchaser_id);

-- Gifts RLS
CREATE POLICY "Users can view gifts they sent or received"
  ON gifts FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send gifts"
  ON gifts FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can claim gifts sent to them"
  ON gifts FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Grant access
GRANT SELECT, INSERT ON referrals TO authenticated;
GRANT SELECT, INSERT ON gift_codes TO authenticated;
GRANT SELECT, INSERT ON gifts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION award_referral_bonus TO authenticated;
GRANT EXECUTE ON FUNCTION add_tokens TO authenticated;
