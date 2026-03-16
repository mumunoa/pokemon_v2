import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// ポケモン専用の検索URL
const SEARCH_URL = 'https://www.pokemon-card.com/card-search/index.php?keyword=&se_ta=pokemon&regulation_sidebar_form=XY&sc_hp_s=&sc_hp_e=&sc_run_away_s=0&sc_run_away_e=&pg=';
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

  let type = 'pokemon';
  let kinds = 'basic';
  const topInfo = rightBoxInner.querySelector('.TopInfo.Text-fjalla');
  const typeText = topInfo?.querySelector('.type')?.textContent?.trim() || '';

  if (typeText.includes('たね')) {
    type = 'pokemon';
    kinds = 'basic';
  } else if (typeText.includes('1進化')) {
    type = 'pokemon';
    kinds = 'stage1';
  } else if (typeText.includes('2進化')) {
    type = 'pokemon';
    kinds = 'stage2';
  }

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
          for (const [key, value] of Object.entries(TYPE_MAP)) {
            if (icon.classList.contains(key)) cost.push(value);
          }
        });
        const damage = next.querySelector('.f_right.Text-fjalla')?.textContent?.trim() || 'none';
        let text = '';
        if (next.nextElementSibling?.tagName === 'P') {
          text = next.nextElementSibling.textContent?.trim() || '';
        }
        attacks.push({ name, cost, convertedEnergyCost: cost.length, damage, text });
      }
      next = next.nextElementSibling;
    }
  });

  const rules: any[] = [];
  const rulesH2 = Array.from(doc.querySelectorAll('h2.mt20')).find(h2 => h2.textContent?.includes('特別なルール'));
  if (rulesH2) {
    const text = rulesH2.nextElementSibling?.tagName === 'P' ? rulesH2.nextElementSibling.textContent?.trim() : '';
    if (text) {
      const prizeMatch = text.match(/サイドを(\d+)枚とる/);
      rules.push({ text, prize: prizeMatch ? prizeMatch[1] : "1" });
    }
  }

  const packs: any[] = [];
  doc.querySelectorAll('.PopupSub .List .List_item').forEach(item => {
    packs.push({ pack1: item.textContent?.trim() || '' });
  });

  const table = rightBoxInner.querySelector('table');
  let weakness = 'none';
  let resistance = 'none';
  let retreat = 'none';
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

  return {
    id: idText, name, imageUrl, type, kinds, hp, types, weakness, resistance, retreat,
    ability: abilities, attacks, rules, support: [], packs, evolves, roles: [], archetypes: []
  };
}

async function main() {
  console.log('Starting Pokemon card scraping...');
  const allCardUrls: string[] = [];

  for (let pg = 1; pg <= 80; pg++) {
    console.log(`Fetching Pokemon page ${pg}...`);
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

  for (let i = 0; i < allCardUrls.length; i++) {
    const url = allCardUrls[i];
    console.log(`[${i + 1}/${allCardUrls.length}] Scraping ${url}...`);
    const html = await fetchHTML(url);
    if (!html) continue;

    const cardData = parseCardDetail(html, url);
    if (cardData) {
      const currentMaster = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, 'utf-8'));
      const exists = currentMaster.exactMatches.some((m: any) => m.name === cardData.name && m.id === cardData.id);
      if (!exists) {
        currentMaster.exactMatches.push(cardData);
        fs.writeFileSync(MASTER_JSON_PATH, JSON.stringify(currentMaster, null, 2));
      }
    }
    await sleep(800);
  }
}

main().catch(console.error);
