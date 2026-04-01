import type {
  AddOnDefinition,
  AddOnId,
  EntitlementMap,
  PublicPlanDefinition,
  UserEntitlementSnapshot,
} from '@/types/monetization';

export const PUBLIC_PLANS: PublicPlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPriceJpy: 0,
    description: '無料で一人回しとAI診断を試せる入口プラン',
    features: ['1日3回までのAI分析', '広告付き', '基本診断のみ'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPriceJpy: 980,
    description: '本格的に勝ちを目指すプレイヤー向け',
    features: ['高度なAI分析', '広告なし', '詳細理由の表示'],
    recommended: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    monthlyPriceJpy: 1980,
    description: '競技シーンで頂点を目指すエリート向け',
    features: ['高度分析', '無制限AI分析', 'ログ巻き戻し', '将来の優先推論枠'],
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
