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
 * 公式APIから1ページ分のカードリスト(ID)を取得 (以前のロジック用)
 */
async function fetchCardList(page: number, series: string) {
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

/**
 * カード詳細ページを解析してオブジェクトを返す
 */
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
  const typeTextRaw = topInfo?.querySelector('.type')?.textContent || '';
  const typeText = typeTextRaw.replace(/[\s\xa0]+/g, '');

  const h2Elements = Array.from(rightBoxInner.querySelectorAll('h2.mt20'));
  const h2Texts = h2Elements.map(h2 => h2.textContent?.trim() || '');

  if (name.includes('エネルギー') && !name.includes('エネルギー回収') && !name.includes('エネルギー転送') && !name.includes('エネルギーつけかえ') && !name.includes('エネルギーリサイクル')) {
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
  if (type === 'trainer' && ['supporter', 'item', 'stadium', 'tool'].includes(kinds) && supportPs.length > 0) {
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

/**
 * カテゴリ指定のスクレイピング (以前のロジック)
 */
async function scrapeCategory(series: string, maxPage: number) {
  console.log(`\n--- ${series} スクレイピング開始 (${maxPage} ページ) ---`);
  const cardIds: string[] = [];

  for (let p = 1; p <= maxPage; p++) {
    console.log(`[${series}] IDリスト取得中 pg:${p}...`);
    const data = await fetchCardList(p, series);
    if (!data || !data.cardList || data.cardList.length === 0) break;
    data.cardList.forEach((c: any) => cardIds.push(c.cardID));
    await sleep(500);
  }

  console.log(`[${series}] 合計 ${cardIds.length} 個のIDを収集しました。詳細を取得中...`);

  for (let i = 0; i < cardIds.length; i++) {
    const cardID = cardIds[i];
    const url = `${DETAIL_BASE_URL}/card-search/details.php/card/${cardID}/regu/all`;
    process.stdout.write(`[${series}] 読込中 ${i + 1}/${cardIds.length} (ID:${cardID})...\r`);

    const html = await fetchHTML(url);
    if (!html) continue;

    const cardData = parseCardDetail(html, cardID);
    if (cardData) {
      const { error } = await supabase.from('cards').upsert(cardData, { onConflict: 'id' });
      if (error) console.error(`\n[ID:${cardID}] Upsertエラー: ${error.message}`);
    }
    await sleep(700);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const params: { [key: string]: number } = { pokemon: 0, trainer: 0, energy: 0 };
  let startId = 0;
  let endId = 0;
  let targetId = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pokemon') params.pokemon = parseInt(args[++i]);
    if (args[i] === '--trainer') params.trainer = parseInt(args[++i]);
    if (args[i] === '--energy') params.energy = parseInt(args[++i]);
    if (args[i] === '--start') startId = parseInt(args[++i]);
    if (args[i] === '--end') endId = parseInt(args[++i]);
    if (args[i] === '--id') targetId = args[++i];
  }

  if (params.pokemon === 0 && params.trainer === 0 && params.energy === 0 && !startId && !endId && !targetId) {
    console.log('使用法:');
    console.log('  公式API経由 (extra更新あり): npx tsx scripts/scrape-all.ts --pokemon <pages> --trainer <pages> --energy <pages>');
    console.log('  ID範囲指定 (extra更新なし): npx tsx scripts/scrape-all.ts --start <id> --end <id>');
    console.log('  特定ID指定 (extra更新なし): npx tsx scripts/scrape-all.ts --id <id1,id2>');
    return;
  }

  const startTime = new Date().toISOString();
  console.log(`\n処理開始時刻: ${startTime}`);

  // モード1: ID範囲指定 (--start, --end)
  if (startId > 0 && endId > 0) {
    console.log(`\n--- ID範囲指定スクレイピング: ${startId} から ${endId} ---`);
    for (let id = startId; id <= endId; id++) {
      const cardId = id.toString();
      const url = `${DETAIL_BASE_URL}/card-search/details.php/card/${cardId}/regu/all`;
      process.stdout.write(`進捗: ${id} / ${endId}\r`);
      const html = await fetchHTML(url);
      if (!html) continue;

      const cardData = parseCardDetail(html, cardId);
      if (cardData) {
        const { error } = await supabase.from('cards').upsert(cardData, { onConflict: 'id' });
        if (error) console.error(`\n[ID:${cardId}] Upsertエラー: ${error.message}`);
      }
      await sleep(700);
    }
    console.log('\nID範囲指定の処理が完了しました。');
    return;
  }

  // モード2: 特定ID指定 (--id)
  if (targetId) {
    const targetIds = targetId.split(',').map(id => id.trim()).filter(id => id);
    console.log(`\n--- 特定ID指定更新 (${targetIds.length} 枚) ---`);
    for (const id of targetIds) {
      const url = `${DETAIL_BASE_URL}/card-search/details.php/card/${id}/regu/all`;
      console.log(`[ID:${id}] 詳細取得中...`);
      const html = await fetchHTML(url);
      if (!html) continue;

      const cardData = parseCardDetail(html, id);
      if (cardData) {
        const { error } = await supabase.from('cards').upsert(cardData, { onConflict: 'id' });
        if (error) console.error(`[ID:${id}] Upsertエラー: ${error.message}`);
        else console.log(`[ID:${id}] 成功。`);
      }
      await sleep(700);
    }
    console.log('\n特定ID指定の処理が完了しました。');
    return;
  }

  // モード3: カテゴリ指定スクレイピング (以前のロジック)
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

  // 更新されなかったカードを extra に変更する (カテゴリ指定時のみ)
  console.log('\nカテゴリ内の未更新カードを "extra" に更新中...');
  for (const category of activeCategories) {
    console.log(`${category} カテゴリを更新中...`);
    const { error: updateError } = await supabase
      .from('cards')
      .update({ regulation: 'extra' })
      .eq('type', category)
      .lt('updated_at', startTime);

    if (updateError) {
      console.error(`Update Error for ${category}:`, updateError.message);
    }
  }

  console.log('\nすべてのカテゴリ処理が完了しました！');
}

main().catch(console.error);
