
import { 
    StaticRole, 
    RoleEvidence, 
    RoleEvidenceSource, 
    CardRoleProfile,
    SectionInferenceInput 
} from '../domain/types';
import { normalizeText } from '../utils/text';

/**
 * Section-based role inference engine.
 * Refined for Ability, Support, and Attack specific rules.
 */

type SectionInferenceResult = {
    roles: StaticRole[];
    evidence: RoleEvidence[];
};

export const ROLE_VERSION = "2026.03.17";

function includesAny(target: string, patterns: string[]): boolean {
    const normalized = normalizeText(target);
    return patterns.some(p => normalized.includes(normalizeText(p)));
}

export function inferRolesFromSection(input: SectionInferenceInput): SectionInferenceResult {
    const roles: StaticRole[] = [];
    const evidence: RoleEvidence[] = [];
    const text = input.text;

    // --- Ability Rules ---
    if (input.source === "ability") {
        // Draw Ability (e.g., Mew ex, Charizard ex [pidgeot line], Kirlia)
        if (includesAny(text, ["自分の番に1回", "使える", "1回使える"]) && 
            includesAny(text, ["引く", "枚になるように", "山札の上から"])) {
            roles.push("draw", "consistency");
            evidence.push({
                role: "draw",
                source: "ability",
                matchedText: text,
                reason: "特性による手札補充・ドローエンジン",
                confidence: 0.95
            });
        }

        // Search Ability
        if (includesAny(text, ["自分の番に1回", "使える"]) && 
            includesAny(text, ["山札から", "選ぶ", "加える", "ベンチに出す"])) {
            roles.push("search", "consistency");
            if (includesAny(text, ["たねポケモン"])) roles.push("basic_search", "bench_setup");
            if (includesAny(text, ["進化"])) roles.push("evolution_search");
            
            evidence.push({
                role: "search",
                source: "ability",
                matchedText: text,
                reason: "特性によるサーチ展開",
                confidence: 0.92
            });
        }

        // Energy Accel Ability
        if (includesAny(text, ["エネルギーをつける", "加速", "自分のポケモンに"])) {
            roles.push("energy_accel");
            evidence.push({
                role: "energy_accel",
                source: "ability",
                matchedText: text,
                reason: "特性によるエネルギー加速",
                confidence: 0.90
            });
        }

        // Gust Ability
        if (includesAny(text, ["ベンチポケモンをバトル場に", "入れ替える"])) {
            roles.push("gust");
            evidence.push({
                role: "gust",
                source: "ability",
                matchedText: text,
                reason: "特性による呼び出し（Gust効果）",
                confidence: 0.94
            });
        }

        // Disruption / Lock Ability
        if (includesAny(text, ["使えない", "受けない", "できない", "戻す"])) {
            roles.push("disrupt", "stall");
            evidence.push({
                role: "disrupt",
                source: "ability",
                matchedText: text,
                reason: "特性による妨害・ロック・防御的効果",
                confidence: 0.85
            });
        }
    }

    // --- Support (Trainer) Rules ---
    if (input.source === "support") {
        if (includesAny(text, ["引く", "枚になるように", "戻して"])) {
            roles.push("draw", "consistency");
            evidence.push({
                role: "draw",
                source: "support",
                matchedText: text,
                reason: "サポートによるドロー・手札更新",
                confidence: 0.98
            });
        }

        if (includesAny(text, ["山札から", "手札に加える", "選んで", "持ってくる"])) {
            roles.push("search", "consistency");
            if (includesAny(text, ["たね", "HPが"])) roles.push("basic_search", "bench_setup");
            if (includesAny(text, ["進化"])) roles.push("evolution_search");
            if (includesAny(text, ["エネルギー"])) roles.push("energy_search");
            
            evidence.push({
                role: "search",
                source: "support",
                matchedText: text,
                reason: "サポートによる山札サーチ",
                confidence: 0.98
            });
        }

        if (includesAny(text, ["ベンチポケモンをバトル場に", "入れ替える"])) {
            roles.push("gust");
            evidence.push({
                role: "gust",
                source: "support",
                matchedText: text,
                reason: "サポートによる強制交代・キャッチャー効果",
                confidence: 0.99
            });
        }
    }

    // --- Attack Rules ---
    if (input.source === "attack") {
        // High Damage Attacker
        if (includesAny(text, ["ダメージを追加", "大ダメージ", "きぜつ"]) || /\d{2,3}\+/.test(text)) {
            roles.push("main_attacker");
            evidence.push({
                role: "main_attacker",
                source: "attack",
                matchedText: text,
                reason: "ワザのダメージ性能によるアタッカー判定",
                confidence: 0.88
            });
        }

        // Secondary Effects
        if (includesAny(text, ["エネルギーをつける", "ベンチに", "つける"])) {
            roles.push("energy_accel");
        }
        if (includesAny(text, ["山札から", "ベンチに", "出す"])) {
            roles.push("bench_setup");
        }
        if (includesAny(text, ["どく", "まひ", "こんらん", "ねむり", "やけど"])) {
            roles.push("disrupt", "stall");
        }
    }

    // --- Rule Rules ---
    if (input.source === "rule") {
        if (includesAny(text, ["ACE SPEC"])) {
            evidence.push({
                role: "key_item",
                source: "rule",
                matchedText: text,
                reason: "ACE SPECカード",
                confidence: 1.0
            });
        }
        if (includesAny(text, ["exのルール", "きぜつしたとき", "サイドを2枚"])) {
            evidence.push({
                role: "two_prize",
                source: "rule",
                matchedText: text,
                reason: "ルールを持つポケモン(ex等)",
                confidence: 1.0
            });
        }
    }

    return { roles, evidence };
}

export function createRoleProfile(card: any, sections: SectionInferenceInput[]): CardRoleProfile {
    const allRolesSet = new Set<StaticRole>();
    const allEvidence: RoleEvidence[] = [];

    sections.forEach(s => {
        const result = inferRolesFromSection(s);
        result.roles.forEach(r => allRolesSet.add(r));
        allEvidence.push(...result.evidence);
    });

    // Heuristics based on card metadata
    if (card.type === 'pokemon') {
        if (card.kinds === 'basic') allRolesSet.add('basic_pokemon');
        if (card.kinds?.includes('stage')) allRolesSet.add('evolution_pokemon');
        
        // HP based attacker check
        const hpVal = parseInt(String(card.hp || '0'), 10);
        if (hpVal >= 250 || (card.kinds === 'basic' && hpVal >= 200)) {
            allRolesSet.add('main_attacker');
        }
    }

    if (card.type === 'energy') {
        allRolesSet.add('consistency'); // Energies are needed for consistency
    }

    const staticRoles = Array.from(allRolesSet);

    return {
        cardId: card.id || card.cardId || 'unknown',
        cardName: card.name || 'unknown',
        staticRoles,
        deckRoles: [],
        dynamicRoles: [],
        keyScore: 0,
        labels: [],
        reasons: allEvidence.map(e => e.reason),
        confidence: allEvidence.length > 0 ? (allEvidence.reduce((sum, e) => sum + e.confidence, 0) / allEvidence.length) : 0.5,
        evidence: allEvidence,
        inferredAt: new Date().toISOString(),
        version: ROLE_VERSION
    };
}
