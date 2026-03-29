
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

async function migrate() {
  // 環境変数の読み込み
  const devEnv = dotenv.parse(fs.readFileSync(path.join(process.cwd(), '.env.local')));
  const prodEnv = dotenv.parse(fs.readFileSync(path.join(process.cwd(), '.env.prod')));

  // DEV 用の設定 (優先順位: 指定された名前 > 標準名)
  const devUrl = devEnv.DEV_URL || devEnv.NEXT_PUBLIC_SUPABASE_URL;
  const devKey = devEnv.DEV_KEY || devEnv.SUPABASE_SERVICE_ROLE_KEY;

  // PROD 用の設定 (優先順位: PROD_URL/PROD_KKEY > 標準名)
  const prodUrl = prodEnv.PROD_URL || prodEnv.NEXT_PUBLIC_SUPABASE_URL;
  const prodKey = prodEnv.PROD_KKEY || prodEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!devUrl || !devKey || !prodUrl || !prodKey) {
    console.error('Error: 必要となる環境変数が不足しています。');
    console.log('DEV_URL:', !!devUrl, 'DEV_KEY:', !!devKey);
    console.log('PROD_URL:', !!prodUrl, 'PROD_KEY:', !!prodKey);
    return;
  }

  const devClient = createClient(devUrl, devKey);
  const prodClient = createClient(prodUrl, prodKey);

  async function syncTable(tableName: string) {
    console.log(`\n[${tableName}] データの取得を開始します...`);
    let from = 0;
    const batchSize = 500; // チャンクサイズを少し落として安定させる
    let totalSynced = 0;

    while (true) {
      // 開発環境から取得
      const { data, error: fetchError } = await devClient
        .from(tableName)
        .select('*')
        .range(from, from + batchSize - 1);

      if (fetchError) throw new Error(`[${tableName}] Fetch error: ${fetchError.message}`);
      if (!data || data.length === 0) break;

      // 本番環境へ流し込み
      // card_role_profiles は id が serial のため、upsert 時に id を含めると競合を防げます。
      const { error: upsertError } = await prodClient
        .from(tableName)
        .upsert(data, { onConflict: (tableName === 'cards') ? 'id' : 'id' });

      if (upsertError) throw new Error(`[${tableName}] Upsert error: ${upsertError.message}`);

      totalSynced += data.length;
      console.log(`[${tableName}] 同期済み: ${totalSynced} 件...`);
      
      if (data.length < batchSize) break;
      from += batchSize;
    }
    console.log(`[${tableName}] 同期完了: 合計 ${totalSynced} 件`);
  }

  try {
    console.log('--- 開発環境から本番環境へのデータ同期を開始します ---');
    await syncTable('cards');
    await syncTable('card_role_profiles');
    console.log('\n✅ 全てのデータ同期が正常に完了しました！');
  } catch (err) {
    console.error('\n❌ 同期中にエラーが発生しました:');
    console.error(err);
  }
}

migrate();
