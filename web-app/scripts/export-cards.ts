
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function exportAllCards() {
  console.log('Fetching all cards from Supabase...');
  let allCards: any[] = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('id')
      .range(from, from + step - 1);
      
    if (error) {
      console.error('Error fetching cards:', error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allCards = allCards.concat(data);
    console.log(`Fetched ${allCards.length} cards...`);
    from += step;
  }
  
  const outputPath = path.join(process.cwd(), 'cards_export.json');
  fs.writeFileSync(outputPath, JSON.stringify(allCards, null, 2));
  console.log(`Successfully exported ${allCards.length} cards to ${outputPath}`);
}

exportAllCards();
