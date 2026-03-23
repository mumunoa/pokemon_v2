
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

if (!supabaseUrl || !supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定です。');
}

const supabase = createClient(supabaseUrl, supabaseKey);

type BackfillOptions = {
  chunkSize: number;
  from?: number;
  limit?: number;
  onlyCardId?: string;
  dryRun?: boolean;
};

function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2);
  const getValue = (flag: string): string | undefined => {
    const hit = args.find((item) => item.startsWith(`${flag}=`));
    return hit ? hit.split('=').slice(1).join('=') : undefined;
  };

  return {
    chunkSize: Number(getValue('--chunkSize') ?? 50),
    from: getValue('--from') ? Number(getValue('--from')) : undefined,
    limit: getValue('--limit') ? Number(getValue('--limit')) : undefined,
    onlyCardId: getValue('--cardId'),
    dryRun: args.includes('--dry-run'),
  };
}

async function fetchCards(options: BackfillOptions) {
  if (options.onlyCardId) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', options.onlyCardId)
      .limit(1);

    if (error) throw new Error(`Error fetching card ${options.onlyCardId}: ${error.message}`);
    return data ?? [];
  }

  let allCards: any[] = [];
  let from = options.from ?? 0;
  const step = 1000;

  while (true) {
    const upper = options.limit ? Math.min(from + step - 1, (options.from ?? 0) + options.limit - 1) : from + step - 1;

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('id')
      .range(from, upper);

    if (error) throw new Error(`Error fetching cards: ${error.message}`);
    if (!data || data.length === 0) break;

    allCards = allCards.concat(data);
    console.log(`Fetched ${allCards.length} cards...`);

    if (options.limit && allCards.length >= options.limit) {
      allCards = allCards.slice(0, options.limit);
      break;
    }

    from += step;
  }

  return allCards;
}

async function backfill() {
  const options = parseArgs();
  const repo = new RoleProfileRepo(supabase);

  console.log('Fetching cards from Supabase...');
  const allCards = await fetchCards(options);
  console.log(`Starting backfill for ${allCards.length} cards... dryRun=${options.dryRun ? 'yes' : 'no'}`);

  let failed = 0;
  let succeeded = 0;

  for (let i = 0; i < allCards.length; i += options.chunkSize) {
    const chunk = allCards.slice(i, i + options.chunkSize);
    const profiles: CardRoleProfile[] = [];

    for (const card of chunk) {
      try {
        const sections = getSectionTexts(card);
        const profile = createRoleProfile(card, sections);
        profiles.push(profile);
      } catch (e) {
        failed += 1;
        console.error(`Inference failed for: ${card.name} (${card.id})`, e);
      }
    }

    if (!options.dryRun && profiles.length > 0) {
      try {
        await repo.upsertMany(profiles);
        succeeded += profiles.length;
      } catch (e) {
        failed += profiles.length;
        console.error(`Batch upsert failed at index ${i}`, e);
      }
    } else {
      succeeded += profiles.length;
    }

    console.log(
      `Processed ${Math.min(i + chunk.length, allCards.length)} / ${allCards.length} cards... success=${succeeded} failed=${failed}`,
    );
  }

  console.log(`Backfill completed. success=${succeeded}, failed=${failed}, dryRun=${options.dryRun ? 'yes' : 'no'}`);
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
