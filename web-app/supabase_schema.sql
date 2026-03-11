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
    user_feedback TEXT -- 'good', 'bad', null
);

-- カラム追加予備 (既にテーブルが存在する場合)
ALTER TABLE public.ai_analysis_logs ADD COLUMN IF NOT EXISTS user_feedback TEXT;

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
