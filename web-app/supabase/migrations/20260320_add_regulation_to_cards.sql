-- public.cards テーブルに regulation カラムを追加し、管理するためのSQL

-- 1. regulationカラムの追加（デフォルトは'standard'）
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS regulation TEXT DEFAULT 'standard';

-- 2. 既存データの更新（初期状態として一旦すべて 'standard' 扱いにする）
UPDATE public.cards SET regulation = 'standard' WHERE regulation IS NULL;

-- 3. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_cards_regulation ON public.cards(regulation);

-- 注意: プライマリキーは既存の id (TEXT) をそのまま使用します。
-- これにより、1つのカードIDに対して 'standard' か 'extra' どちらか一方の状態を保持します。
