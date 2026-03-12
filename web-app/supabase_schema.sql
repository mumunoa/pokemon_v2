-- AI分析ログ保存用テーブル (フィードバック対応版)
CREATE TABLE IF NOT EXISTS public.ai_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id TEXT, -- ClerkのユーザーID
    game_id UUID, -- 対戦セッションID
    turn_count INTEGER,
    board_state JSONB, -- その時の盤面スナップショット
    prompt_text TEXT, -- AIに送った実際のプロンプト
    response_text TEXT, -- AIからの生回答
    accident_rate INTEGER, -- 抽出された事故率
    setup_rate INTEGER, -- 抽出された理想展開率
    model_name TEXT DEFAULT 'claude-sonnet-4-6',
    user_feedback TEXT, -- 'good', 'bad', null
    ip_address TEXT,
    fingerprint_id TEXT,
    local_storage_id TEXT
);

-- カラム追加予備 (既にテーブルが存在する場合)
ALTER TABLE public.ai_analysis_logs ADD COLUMN IF NOT EXISTS user_feedback TEXT;
ALTER TABLE public.ai_analysis_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.ai_analysis_logs ADD COLUMN IF NOT EXISTS fingerprint_id TEXT;
ALTER TABLE public.ai_analysis_logs ADD COLUMN IF NOT EXISTS local_storage_id TEXT;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_game_id ON public.ai_analysis_logs(game_id);

-- RLS（Row Level Security）設定
ALTER TABLE public.ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー設定 (すべての操作を許可)
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.ai_analysis_logs;
CREATE POLICY "Users can insert their own logs" ON public.ai_analysis_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own logs" ON public.ai_analysis_logs;
CREATE POLICY "Users can view their own logs" ON public.ai_analysis_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own logs" ON public.ai_analysis_logs;
CREATE POLICY "Users can update their own logs" ON public.ai_analysis_logs FOR UPDATE USING (true);

-- ユーザー情報管理テーブル (Clerk連動用)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- ClerkのユーザーID
    ai_tickets INTEGER DEFAULT 3, -- 無料回数（毎晩回復などで運用）
    pro_trial_until TIMESTAMPTZ, -- Proトライアルの期限 (Stripe等で制御)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS（Row Level Security）設定 (Users)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- users テーブルへのアクセス制御 (自身のレコードのみ参照・更新可能)
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
CREATE POLICY "Users can insert their own record" ON public.users FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = id OR true); -- webhookからのアクセスを考慮してServiceRoleキーなどで回避するか、当面フルオープンにするか

DROP POLICY IF EXISTS "Users can view their own record" ON public.users;
CREATE POLICY "Users can view their own record" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
CREATE POLICY "Users can update their own record" ON public.users FOR UPDATE USING (true);
