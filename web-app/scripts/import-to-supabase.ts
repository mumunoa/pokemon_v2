import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.local から環境変数を読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 管理者権限が必要
const supabase = createClient(supabaseUrl, supabaseKey);

const MASTER_JSON_PATH = path.join(process.cwd(), 'src/lib/simulation/catalog/card-master.json');

async function main() {
  console.log('Loading card-master.json...');
  const data = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, 'utf-8'));
  const cards = data.exactMatches;

  console.log(`Found ${cards.length} cards. Importing to Supabase...`);

  // 100件ずつバッチ処理
  const batchSize = 100;
  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize).map((c: any) => ({
      id: c.id,
      name: c.name,
      image_url: c.imageUrl,
      type: c.type,
      kinds: c.kinds,
      hp: c.hp,
      types: c.types,
      weakness: c.weakness,
      resistance: c.resistance,
      retreat: c.retreat,
      ability: c.ability,
      attacks: c.attacks,
      rules: c.rules,
      support: c.support,
      packs: c.packs,
      evolves: c.evolves,
      roles: c.roles,
      archetypes: c.archetypes,
      updated_at: new Date()
    }));

    const { error } = await supabase
      .from('cards')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error importing batch ${i / batchSize}:`, error.message);
    } else {
      console.log(`Imported cards ${i} to ${Math.min(i + batchSize, cards.length)}`);
    }
  }

  console.log('Successfully finished importing cards to Supabase!');
}

main().catch(console.error);
