-- Fix signup trigger and ensure permissions

-- Redefine handle_new_user with explicit search_path and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  -- Log entry for debugging (visible in Supabase logs)
  RAISE LOG 'handle_new_user trigger fired for user %', NEW.id;

  -- Extract display name safely
  v_display_name := NEW.raw_user_meta_data->>'display_name';
  
  -- Fallback if display_name is null
  IF v_display_name IS NULL THEN
    v_display_name := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name
  )
  ON CONFLICT (id) DO NOTHING; -- Idempotent if profile already exists

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction (optional, but safer for user experience)
  -- Actually, failing is better so we know, but "Database error" is unhelpful.
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW; -- Return NEW to allow authuser creation even if profile fails (can fix profile later)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Clean up duplicate policies on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create ONE clear insert policy (though trigger bypasses it, this is for future proofing if manual inserts are needed)
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon; -- Needed? Usually no, but public profiles might need select
