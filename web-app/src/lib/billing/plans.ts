import type {
  AddOnDefinition,
  AddOnId,
  EntitlementMap,
  PublicPlanDefinition,
  UserEntitlementSnapshot,
} from '@/types/monetization';

export const STRIPE_PRICE_TO_PLAN: Record<string, 'pro' | 'elite'> = {
  // --- Pro プラン ---
  'price_1TItAmKijbObeM6VVUSzLCKU': 'pro', // 480円 (リリース記念)
  'price_1TItAnKijbObeM6VCsvA6aDt': 'pro', // 980円 (通常価格)

  // --- Elite プラン ---
  'price_1TItAmKijbObeM6V8Sd04fMO': 'elite', // 1480円
};

export const PUBLIC_PLANS: PublicPlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPriceJpy: 0,
    description: '無料で一人回しとAI診断を試せる入口プラン',
    features: ['1日3回までのAI分析', '広告表示', '基本診断のみ'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPriceJpy: 480,
    description: '【リリース記念】高度な分析とアドバイスをお手軽価格で',
    features: ['高度なAI分析（詳細な理由解説）', '広告なし', '相手の手札推測・リスク予測', '全てのカード背面に公式画像を使用'],
    recommended: true,
    stripePriceId: 'price_1TItAmKijbObeM6VVUSzLCKU', // 現在の UI に表示する ID
  },
  {
    id: 'elite',
    name: 'Elite',
    monthlyPriceJpy: 1480,
    description: '競技シーンで頂点を目指すエリート向け、無制限の分析環境',
    features: ['高度分析が無制限', '全AI人格が使い放題', '先行アップデートへのアクセス', 'ログ高速巻き戻し'],
    stripePriceId: 'price_1TItAmKijbObeM6V8Sd04fMO',
  },
];

export const ADD_ONS: AddOnDefinition[] = [
  {
    id: 'pro_ai_default',
    name: 'Pro AI / Standard',
    monthlyPriceJpy: 500,
    description: '標準的なプロ視点',
    includedEntitlements: ['coach.pro_persona.default'],
  },
  {
    id: 'pro_ai_aggressive',
    name: 'Pro AI / Aggressive',
    monthlyPriceJpy: 500,
    description: '攻め重視の判断傾向',
    includedEntitlements: ['coach.pro_persona.aggressive'],
  },
  {
    id: 'pro_ai_conservative',
    name: 'Pro AI / Conservative',
    monthlyPriceJpy: 500,
    description: '安定択重視の判断傾向',
    includedEntitlements: ['coach.pro_persona.conservative'],
  },
  {
    id: 'pro_ai_tournament',
    name: 'Pro AI / Tournament',
    monthlyPriceJpy: 700,
    description: 'BO3・スイスを意識した競技寄り視点',
    includedEntitlements: ['coach.pro_persona.tournament'],
  },
];

export function buildEntitlements(params: {
  legacyPlanType: 'free' | 'pro' | 'elite';
  addOns?: AddOnId[];
}): UserEntitlementSnapshot {
  const addOns = params.addOns ?? [];

  const entitlements: EntitlementMap = {
    'analysis.daily.free': true,
  };

  if (params.legacyPlanType === 'pro' || params.legacyPlanType === 'elite') {
    entitlements['analysis.advanced'] = true;
    entitlements['analysis.no_ads'] = true;
    entitlements['coach.log_replay'] = true;
  }

  if (params.legacyPlanType === 'elite') {
    entitlements['analysis.unlimited'] = true;
  }

  for (const addOnId of addOns) {
    const addOn = ADD_ONS.find((item) => item.id === addOnId);
    addOn?.includedEntitlements.forEach((key) => {
      entitlements[key] = true;
    });
  }

  return {
    legacyPlanType: params.legacyPlanType,
    addOns,
    entitlements,
    aiTickets: 0,
    isProLike: params.legacyPlanType === 'pro' || params.legacyPlanType === 'elite',
  };
}
