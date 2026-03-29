
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

async function diagnose() {
  const devEnv = dotenv.parse(fs.readFileSync(path.join(process.cwd(), '.env.local')));
  const prodEnv = dotenv.parse(fs.readFileSync(path.join(process.cwd(), '.env.prod')));

  const devUrl = devEnv.DEV_URL || devEnv.NEXT_PUBLIC_SUPABASE_URL;
  const devKey = devEnv.DEV_KEY || devEnv.SUPABASE_SERVICE_ROLE_KEY;
  const prodUrl = prodEnv.PROD_URL || prodEnv.NEXT_PUBLIC_SUPABASE_URL;
  const prodKey = prodEnv.PROD_KKEY || prodEnv.SUPABASE_SERVICE_ROLE_KEY;

  const devClient = createClient(devUrl!, devKey!);
  const prodClient = createClient(prodUrl!, prodKey!);

  const tables = [
    'cards', 
    'card_role_profiles', 
    'users', 
    'ai_analysis_logs', 
    'user_decks',
    'game_sessions',
    'game_logs',
    'game_snapshots'
  ];

  console.log('--- データベース構成（スキーマ）の精密比較を開始します ---');

  for (const table of tables) {
    console.log(`\n[Table: ${table}] 診断中...`);
    
    // 開発環境からカラム見本を取得（1件データがあれば確実）
    const { data: devSample } = await devClient.from(table).select('*').limit(1);
    if (!devSample || devSample.length === 0) {
      console.warn(`Dev: テーブル ${table} にデータがないため、比較をスキップします。`);
      continue;
    }

    const devColumns = Object.keys(devSample[0]);
    const missingColumns: string[] = [];

    // 本番環境に対して、1つずつカラムが存在するかチェック
    for (const col of devColumns) {
      const { error } = await prodClient.from(table).select(col).limit(0);
      if (error && error.message.includes('column') && error.message.includes('not found')) {
        missingColumns.push(col);
      } else if (error && error.code === '42P01') {
         console.error(`Prod: テーブル ${table} 自体が存在しません。`);
         break;
      }
    }

    if (missingColumns.length > 0) {
      console.log(`❌ 差分あり! 本番環境に足りないカラム: ${missingColumns.join(', ')}`);
    } else {
      console.log(`✅ 一致しています。`);
    }
  }
}

diagnose();
