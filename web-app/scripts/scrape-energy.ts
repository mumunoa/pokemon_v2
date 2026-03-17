import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DETAIL_BASE_URL = 'https://www.pokemon-card.com';

const ENERGY_KIND_MAP: { [key: string]: string } = {
  '基本草エネルギー': 'grass',
  '基本炎エネルギー': 'fire',
  '基本水エネルギー': 'water',
  '基本雷エネルギー': 'electric',
  '基本超エネルギー': 'psychic',
  '基本闘エネルギー': 'fighting',
  '基本悪エネルギー': 'dark',
  '基本鋼エネルギー': 'steel',
  '基本フェアリーエネルギー': 'fairy', // フェアリー追加（XY時代）
};

async function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchCardList(page: number) {
  const url = `https://www.pokemon-card.com/card-search/resultAPI.php?keyword=&se_ta=energy&regulation_sidebar_form=XY&sc_hp_s=&sc_hp_e=&sc_run_away_s=0&sc_run_away_e=&pg=&illust=&sm_and_keyword=true&page=${page}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.pokemon-card.com/card-search/',
      }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) { return null; }
}

async function fetchHTML(url: string) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return null;
    return await response.text();
  } catch (error) { return null; }
}

function parseCardDetail(html: string, cardID: string) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const leftBox = doc.querySelector('.LeftBox');
  const rightBoxInner = doc.querySelector('.RightBox-inner');
  const section = doc.querySelector('.Section');

  if (!leftBox || !rightBoxInner) return null;

  const noText = leftBox.querySelector('.subtext.Text-fjalla')?.textContent?.trim() || 'none';
  const name = section?.querySelector('.Heading1.mt20')?.textContent?.trim() || 'Unknown';
  const imgElement = leftBox.querySelector('.fit') as HTMLImageElement;
  const imageUrl = imgElement ? `${DETAIL_BASE_URL}${imgElement.getAttribute('src')}` : 'none';

  // type判定
  let type = 'trainers'; // デフォルト
  if (name.includes('エネルギー')) {
    type = 'energy';
  }

  // kinds判定
  let kinds = 'none';
  let matchedBase = false;
  for (const [key, value] of Object.entries(ENERGY_KIND_MAP)) {
    if (name.includes(key)) {
      kinds = value;
      matchedBase = true;
      break;
    }
  }

  // 特別なルール (rules) - ポケモン/トレーナーズと同じロジック
  const rules: any[] = [];
  const rulesH2 = Array.from(doc.querySelectorAll('h2.mt20')).find(h2 => h2.textContent?.includes('特別なルール'));
  if (rulesH2) {
    const text = rulesH2.nextElementSibling?.tagName === 'P' ? rulesH2.nextElementSibling.textContent?.trim() : '';
    const isAce = text?.includes('ACE SPEC');
    if (text) {
      rules.push({ 
        text, 
        ace: isAce ? true : undefined 
      });
    }
  }

  // 特殊エネルギー (energy)
  const energyData: any[] = [];
  const h2Elements = Array.from(rightBoxInner.querySelectorAll('h2.mt20'));
  const specialEnergyH2 = h2Elements.find(h2 => h2.textContent?.includes('特殊エネルギー'));
  
  if (specialEnergyH2) {
    const pText = specialEnergyH2.nextElementSibling?.tagName === 'P' ? specialEnergyH2.nextElementSibling.textContent?.trim() : '';
    if (pText) {
      energyData.push({ text: pText });
    }
  }

  if (!matchedBase && specialEnergyH2) {
    kinds = 'special';
  }

  const packs: any[] = [];
  doc.querySelectorAll('.PopupSub .List .List_item').forEach(item => { packs.push({ pack1: item.textContent?.trim() || '' }); });

  return { 
    id: cardID, 
    no: noText, 
    name, 
    image_url: imageUrl, 
    type, 
    kinds, 
    hp: "none", 
    types: [], 
    weakness: "none", 
    resistance: "none", 
    retreat: "none", 
    ability: [], 
    attacks: [], 
    rules: rules, 
    energy: energyData,
    support: [], 
    packs, 
    evolves: [], 
    roles: [], 
    archetypes: [] 
  };
}

async function main() {
  console.log('--- Collecting Energy IDs via API (Pages 1-17) ---');
  const cardIds: string[] = [];
  for (let page = 1; page <= 17; page++) {
    const data = await fetchCardList(page);
    if (!data || !data.cardList || data.cardList.length === 0) break;
    data.cardList.forEach((c: any) => cardIds.push(c.cardID));
    console.log(`Page ${page}: Added ${data.cardList.length} IDs`);
    await sleep(500);
  }

  console.log(`Starting details scraping for ${cardIds.length} energy cards...`);
  for (let i = 0; i < cardIds.length; i++) {
    const cardID = cardIds[i];
    const url = `${DETAIL_BASE_URL}/card-search/details.php/card/${cardID}/regu/XY`;
    console.log(`[${i + 1}/${cardIds.length}] Scraping ${url}...`);
    const html = await fetchHTML(url);
    if (!html) continue;
    const cardData = parseCardDetail(html, cardID);
    if (cardData) {
      const { error } = await supabase.from('cards').upsert(cardData, { onConflict: 'id' });
      if (error) console.error('Supabase Error:', error.message);
    }
    await sleep(800);
  }
  console.log('Energy scraping completed!');
}

main().catch(console.error);
