import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// 定数定義
const SEARCH_URL = 'https://www.pokemon-card.com/card-search/index.php?keyword=&se_ta=trainer&regulation_sidebar_form=XY&sc_hp_s=&sc_hp_e=&sc_run_away_s=0&sc_run_away_e=&pg=';
const DETAIL_BASE_URL = 'https://www.pokemon-card.com';
const MASTER_JSON_PATH = path.join(process.cwd(), 'src/lib/simulation/catalog/card-master.json');

// エネルギーアイコンのマッピング
const TYPE_MAP: { [key: string]: string } = {
  'icon-grass': 'grass',
  'icon-fire': 'fire',
  'icon-water': 'water',
  'icon-electric': 'electric',
  'icon-psychic': 'psychic',
  'icon-fighting': 'fighting',
  'icon-dark': 'dark',
  'icon-steel': 'steel',
  'icon-dragon': 'dragon',
  'icon-none': 'none'
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchHTML(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

function parseCardDetail(html: string, url: string) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const leftBox = doc.querySelector('.LeftBox');
  const rightBoxInner = doc.querySelector('.RightBox-inner');
  const section = doc.querySelector('.Section');

  if (!leftBox || !rightBoxInner) return null;

  const idText = leftBox.querySelector('.subtext.Text-fjalla')?.textContent?.trim() || 'none';
  const name = section?.querySelector('.Heading1.mt20')?.textContent?.trim() || 'Unknown';
  const imgElement = leftBox.querySelector('.fit') as HTMLImageElement;
  const imageUrl = imgElement ? `${DETAIL_BASE_URL}${imgElement.getAttribute('src')}` : 'none';

  // トレーナーズ判定
  let type = 'trainers';
  let kinds = 'item';
  const h2Text = rightBoxInner.querySelector('h2.mt20')?.textContent?.trim() || '';
  if (h2Text.includes('スタジアム')) kinds = 'studium';
  else if (h2Text.includes('サポート')) kinds = 'support';
  else if (h2Text.includes('グッズ')) kinds = 'item';
  else if (h2Text.includes('ポケモンのどうぐ')) kinds = 'tool';

  // サポート情報テキスト
  const support: any[] = [];
  const p = rightBoxInner.querySelector('p');
  if (p) {
    support.push({ text: p.innerHTML.trim() });
  }

  // パック情報
  const packs: any[] = [];
  doc.querySelectorAll('.PopupSub .List .List_item').forEach(item => {
    packs.push({ pack1: item.textContent?.trim() || '' });
  });

  return {
    id: idText,
    name,
    imageUrl,
    type,
    kinds,
    hp: "none",
    types: [],
    weakness: "none",
    resistance: "none",
    retreat: "none",
    ability: [],
    attacks: [], 
    rules: [],
    support,
    packs,
    evolves: [],
    roles: [],
    archetypes: []
  };
}

async function main() {
  console.log('Starting Trainers card scraping...');
  const allCardUrls: string[] = [];

  for (let pg = 1; pg <= 80; pg++) {
    console.log(`Fetching Trainers search page ${pg}...`);
    const html = await fetchHTML(`${SEARCH_URL}${pg}`);
    if (!html) break;

    const dom = new JSDOM(html);
    const links = dom.window.document.querySelectorAll('.SearchResultList-box a');
    if (links.length === 0) break;

    links.forEach(a => {
      const href = a.getAttribute('href');
      if (href && href.includes('details.php')) {
        allCardUrls.push(`${DETAIL_BASE_URL}/card-search/${href.replace(/^\//, '')}`);
      }
    });
    await sleep(1000);
  }

  console.log(`Found ${allCardUrls.length} trainer card URLs.`);

  for (let i = 0; i < allCardUrls.length; i++) {
    const url = allCardUrls[i];
    console.log(`[${i + 1}/${allCardUrls.length}] Scraping ${url}...`);
    const html = await fetchHTML(url);
    if (!html) continue;

    const cardData = parseCardDetail(html, url);
    if (cardData) {
      // 書き込み時の競合を避けるため、毎回ファイルから最新を読み込む
      const currentMaster = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, 'utf-8'));
      const exists = currentMaster.exactMatches.some((m: any) => m.name === cardData.name && m.id === cardData.id);
      
      if (!exists) {
        currentMaster.exactMatches.push(cardData);
        fs.writeFileSync(MASTER_JSON_PATH, JSON.stringify(currentMaster, null, 2));
      }
    }
    await sleep(800);
  }

  console.log('Trainers scraping completed!');
}

main().catch(console.error);
