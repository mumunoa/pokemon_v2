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

/**
 * 公式APIから1ページ分のカードリスト(ID)を取得
 */
async function fetchCardList(page: number, series: string) {
  // ユーザー指定のURL形式（XYレギュレーション）
  const baseUrl = 'https://www.pokemon-card.com/card-search/resultAPI.php';
  const query = new URLSearchParams({
    keyword: '',
    se_ta: series, // pokemon | trainer | energy
    regulation_sidebar_form: 'XY',
    sc_hp_s: '',
    sc_hp_e: '',
    sc_run_away_s: series === 'energy' ? '0' : '',
    sc_run_away_e: '',
    pg: '',
    illust: '',
    sm_and_keyword: 'true',
    page: page.toString()
  });

  try {
    const response = await fetch(`${baseUrl}?${query.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.pokemon-card.com/card-search/',
      }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`API Fetch Error (${series} pg:${page}):`, error);
    return null;
  }
}

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
  virtualConsole.on("error", () => { }); // CSS errors etc. are ignored
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

  // 基本カテゴリー判定
  let type = 'trainer';
  let kinds = 'item';

  const topInfo = rightBoxInner.querySelector('.TopInfo.Text-fjalla');
  const typeTextRaw = topInfo?.querySelector('.type')?.textContent || '';
  // HTML上の「&nbsp;」(ノーブレークスペース)や空白全般を除去して判定しやすくする
  const typeText = typeTextRaw.replace(/[\s\xa0]+/g, '');

  const h2Elements = Array.from(rightBoxInner.querySelectorAll('h2.mt20'));
  const h2Texts = h2Elements.map(h2 => h2.textContent?.trim() || '');

  if (name.includes('エネルギー') && !name.includes('エネルギー回収') && !name.includes('エネルギー転送') && !name.includes('エネルギーつけかえ') && !name.includes('エネルギーリサイクル')) {
    // 1. エネルギー判定
    type = 'energy';
    kinds = 'none';
    for (const [key, value] of Object.entries(ENERGY_KIND_MAP)) {
      if (name.includes(key)) { kinds = value; break; }
    }
    if (kinds === 'none' && h2Texts.some(t => t.includes('特殊エネルギー'))) {
      kinds = 'special';
    }
  } else if (topInfo && (
    typeText.includes('たね') ||
    typeText.includes('1進化') ||
    typeText.includes('2進化') ||
    typeText.includes('VMAX') ||
    typeText.includes('VSTAR') ||
    typeText.includes('V-UNION') ||
    typeText.includes('レベルアップ') ||
    typeText.includes('BREAK') ||
    typeText.includes('復元')
  )) {
    // 2. ポケモン判定
    type = 'pokemon';
    if (typeText.includes('たね')) kinds = 'basic';
    else if (typeText.includes('1進化')) kinds = 'stage1';
    else if (typeText.includes('2進化')) kinds = 'stage2';
    else if (typeText.includes('VMAX')) kinds = 'vmax';
    else if (typeText.includes('VSTAR')) kinds = 'vstar';
    else if (typeText.includes('V-UNION')) kinds = 'vunion';
    else if (typeText.includes('レベルアップ')) kinds = 'level_up';
    else if (typeText.includes('BREAK')) kinds = 'break';
    else if (typeText.includes('復元')) kinds = 'restored';
  } else {
    // 3. トレーナーズ判定
    type = 'trainer';
    const mainH2 = h2Texts.find(t => t.includes('サポート') || t.includes('グッズ') || t.includes('スタジアム') || t.includes('ポケモンのどうぐ'));
    if (mainH2?.includes('スタジアム')) kinds = 'stadium'; // stadium misspelled as studium previously
    else if (mainH2?.includes('サポート')) kinds = 'supporter'; // support vs supporter
    else if (mainH2?.includes('ポケモンのどうぐ')) kinds = 'tool';
    else kinds = 'item';
  }

  // HP & 属性
  const hp = topInfo?.querySelector('.hp-num')?.textContent?.trim() || 'none';
  const types: string[] = [];
  topInfo?.querySelectorAll('.icon').forEach(icon => {
    for (const [key, value] of Object.entries(TYPE_MAP)) {
      if (icon.classList.contains(key)) types.push(value);
    }
  });

  // 特性
  const ability: any[] = [];
  const abilityH2 = h2Elements.find(h2 => h2.textContent?.includes('特性'));
  if (abilityH2) {
    const abName = abilityH2.nextElementSibling?.textContent?.trim() || '';
    const abText = abilityH2.nextElementSibling?.nextElementSibling?.textContent?.trim() || '';
    ability.push({ name: abName, text: abText });
  }

  // ワザ
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

  // 特別なルール (ACE SPEC含有)
  const rules: any[] = [];
  const rulesH2 = h2Elements.find(h2 => h2.textContent?.includes('特別なルール'));
  if (rulesH2) {
    const rText = rulesH2.nextElementSibling?.textContent?.trim() || '';
    const isAce = rText.includes('ACE SPEC');
    const prizeMatch = rText.match(/サイドを(\d+)枚とる/);
    rules.push({ text: rText, prize: prizeMatch ? prizeMatch[1] : "1", ace: isAce || undefined });
  }

  // 特殊エネルギー情報
  const energy: any[] = [];
  const specialEnergyH2 = h2Elements.find(h2 => h2.textContent?.includes('特殊エネルギー'));
  if (specialEnergyH2) {
    const eText = specialEnergyH2.nextElementSibling?.textContent?.trim() || '';
    energy.push({ text: eText });
  }

  // サポート・テキスト
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

  // 弱点・抵抗力・にげる
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

async function scrapeCategory(series: string, maxPage: number) {
  console.log(`\n--- Starting ${series} Scraping (${maxPage} pages) ---`);
  const cardIds: string[] = [];

  for (let p = 1; p <= maxPage; p++) {
    console.log(`[${series}] Fetching ID list pg:${p}...`);
    const data = await fetchCardList(p, series);
    if (!data || !data.cardList || data.cardList.length === 0) break;
    data.cardList.forEach((c: any) => cardIds.push(c.cardID));
    await sleep(500);
  }

  console.log(`Collected ${cardIds.length} IDs for ${series}. Fetching details...`);

  for (let i = 0; i < cardIds.length; i++) {
    const cardID = cardIds[i];
    const url = `${DETAIL_BASE_URL}/card-search/details.php/card/${cardID}/regu/all`;
    process.stdout.write(`[${series}] Scraping ${i + 1}/${cardIds.length} (ID:${cardID})...\r`);

    const html = await fetchHTML(url);
    if (!html) {
      process.stdout.write(`\n[ID:${cardID}] [url:${url}]Failed to fetch HTML\n`);
      continue;
    }

    const cardData = parseCardDetail(html, cardID);
    if (cardData) {
      // 全ての取得データは 'standard' として保存 (updated_at も更新される)
      const { error } = await supabase.from('cards').upsert(cardData, { onConflict: 'id' });

      if (error) {
        process.stdout.write(`\n[ID:${cardID}] Upsert failed: ${error.message}\n`);
      } else {
        // 成功ログ
      }
    } else {
      process.stdout.write(`\n[ID:${cardID}] Parse Error (Empty Data)\n`);
    }
    await sleep(700);
  }
  console.log(`\nFinished ${series} scraping.`);
}

async function main() {
  const args = process.argv.slice(2);
  const params: { [key: string]: number } = { pokemon: 0, trainer: 0, energy: 0 };
  let targetId = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pokemon') params.pokemon = parseInt(args[++i]);
    if (args[i] === '--trainer') params.trainer = parseInt(args[++i]);
    if (args[i] === '--energy') params.energy = parseInt(args[++i]);
    if (args[i] === '--id') targetId = args[++i];
  }

  if (params.pokemon === 0 && params.trainer === 0 && params.energy === 0 && !targetId) {
    console.log('Usage: npx tsx scripts/scrape-all.ts [--pokemon <pages> | --trainer <pages> | --energy <pages> | --id <cardID>]');
    return;
  }

  const startTime = new Date().toISOString();
  console.log(`\nStarting process at: ${startTime}`);

  // --id が指定されている場合の単体・複数更新
  if (targetId) {
    const targetIds = targetId.split(',').map(id => id.trim()).filter(id => id);
    console.log(`\n--- Processing Card Update (${targetIds.length} cards) ---`);

    for (const id of targetIds) {
      const url = `${DETAIL_BASE_URL}/card-search/details.php/card/${id}/regu/all`;
      const html = await fetchHTML(url);
      if (!html) {
        console.error(`[ID:${id}] [url:${url}]Failed to fetch HTML`);
      } else {
        const cardData = parseCardDetail(html, id);
        if (cardData) {
          const { error } = await supabase.from('cards').upsert(cardData, { onConflict: 'id' });
          if (error) console.error(`[ID:${id}] Upsert failed: ${error.message}`);
          else console.log(`[ID:${id}] Successfully updated as standard.`);
        } else {
          console.error(`[ID:${id}] Parse Error`);
        }
      }
      await sleep(700); // サーバー負荷軽減
    }

    // --id 指定時は、他のカードを extra にする一括更新は行わない
    console.log('\nID update completed. Skipping "extra" status synchronization.');
    return;
  }

  const activeCategories: string[] = [];
  if (params.pokemon > 0) {
    await scrapeCategory('pokemon', params.pokemon);
    activeCategories.push('pokemon');
  }
  if (params.trainer > 0) {
    await scrapeCategory('trainer', params.trainer);
    activeCategories.push('trainer');
  }
  if (params.energy > 0) {
    await scrapeCategory('energy', params.energy);
    activeCategories.push('energy');
  }

  console.log('\nScraping tasks completed. Updating non-matching cards to "extra" (Selected Categories Only)...');

  for (const category of activeCategories) {
    console.log(`Updating ${category} records...`);
    // 指定されたカテゴリかつ最新ではないレコードを extra に更新
    const { error: updateError } = await supabase
      .from('cards')
      .update({ regulation: 'extra' })
      .eq('type', category)
      .lt('updated_at', startTime);

    if (updateError) {
      console.error(`Update Error for ${category}:`, updateError.message);
    }
  }

  console.log('\nAll processes completed!');
}

main().catch(console.error);
