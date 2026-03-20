import { NextResponse } from 'next/server';
import { CardKind } from '@/types/game';

// The URL structure for official Pokemon card decks in Japan
const POKEMON_DECK_URL = 'https://www.pokemon-card.com/deck/confirm.html/deckID';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const deckCode = searchParams.get('code');

    if (!deckCode || deckCode.trim() === '') {
        return NextResponse.json({ error: 'デッキコードが指定されていません' }, { status: 400 });
    }

    try {
        // 1. Fetch the official deck page
        const targetUrl = `${POKEMON_DECK_URL}/${deckCode}/`;
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'デッキが見つかりません。コードを確認してください。' }, { status: 404 });
            }
            throw new Error(`Failed to fetch deck page: ${response.status}`);
        }

        const html = await response.text();

        // 2. Parse HTML
        // Metadata is in `PCGDECK.searchItemName` and `PCGDECK.searchItemCardPict`
        // Deck composition is in hidden inputs: deck_pke, deck_gds, deck_sup, deck_sta, deck_tm, deck_ene

        const deckList: Array<{
            id: string;
            no?: string;
            name: string;
            imageUrl: string;
            count: number;
            type: string;
            kinds?: CardKind;
            hp?: number;
        }> = [];

        // Extract PCGDECK.searchItemName map (individual assignments)
        const nameMap: Record<string, string> = {};
        const imageMap: Record<string, string> = {};

        const nameEntries = html.matchAll(/PCGDECK\.searchItemName\[['"]?(\d+)['"]?\]\s*=\s*['"](.*?)['"];/g);
        for (const entry of nameEntries) {
            nameMap[entry[1]] = entry[2];
        }

        const imageEntries = html.matchAll(/PCGDECK\.searchItemCardPict\[['"]?(\d+)['"]?\]\s*=\s*['"](.*?)['"];/g);
        for (const entry of imageEntries) {
            const relUrl = entry[2];
            imageMap[entry[1]] = relUrl.startsWith('http') ? relUrl : `https://www.pokemon-card.com${relUrl}`;
        }

        const nameMatchCount = Object.keys(nameMap).length;

        // 隠しフィールドの解析用ヘルパー
        const parseInput = (inputName: string, type: string, kind: CardKind) => {
            // 属性の順序に依存しないロジック
            const regex = new RegExp(`<input[^>]*name="${inputName}"[^>]*value="([^"]*)"`, 'i');
            const match = html.match(regex);
            if (match && match[1]) {
                const pairs = match[1].split('-');
                for (const pair of pairs) {
                    if (!pair) continue;
                    // ID_枚数_バージョン（例: 42168_3_1）
                    const cleanPair = pair.replace('.', '_');
                    const [id, countStr] = cleanPair.split('_');

                    if (id && countStr) {
                        const count = parseInt(countStr, 10);
                        let name = nameMap[id] || `Unknown (${id})`;
                        const imageUrl = imageMap[id] || `https://www.pokemon-card.com/assets/images/card_images/large/${id}.jpg`;

                        let cardKind = kind;
                        if (type === 'pokemon') {
                            if (name.includes('ex') || name.includes('V') || name.includes('GX') || name.includes('VSTAR') || name.includes('VMAX')) {
                                cardKind = 'has_rule';
                            }
                        } else if (type === 'energy') {
                            if (name.includes('草')) cardKind = 'grass';
                            else if (name.includes('炎')) cardKind = 'fire';
                            else if (name.includes('水')) cardKind = 'water';
                            else if (name.includes('雷')) cardKind = 'lightning';
                            else if (name.includes('超')) cardKind = 'psychic';
                            else if (name.includes('闘')) cardKind = 'fighting';
                            else if (name.includes('悪')) cardKind = 'darkness';
                            else if (name.includes('鋼')) cardKind = 'metal';
                            else if (name.includes('ドラゴン')) cardKind = 'dragon';
                        }

                        deckList.push({
                            id,
                            name,
                            imageUrl,
                            count,
                            type,
                            kinds: cardKind
                        });
                    }
                }
            }
        };

        const categories = [
            { id: 'deck_pke', type: 'pokemon', kind: 'non_rule' as CardKind }, // ポケモン
            { id: 'deck_gds', type: 'trainer', kind: 'item' as CardKind },    // グッズ
            { id: 'deck_tool', type: 'trainer', kind: 'tool' as CardKind },   // ポケモンのどうぐ
            { id: 'deck_sup', type: 'trainer', kind: 'supporter' as CardKind }, // サポート
            { id: 'deck_sta', type: 'trainer', kind: 'stadium' as CardKind },   // スタジアム
            { id: 'deck_ene', type: 'energy', kind: 'colorless' as CardKind }, // エネルギー
            { id: 'deck_tech', type: 'trainer', kind: 'item' as CardKind },   // 特殊なグッズ等
            { id: 'deck_ajs', type: 'trainer', kind: 'item' as CardKind }     // その他
        ];

        for (const cat of categories) {
            parseInput(cat.id, cat.type, cat.kind);
        }

        // 3. Enrich with Supabase data
        const uniqueIds = Array.from(new Set(deckList.map(c => c.id)));
        const { supabase } = await import('@/lib/supabase');
        let supabaseDebug = { queried: false, error: null as string | null, resultCount: 0 };
        
        if (supabase && uniqueIds.length > 0) {
            supabaseDebug.queried = true;
            const { data: dbCards, error: dbError } = await supabase
                .from('cards')
                .select('*')
                .in('id', uniqueIds);

            supabaseDebug.error = dbError ? dbError.message : null;
            supabaseDebug.resultCount = dbCards ? dbCards.length : 0;
            console.log(`[Deck Route Debug] Querying Supabase IDs:`, uniqueIds.slice(0, 5), `... (${uniqueIds.length} total)`);
            console.log(`[Deck Route Debug] Supabase Result: Count=${supabaseDebug.resultCount}, Error=${supabaseDebug.error}`);

            if (!dbError && dbCards) {
                // Map DB data back to the deck list
                const dbMap: Record<string, any> = {};
                dbCards.forEach(card => {
                    dbMap[card.id] = card;
                });

                deckList.forEach(card => {
                    const dbData = dbMap[card.id];
                    if (dbData) {
                        card.name = dbData.name || card.name;
                        card.no = dbData.no;
                        card.imageUrl = dbData.image_url || card.imageUrl;
                        card.hp = dbData.hp !== 'none' ? parseInt(dbData.hp, 10) : undefined;
                        // kinds may be more accurate in DB
                        if (dbData.kinds) {
                            card.kinds = dbData.kinds;
                        }
                        // Add all extra fields
                        (card as any).types = dbData.types;
                        (card as any).weakness = dbData.weakness;
                        (card as any).resistance = dbData.resistance;
                        (card as any).retreat = dbData.retreat;
                        (card as any).ability = dbData.ability;
                        (card as any).attacks = dbData.attacks;
                        (card as any).rules = dbData.rules;
                        (card as any).energy = dbData.energy;
                        (card as any).support = dbData.support;
                        (card as any).evolves = dbData.evolves;
                        (card as any).roles = dbData.roles;
                        (card as any).archetypes = dbData.archetypes;
                    }
                });
            }
        }

        if (deckList.length === 0) {
            return NextResponse.json({
                error: 'デッキデータの解析に失敗しました。公式仕様が変更された可能性があります。',
                debug: {
                    htmlLength: html.length,
                    hasPcgDeck: html.includes('PCGDECK'),
                    hasPke: html.includes('name="deck_pke"'),
                    nameMatchCount
                }
            }, { status: 422 });
        }

        return NextResponse.json({
            deckCode,
            totalCards: deckList.reduce((sum, card) => sum + card.count, 0),
            cards: deckList,
            supabaseDebug
        });

    } catch (error: any) {
        console.error('Deck scraper error:', error.message);
        return NextResponse.json({ error: 'デッキのインポート中にサーバーエラーが発生しました。' }, { status: 500 });
    }
}
