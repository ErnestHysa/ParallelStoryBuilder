-- Token system for managing user resources and monetization
-- Creates user_tokens, token_transactions tables and spend_tokens function

-- Create user_tokens table
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  available_tokens INTEGER NOT NULL DEFAULT 0,
  ai_tokens INTEGER NOT NULL DEFAULT 0,
  premium_tokens INTEGER NOT NULL DEFAULT 0,
  monthly_allowance INTEGER NOT NULL DEFAULT 0,
  last_monthly_reset DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('ai', 'premium')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  story_id UUID NULL REFERENCES public.stories(id) ON DELETE SET NULL,
  chapter_id UUID NULL REFERENCES public.chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NULL DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON public.token_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_token_transactions_story_id ON public.token_transactions(story_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON public.token_transactions(token_type);

-- Function to spend tokens
CREATE OR REPLACE FUNCTION public.spend_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_token_type TEXT,
  p_description TEXT,
  p_story_id UUID DEFAULT NULL,
  p_chapter_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, balance INTEGER, error TEXT) AS $$
DECLARE
  v_balance INTEGER;
  v_token_type TEXT;
  v_success BOOLEAN := FALSE;
  v_error TEXT := NULL;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    v_error := 'Amount must be positive';
    RETURN QUERY SELECT FALSE, 0, v_error;
    RETURN;
  END IF;

  IF p_token_type NOT IN ('ai', 'premium') THEN
    v_error := 'Invalid token type';
    RETURN QUERY SELECT FALSE, 0, v_error;
    RETURN;
  END IF;

  -- Check if user exists and has sufficient tokens
  IF p_token_type = 'ai' THEN
    SELECT available_tokens INTO v_balance
    FROM public.user_tokens
    WHERE user_id = p_user_id;
  ELSE
    SELECT premium_tokens INTO v_balance
    FROM public.user_tokens
    WHERE user_id = p_user_id;
  END IF;

  IF v_balance IS NULL THEN
    v_error := 'User not found or no token account';
    RETURN QUERY SELECT FALSE, 0, v_error;
    RETURN;
  END IF;

  IF v_balance < p_amount THEN
    v_error := 'Insufficient ' || p_token_type || ' tokens. Required: ' || p_amount || ', Available: ' || v_balance;
    RETURN QUERY SELECT FALSE, v_balance, v_error;
    RETURN;
  END IF;

  -- Begin transaction
  BEGIN
    -- Update user tokens
    IF p_token_type = 'ai' THEN
      UPDATE public.user_tokens
      SET available_tokens = available_tokens - p_amount,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE public.user_tokens
      SET premium_tokens = premium_tokens - p_amount,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;

    -- Record transaction
    INSERT INTO public.token_transactions (
      user_id,
      token_type,
      amount,
      balance_before,
      balance_after,
      description,
      story_id,
      chapter_id,
      metadata
    ) VALUES (
      p_user_id,
      p_token_type,
      p_amount,
      v_balance,
      v_balance - p_amount,
      p_description,
      p_story_id,
      p_chapter_id,
      COALESCE(p_metadata, '{}'::jsonb)
    );

    v_success := TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      v_error := SQLERRM;
      ROLLBACK;
  END;

  IF v_success THEN
    COMMIT;
    RETURN QUERY SELECT TRUE, v_balance - p_amount, NULL;
  ELSE
    RETURN QUERY SELECT FALSE, v_balance, v_error;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to grant signup tokens
CREATE OR REPLACE FUNCTION public.grant_signup_tokens(
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Create or update user token account
  INSERT INTO public.user_tokens (
    user_id,
    total_tokens,
    available_tokens,
    ai_tokens,
    premium_tokens,
    monthly_allowance
  ) VALUES (
    p_user_id,
    1000,
    1000,
    800,  -- 800 AI tokens
    200,  -- 200 premium tokens
    100   -- 100 monthly allowance
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_tokens = total_tokens + 1000,
    available_tokens = available_tokens + 1000,
    ai_tokens = ai_tokens + 800,
    premium_tokens = premium_tokens + 200,
    monthly_allowance = monthly_allowance + 100,
    updated_at = NOW();

  -- Record signup token grant
  INSERT INTO public.token_transactions (
    user_id,
    token_type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    p_user_id,
    'ai',
    800,
    0,
    800,
    'Signup bonus - AI tokens'
  ),
  (
    p_user_id,
    'premium',
    200,
    0,
    200,
    'Signup bonus - Premium tokens'
  );

  -- Record monthly allowance grant
  INSERT INTO public.token_transactions (
    user_id,
    token_type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    p_user_id,
    'ai',
    100,
    800,
    900,
    'Monthly allowance - AI tokens'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly allowance
CREATE OR REPLACE FUNCTION public.reset_monthly_allowance()
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_tokens
  SET monthly_allowance = 100,
      last_monthly_reset = DATE_TRUNC('month', NOW())
  WHERE last_monthly_reset < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Create a view for user token summary
CREATE OR REPLACE VIEW public.user_token_summary AS
SELECT ut.user_id,
       u.username,
       ut.total_tokens,
       ut.available_tokens,
       ut.ai_tokens,
       ut.premium_tokens,
       ut.monthly_allowance,
       ut.last_monthly_reset,
       COUNT(tt.id) as total_transactions,
       SUM(CASE WHEN tt.token_type = 'ai' AND tt.amount < 0 THEN -tt.amount ELSE 0 END) as ai_tokens_spent,
       SUM(CASE WHEN tt.token_type = 'premium' AND tt.amount < 0 THEN -tt.amount ELSE 0 END) as premium_tokens_spent
FROM public.user_tokens ut
JOIN public.profiles u ON ut.user_id = u.id
LEFT JOIN public.token_transactions tt ON ut.user_id = tt.user_id
GROUP BY ut.id, u.username;

-- Grant permissions
GRANT SELECT, INSERT ON public.user_tokens TO authenticated;
GRANT SELECT, INSERT ON public.token_transactions TO authenticated;
GRANT SELECT ON public.user_token_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_signup_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_monthly_allowance TO authenticated;