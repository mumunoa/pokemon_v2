
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getSectionTexts } from '../utils/text';
import { createRoleProfile } from '../inference/sectionRoleInference';
import { RoleProfileRepo } from '../storage/roleProfileRepo';

/**
 * Backfill script for initial card role profiles.
 * Use after migration 20260317 is applied.
 */

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  const repo = new RoleProfileRepo(supabase);
  
  // 1. Fetch all cards from Supabase (instead of local json for better consistency)
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
  
  console.log(`Starting backfill for ${allCards.length} cards...`);
  
  for (const card of allCards) {
    try {
        const sections = getSectionTexts(card);
        const profile = createRoleProfile(card, sections);
        await repo.upsert(profile);
        // console.log(`Backfilled: ${card.name} (${card.id})`);
    } catch (e) {
        console.error(`Failed: ${card.name} (${card.id}):`, e);
    }
  }
  
  console.log('Backfill process completed.');
}

backfill();
