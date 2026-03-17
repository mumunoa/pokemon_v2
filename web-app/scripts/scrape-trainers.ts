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

async function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchCardList(page: number, series: string = 'trainer') {
  const url = `https://www.pokemon-card.com/card-search/resultAPI.php?keyword=&se_ta=${series}&regulation_sidebar_form=XY&sc_hp_s=&sc_hp_e=&sc_run_away_s=0&sc_run_away_e=&pg=&illust=&sm_and_keyword=true&page=${page}`;
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

  let kinds = 'item';
  const h2Text = rightBoxInner.querySelector('h2.mt20')?.textContent?.trim() || '';
  if (h2Text.includes('スタジアム')) kinds = 'studium';
  else if (h2Text.includes('サポート')) kinds = 'support';
  else if (h2Text.includes('グッズ')) kinds = 'item';
  else if (h2Text.includes('ポケモンのどうぐ')) kinds = 'tool';

  // 特別なルール (rules) - ACE SPECなど
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

  const support: any[] = [];
  const p = rightBoxInner.querySelector('p');
  if (p) { support.push({ text: p.innerHTML.trim() }); }

  const packs: any[] = [];
  doc.querySelectorAll('.PopupSub .List .List_item').forEach(item => { packs.push({ pack1: item.textContent?.trim() || '' }); });

  return { id: cardID, no: noText, name, image_url: imageUrl, type: 'trainers', kinds, hp: "none", types: [], weakness: "none", resistance: "none", retreat: "none", ability: [], attacks: [], rules: rules, support, packs, evolves: [], roles: [], archetypes: [] };
}

async function main() {
  console.log('--- Collecting Trainer IDs via API (Pages 1-39) ---');
  const cardIds: string[] = [];
  for (let page = 1; page <= 39; page++) {
    const data = await fetchCardList(page, 'trainer');
    if (!data || !data.cardList || data.cardList.length === 0) break;
    data.cardList.forEach((c: any) => cardIds.push(c.cardID));
    console.log(`Page ${page}: Added ${data.cardList.length} IDs`);
    await sleep(500);
  }

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
}

main().catch(console.error);
