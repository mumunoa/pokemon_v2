import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数読み込み
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DETAIL_BASE_URL = 'https://www.pokemon-card.com';

const TYPE_MAP: { [key: string]: string } = {
  'icon-grass': 'grass', 'icon-fire': 'fire', 'icon-water': 'water',
  'icon-electric': 'electric', 'icon-psychic': 'psychic', 'icon-fighting': 'fighting',
  'icon-dark': 'dark', 'icon-steel': 'steel', 'icon-dragon': 'dragon', 'icon-none': 'none'
};

async function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchCardList(page: number, series: string = 'pokemon') {
  const url = `https://www.pokemon-card.com/card-search/resultAPI.php?keyword=&se_ta=${series}&regulation_sidebar_form=XY&pg=&illust=&sm_and_keyword=true&page=${page}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

  let kinds = 'basic';
  const topInfo = rightBoxInner.querySelector('.TopInfo.Text-fjalla');
  const typeText = topInfo?.querySelector('.type')?.textContent?.trim() || '';
  if (typeText.includes('たね')) kinds = 'basic';
  else if (typeText.includes('1進化')) kinds = 'stage1';
  else if (typeText.includes('2進化')) kinds = 'stage2';

  const hp = topInfo?.querySelector('.hp-num')?.textContent?.trim() || 'none';
  const types: string[] = [];
  topInfo?.querySelectorAll('.icon').forEach(icon => {
    for (const [key, value] of Object.entries(TYPE_MAP)) {
      if (icon.classList.contains(key)) types.push(value);
    }
  });

  const abilities: any[] = [];
  const abilityH2 = Array.from(doc.querySelectorAll('h2.mt20')).find(h2 => h2.textContent?.includes('特性'));
  if (abilityH2) {
    const name = abilityH2.nextElementSibling?.tagName === 'H4' ? abilityH2.nextElementSibling.textContent?.trim() : '';
    const text = abilityH2.nextElementSibling?.nextElementSibling?.tagName === 'P' ? abilityH2.nextElementSibling.nextElementSibling.textContent?.trim() : '';
    if (name) abilities.push({ name, text });
  }

  const attacks: any[] = [];
  const attackH2s = Array.from(doc.querySelectorAll('h2.mt20')).filter(h2 => h2.textContent?.includes('ワザ'));
  attackH2s.forEach(h2 => {
    let next = h2.nextElementSibling;
    while (next && next.tagName !== 'H2') {
      if (next.tagName === 'H4') {
        const name = next.textContent?.trim() || '';
        const cost: string[] = [];
        next.querySelectorAll('.icon').forEach(icon => {
          for (const [key, value] of Object.entries(TYPE_MAP)) { if (icon.classList.contains(key)) cost.push(value); }
        });
        const damage = next.querySelector('.f_right.Text-fjalla')?.textContent?.trim() || 'none';
        let text = '';
        if (next.nextElementSibling?.tagName === 'P') text = next.nextElementSibling.textContent?.trim() || '';
        attacks.push({ name, cost, convertedEnergyCost: cost.length, damage, text });
      }
      next = next.nextElementSibling;
    }
  });

  const rules: any[] = [];
  const rulesH2 = Array.from(doc.querySelectorAll('h2.mt20')).find(h2 => h2.textContent?.includes('特別なルール'));
  if (rulesH2) {
    const text = rulesH2.nextElementSibling?.tagName === 'P' ? rulesH2.nextElementSibling.textContent?.trim() : '';
    const isAce = text?.includes('ACE SPEC');
    if (text) {
      const prizeMatch = text.match(/サイドを(\d+)枚とる/);
      rules.push({ 
        text, 
        prize: prizeMatch ? prizeMatch[1] : "1",
        ace: isAce ? true : undefined
      });
    }
  }

  const packs: any[] = [];
  doc.querySelectorAll('.PopupSub .List .List_item').forEach(item => { packs.push({ pack1: item.textContent?.trim() || '' }); });

  const table = rightBoxInner.querySelector('table');
  let weakness = 'none', resistance = 'none', retreat = 'none';
  if (table) {
    const rows = table.querySelectorAll('tr');
    if (rows.length >= 2) {
      const tdList = rows[1].querySelectorAll('td');
      if (tdList.length >= 3) {
        const wIcon = tdList[0].querySelector('.icon');
        if (wIcon) { for (const [key, value] of Object.entries(TYPE_MAP)) { if (wIcon.classList.contains(key)) weakness = value; } }
        const rIcon = tdList[1].querySelector('.icon');
        if (rIcon) { for (const [key, value] of Object.entries(TYPE_MAP)) { if (rIcon.classList.contains(key)) resistance = value; } }
        const rtIcons = tdList[2].querySelectorAll('.icon-none');
        retreat = rtIcons.length.toString();
      }
    }
  }

  const evolves: string[] = [];
  doc.querySelectorAll('.evolution.in-box.ev_off').forEach(ev => {
    const evName = ev.textContent?.trim();
    if (evName) evolves.push(evName);
  });

  return { id: cardID, no: noText, name, image_url: imageUrl, type: 'pokemon', kinds, hp, types, weakness, resistance, retreat, ability: abilities, attacks, rules, support: [], packs, evolves, roles: [], archetypes: [] };
}

async function main() {
  console.log('--- Collecting Pokemon IDs via API (Pages 1-80) ---');
  const cardIds: string[] = [];
  for (let page = 1; page <= 80; page++) {
    const data = await fetchCardList(page, 'pokemon');
    if (!data || !data.cardList || data.cardList.length === 0) break;
    data.cardList.forEach((c: any) => cardIds.push(c.cardID));
    console.log(`Page ${page}: Added ${data.cardList.length} IDs`);
    await sleep(500);
  }

  console.log(`Starting details scraping for ${cardIds.length} cards...`);
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
