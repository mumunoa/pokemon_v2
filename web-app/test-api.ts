import { JSDOM } from 'jsdom';

async function testScraper() {
  const deckCode = 'b5bbFf-3PpSPP-kVVkVV'; 
  const targetUrl = `https://www.pokemon-card.com/deck/confirm.html/deckID/${deckCode}/`;
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // The problem with official pokemon card site is that the actual deck list 
    // is rendered out via javascript arrays `articleDeck.Pokemon`, `articleDeck.Trainer` etc.
    // They inject it inside a <script> tag.
    
    const scripts = document.querySelectorAll('script');
    let targetScriptText = '';
    
    scripts.forEach(script => {
      if (script.textContent && script.textContent.includes('articleDeck = {}')) {
        targetScriptText = script.textContent;
      }
    });

    if (targetScriptText) {
      console.log("Found the deck data script. Extracting JSON data...");
      
      // Let's use simple regex or string manipulation to extract the data array
      const matches = [...targetScriptText.matchAll(/articleDeck\.([a-zA-Z]+)\s*=\s*(\[.*?\]);/gs)];
      const deckMap = new Map();
      
      matches.forEach(match => {
        const category = match[1]; // Pokemon, Goods, Support, Stadium, Energy
        const jsonStr = match[2].replace(/'/g, '"'); // Dirty JSON fix
        
        try {
          // It's not pure JSON, it has unquoted keys. Let's write a safer regex parser for it.
          // Format usually: [{id: 'abc', name: 'xyz', count: 4, src: '...'}...]
        } catch(e) { }
      });
    }

    // Attempt 2: There's usually a hidden input table that is parsed.
    const pcView = document.getElementById('deck_pccard');
    if (pcView) {
      console.log("Found deck_pccard view");
      const imgs = pcView.querySelectorAll('img');
      console.log(`Images inside deck_pccard: ${imgs.length}`);
    } else {
      console.log("deck_pccard not found");
      
      // Attempt 3: Let's extract from the table rows which hold text list of the cards
      const trs = document.querySelectorAll('.Deck_List_box tbody tr');
      console.log(`Found ${trs.length} text list rows`);
      
      let count = 0;
      trs.forEach(tr => {
         // This is the most reliable way to get EXACT counts if the grid doesn't load
         const nameEl = tr.querySelector('.card_name');
         const numEl = tr.querySelector('.num span');
         
         if (nameEl && numEl) {
           const typeClass = nameEl.getAttribute('class') || '';
           let type = 'pokemon';
           if (typeClass.includes('Trainerc_pCard_Name')) type = 'trainer';
           if (typeClass.includes('Energy_pCard_Name')) type = 'energy';
           
           const name = nameEl.textContent?.trim() || '';
           const numStr = numEl.textContent?.trim() || '1';
           const num = parseInt(numStr.replace(/[^0-9]/g, ''), 10);
           
           // We need the image url, we can reconstruct it from the link or regex the js
           const link = tr.getAttribute('onclick');
           let imgUrl = '';
           if (link) {
             const m = link.match(/openPopupCard\('([a-zA-Z0-9_]+)'\)/);
             if (m && m[1]) {
                // Approximate image url based on id - not perfect
                imgUrl = `https://www.pokemon-card.com/assets/images/card_images/large/${m[1]}.jpg`;
             }
           }
           
           count += num;
           console.log(`- ${name} x${num} (${type})`);
         }
      });
      console.log(`Total Text Cards: ${count}`);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testScraper();
