import fs from 'fs';
import path from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.local から環境変数を読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DETAIL_BASE_URL = 'https://www.pokemon-card.com';

const TYPE_MAP: { [key: string]: string } = {
  'icon-grass': 'grass', 'icon-fire': 'fire', 'icon-water': 'water',
  'icon-electric': 'electric', 'icon-psychic': 'psychic', 'icon-fighting': 'fighting',
  'icon-dark': 'dark', 'icon-steel': 'steel', 'icon-dragon': 'dragon', 'icon-none': 'none'
};

const ENERGY_KIND_MAP: { [key: string]: string } = {
  '基本草エネルギー': 'grass', '基本炎エネルギー': 'fire', '基本水エネルギー': 'water',
  '基本雷エネルギー': 'electric', '基本超エネルギー': 'psychic', '基本闘エネルギー': 'fighting',
  '基本悪エネルギー': 'dark', '基本鋼エネルギー': 'steel', '基本フェアリーエネルギー': 'fairy',
};

async function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchHTML(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    if (!response.ok) return null;
    return await response.text();
  } catch (error) { return null; }
}

function parseCardDetail(html: string, cardID: string) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("error", () => { });
  const dom = new JSDOM(html, { virtualConsole });
  const doc = dom.window.document;
  const leftBox = doc.querySelector('.LeftBox');
  const rightBoxInner = doc.querySelector('.RightBox-inner');
  const section = doc.querySelector('.Section');

  if (!leftBox || !rightBoxInner) return null;

  const noText = leftBox.querySelector('.subtext.Text-fjalla')?.textContent?.trim() || 'none';
  const name = section?.querySelector('.Heading1.mt20')?.textContent?.trim() || 'Unknown';
  const imgElement = leftBox.querySelector('.fit') as HTMLImageElement;
  const imageUrl = imgElement ? `${DETAIL_BASE_URL}${imgElement.getAttribute('src')}` : 'none';

  let type = 'trainer';
  let kinds = 'item';

  const topInfo = rightBoxInner.querySelector('.TopInfo.Text-fjalla');
  const typeText = topInfo?.querySelector('.type')?.textContent?.trim() || '';
  const h2Elements = Array.from(rightBoxInner.querySelectorAll('h2.mt20'));
  const h2Texts = h2Elements.map(h2 => h2.textContent?.trim() || '');

  if (name.includes('エネルギー')) {
    type = 'energy';
    kinds = 'none';
    for (const [key, value] of Object.entries(ENERGY_KIND_MAP)) {
      if (name.includes(key)) { kinds = value; break; }
    }
    if (kinds === 'none' && h2Texts.some(t => t.includes('特殊エネルギー'))) {
      kinds = 'special';
    }
  } else if (topInfo && (typeText.includes('たね') || typeText.includes('1進化') || typeText.includes('2進化'))) {
    type = 'pokemon';
    if (typeText.includes('たね')) kinds = 'basic';
    else if (typeText.includes('1進化')) kinds = 'stage1';
    else if (typeText.includes('2進化')) kinds = 'stage2';
  } else {
    type = 'trainer';
    const mainH2 = h2Texts.find(t => t.includes('サポート') || t.includes('グッズ') || t.includes('スタジアム') || t.includes('ポケモンのどうぐ'));
    if (mainH2?.includes('スタジアム')) kinds = 'stadium';
    else if (mainH2?.includes('サポート')) kinds = 'supporter';
    else if (mainH2?.includes('ポケモンのどうぐ')) kinds = 'tool';
    else kinds = 'item';
  }

  const hp = topInfo?.querySelector('.hp-num')?.textContent?.trim() || 'none';
  const types: string[] = [];
  topInfo?.querySelectorAll('.icon').forEach(icon => {
    for (const [key, value] of Object.entries(TYPE_MAP)) {
      if (icon.classList.contains(key)) types.push(value);
    }
  });

  const ability: any[] = [];
  const abilityH2 = h2Elements.find(h2 => h2.textContent?.includes('特性'));
  if (abilityH2) {
    const abName = abilityH2.nextElementSibling?.textContent?.trim() || '';
    const abText = abilityH2.nextElementSibling?.nextElementSibling?.textContent?.trim() || '';
    ability.push({ name: abName, text: abText });
  }

  const attacks: any[] = [];
  const attackH2s = h2Elements.filter(h2 => h2.textContent?.includes('ワザ'));
  attackH2s.forEach(h2 => {
    let next = h2.nextElementSibling;
    while (next && next.tagName !== 'H2') {
      if (next.tagName === 'H4') {
        const atName = next.textContent?.trim() || '';
        const cost: string[] = [];
        next.querySelectorAll('.icon').forEach(icon => {
          for (const [key, value] of Object.entries(TYPE_MAP)) { if (icon.classList.contains(key)) cost.push(value); }
        });
        const damage = next.querySelector('.f_right.Text-fjalla')?.textContent?.trim() || 'none';
        let atText = (next.nextElementSibling?.tagName === 'P') ? next.nextElementSibling.textContent?.trim() : '';
        attacks.push({ name: atName, cost, convertedEnergyCost: cost.length, damage, text: atText });
      }
      next = next.nextElementSibling;
    }
  });

  const rules: any[] = [];
  const rulesH2 = h2Elements.find(h2 => h2.textContent?.includes('特別なルール'));
  if (rulesH2) {
    const rText = rulesH2.nextElementSibling?.textContent?.trim() || '';
    const isAce = rText.includes('ACE SPEC');
    const prizeMatch = rText.match(/サイドを(\d+)枚とる/);
    rules.push({ text: rText, prize: prizeMatch ? prizeMatch[1] : "1", ace: isAce || undefined });
  }

  const energy: any[] = [];
  const specialEnergyH2 = h2Elements.find(h2 => h2.textContent?.includes('特殊エネルギー'));
  if (specialEnergyH2) {
    const eText = specialEnergyH2.nextElementSibling?.textContent?.trim() || '';
    energy.push({ text: eText });
  }

  const support: any[] = [];
  const supportPs = rightBoxInner.querySelectorAll('p');
  if (type === 'trainer' && kinds === 'supporter' && supportPs.length > 0) {
    const fullText = Array.from(supportPs).map(p => p.textContent?.trim()).filter(t => t).join('\n');
    if (fullText) support.push({ text: fullText });
  }

  const packs: any[] = [];
  doc.querySelectorAll('.PopupSub .List .List_item').forEach(item => { packs.push({ pack1: item.textContent?.trim() || '' }); });

  const evolves: string[] = [];
  doc.querySelectorAll('.evolution.in-box.ev_off').forEach(ev => { evolves.push(ev.textContent?.trim() || ''); });

  const table = rightBoxInner.querySelector('table');
  let weakness = 'none', resistance = 'none', retreat = 'none';
  if (table) {
    const rows = table.querySelectorAll('tr');
    if (rows.length >= 2) {
      const tdList = rows[1].querySelectorAll('td');
      if (tdList.length >= 3) {
        const wIcon = tdList[0].querySelector('.icon');
        if (wIcon) { for (const [k, v] of Object.entries(TYPE_MAP)) { if (wIcon.classList.contains(k)) weakness = v; } }
        const rIcon = tdList[1].querySelector('.icon');
        if (rIcon) { for (const [k, v] of Object.entries(TYPE_MAP)) { if (rIcon.classList.contains(k)) resistance = v; } }
        const rtIcons = tdList[2].querySelectorAll('.icon-none');
        retreat = rtIcons.length.toString();
      }
    }
  }

  return {
    id: cardID, no: noText, name, image_url: imageUrl, type, kinds, hp, types, 
    weakness, resistance, retreat, ability, attacks, rules, energy, support, packs, evolves,
    roles: [], archetypes: [], updated_at: new Date(), regulation: 'standard'
  };
}

async function main() {
  const args = process.argv.slice(2);
  let idInput = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ids') idInput = args[++i];
  }

  if (!idInput) {
    console.log('Usage: npx tsx scripts/scrape-recovery.ts --ids <ID1,ID2,...>');
    return;
  }

  const cardIds = idInput.split(',').map(id => id.trim()).filter(id => id);
  console.log(`Starting recovery for ${cardIds.length} cards...`);

  for (let i = 0; i < cardIds.length; i++) {
    const cardID = cardIds[i];
    // XYレギュレーションで固定（scrape-all.tsに合わせる）
    const url = `${DETAIL_BASE_URL}/card-search/details.php/card/${cardID}/regu/XY`;
    console.log(`[${i + 1}/${cardIds.length}] Recovery Scraping ID:${cardID}...`);

    const html = await fetchHTML(url);
    if (!html) {
      console.error(`[ID:${cardID}] Failed to fetch HTML`);
      continue;
    }

    const cardData = parseCardDetail(html, cardID);
    if (cardData) {
      const { error } = await supabase.from('cards').upsert(cardData, { onConflict: 'id' });
      if (error) {
        console.error(`[ID:${cardID}] Upsert failed: ${error.message}`);
      } else {
        console.log(`[ID:${cardID}] Successfully recovered as standard.`);
      }
    } else {
      console.error(`[ID:${cardID}] Parse Error (Empty Data)`);
    }
    await sleep(1000); // 念のため少し長めに待機
  }

  console.log('\nRecovery completed!');
}

main().catch(console.error);
