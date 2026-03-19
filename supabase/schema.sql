-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  industry TEXT,
  niche_description TEXT,
  business_description TEXT,
  website_url TEXT,
  primary_goal TEXT,
  posts_per_day INTEGER DEFAULT 1,
  posting_times JSONB DEFAULT '[]'::jsonb,
  platforms TEXT[] DEFAULT '{}'::text[],
  content_tone TEXT DEFAULT 'Casual & Friendly',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create social_accounts table
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL, -- 'facebook', 'instagram', 'tiktok', 'youtube'
  platform_user_id TEXT,
  access_token TEXT, -- Store encrypted in production
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Social Accounts Policies
CREATE POLICY "Users can view own social accounts" ON public.social_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own social accounts" ON public.social_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  platforms TEXT[] NOT NULL,
  hook TEXT,
  caption TEXT NOT NULL,
  cta TEXT,
  hashtags TEXT[],
  image_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'published', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Posts Policies
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled posts" ON public.scheduled_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own scheduled posts" ON public.scheduled_posts
  FOR ALL USING (auth.uid() = user_id);
