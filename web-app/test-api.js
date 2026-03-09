const { JSDOM } = require('jsdom');

async function testScraper() {
  const deckCode = '5w5bVk-pL2Y6b-kwVkff'; // A sample deck code (usually looks something like this)
  const targetUrl = `https://www.pokemon-card.com/deck/confirm.html/deckID/${deckCode}/`;
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    console.log('Status:', response.status);
    const html = await response.text();
    
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // The official site stores grid items in tables with class .Deck_Grid
    const imageElements = document.querySelectorAll('.Deck_Grid_cards img, .Grid_item img');
    // If not found, just grab any img inside typical article or main
    const imgs = imageElements.length > 0 ? imageElements : document.querySelectorAll('img');
    
    const cardMap = new Map();

    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      const alt = img.getAttribute('alt');
      
      if (src && src.includes('/assets/images/card_images/')) {
        const fullUrl = src.startsWith('http') ? src : `https://www.pokemon-card.com${src}`;
        
        let type = 'unknown';
        if (alt?.includes('エネルギー')) type = 'energy';
        else if (alt?.includes('サポート') || alt?.includes('グッズ') || alt?.includes('スタジアム') || alt?.includes('ポケモンのどうぐ')) type = 'trainer';
        else type = 'pokemon';

        if (cardMap.has(fullUrl)) {
          cardMap.get(fullUrl).count += 1;
        } else {
          cardMap.set(fullUrl, {
            id: src.split('/').pop().split('.')[0],
            name: alt || '不明なカード',
            imageUrl: fullUrl,
            count: 1,
            type
          });
        }
      }
    });

    console.log(`Found ${cardMap.size} unique cards.`);
    const deckList = Array.from(cardMap.values());
    console.log(deckList.slice(0, 3)); // Output first 3 for inspection
  } catch (err) {
    console.error(err);
  }
}

testScraper();
