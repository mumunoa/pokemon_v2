
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.local から環境変数を読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const EXPORT_JSON_PATH = path.join(process.cwd(), 'cards_export.json');

async function main() {
  if (!fs.existsSync(EXPORT_JSON_PATH)) {
    console.error('Error: cards_export.json が見つかりません。');
    return;
  }

  console.log('Loading cards_export.json...');
  const cards = JSON.parse(fs.readFileSync(EXPORT_JSON_PATH, 'utf-8'));

  console.log(`Found ${cards.length} cards. Importing to Supabase...`);

  // 100件ずつバッチ処理
  const batchSize = 100;
  for (let i = 0; i < cards.length; i += batchSize) {
    const rawBatch = cards.slice(i, i + batchSize);
    
    // DBのカラム名と型に合わせる
    const batch = rawBatch.map((c: any) => ({
      id: c.id,
      no: c.no === 'none' ? null : c.no,
      name: c.name,
      image_url: c.image_url,
      type: c.type,
      kinds: c.kinds,
      hp: c.hp === 'none' ? null : c.hp,
      types: Array.isArray(c.types) ? c.types : [],
      weakness: c.weakness === 'none' ? null : c.weakness,
      resistance: c.resistance === 'none' ? null : c.resistance,
      retreat: c.retreat === 'none' ? null : c.retreat,
      ability: Array.isArray(c.ability) ? c.ability : [],
      attacks: Array.isArray(c.attacks) ? c.attacks : [],
      rules: Array.isArray(c.rules) ? c.rules : [],
      support: Array.isArray(c.support) ? c.support : [],
      packs: Array.isArray(c.packs) ? c.packs : [],
      evolves: Array.isArray(c.evolves) ? c.evolves : [],
      roles: Array.isArray(c.roles) ? c.roles : [],
      archetypes: Array.isArray(c.archetypes) ? c.archetypes : [],
      energy: Array.isArray(c.energy) ? c.energy : [],
      regulation: c.regulation || 'standard',
      updated_at: new Date()
    }));

    const { error } = await supabase
      .from('cards')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error importing batch starting at ${i}:`, error.message);
    } else {
      console.log(`Imported cards ${i} to ${Math.min(i + batchSize, cards.length)}`);
    }
  }

  console.log('Successfully finished importing cards to Supabase!');
}

main().catch(console.error);
