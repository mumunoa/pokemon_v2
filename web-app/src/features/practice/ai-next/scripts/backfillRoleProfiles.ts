
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getSectionTexts } from '../utils/text';
import { createRoleProfile } from '../inference/sectionRoleInference';
import { CardRoleProfile } from '../domain/types';
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
  
  const CHUNK_SIZE = 50;
  for (let i = 0; i < allCards.length; i += CHUNK_SIZE) {
    const chunk = allCards.slice(i, i + CHUNK_SIZE);
    const profiles: CardRoleProfile[] = [];

    for (const card of chunk) {
      try {
        const sections = getSectionTexts(card);
        const profile = createRoleProfile(card, sections);
        profiles.push(profile);
      } catch (e) {
        console.error(`Inference failed for: ${card.name} (${card.id})`, e);
      }
    }

    try {
      await repo.upsertMany(profiles);
      console.log(`Synced: ${i + chunk.length} / ${allCards.length} profiles...`);
    } catch (e) {
      console.error(`Batch upsert failed at index ${i}`, e);
    }
  }

  console.log('Backfill process completed successfully.');
}

backfill();
