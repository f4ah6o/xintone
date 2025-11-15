-- Supabase データベーススキーマ
-- このファイルを Supabase SQL Editor で実行してください

-- プロファイルテーブル（ユーザーロール管理）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロファイルのみ参照可能
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 管理者は全プロファイルを参照可能
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- アプリ設定テーブル
CREATE TABLE IF NOT EXISTS public.kintone_apps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  kintone_app_id TEXT NOT NULL,
  kintone_domain TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  icon TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.kintone_apps ENABLE ROW LEVEL SECURITY;

-- 全ユーザーはアクティブなアプリを参照可能
CREATE POLICY "Users can view active apps"
  ON public.kintone_apps
  FOR SELECT
  USING (is_active = true);

-- 管理者は全アプリを参照・編集可能
CREATE POLICY "Admins can manage all apps"
  ON public.kintone_apps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ユーザーのアプリアクセス権限テーブル
CREATE TABLE IF NOT EXISTS public.user_app_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.kintone_apps(id) ON DELETE CASCADE,
  api_token TEXT NOT NULL, -- 暗号化推奨
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

ALTER TABLE public.user_app_access ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のアクセス権限のみ参照可能
CREATE POLICY "Users can view own access"
  ON public.user_app_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- 管理者は全アクセス権限を管理可能
CREATE POLICY "Admins can manage all access"
  ON public.user_app_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- トリガー関数：新規ユーザー登録時にプロファイルを自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー：auth.users に新規ユーザーが追加されたとき
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- トリガー関数：updated_at を自動更新
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに updated_at トリガーを追加
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_kintone_apps_updated_at
  BEFORE UPDATE ON public.kintone_apps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_app_access_updated_at
  BEFORE UPDATE ON public.user_app_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_kintone_apps_active ON public.kintone_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_id ON public.user_app_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_app_id ON public.user_app_access(app_id);
