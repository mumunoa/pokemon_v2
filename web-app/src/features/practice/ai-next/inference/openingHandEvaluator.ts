import { BoardState, CardRoleProfile } from '../domain/types';

export type OpeningEvaluation = {
  score: number; // 0-100
  stability: 'stable' | 'average' | 'risky';
  reason: string;
};

/**
 * Evaluate the quality of the starting hand (Turn 1).
 */
export function evaluateOpeningHand(board: BoardState, profiles: CardRoleProfile[]): OpeningEvaluation {
  const handProfiles = board.hand.map(name => profiles.find(p => p.cardName === name)).filter(Boolean) as CardRoleProfile[];
  
  const hasBasicSearch = handProfiles.some(p => p.staticRoles.includes('basic_search' as any) || p.staticRoles.includes('pokemon_search' as any));
  const hasDrawSupporter = handProfiles.some(p => p.staticRoles.includes('draw' as any) || p.staticRoles.includes('hand_refresh' as any));
  const basicCountInHand = handProfiles.filter(p => p.staticRoles.includes('basic_pokemon' as any)).length;
  const energyCount = handProfiles.filter(p => p.staticRoles.includes('energy_search' as any) || p.cardName.includes('エネルギー')).length;

  let score = 30; // base score
  if (basicCountInHand >= 2) score += 20;
  if (hasBasicSearch) score += 25;
  if (hasDrawSupporter) score += 25;
  if (energyCount >= 1) score += 10;
  
  // Penalty for too many energies or no basics at all (though rule usually handles this)
  if (basicCountInHand === 0) score = 0;

  let stability: 'stable' | 'average' | 'risky' = 'risky';
  if (score >= 70) stability = 'stable';
  else if (score >= 45) stability = 'average';

  let reason = '';
  if (score >= 70) reason = '理想的な手札です。盤面展開とドローソースの両方が揃っています。';
  else if (score >= 45) reason = '標準的な手札です。最低限の展開は見込めます。';
  else reason = '事故のリスクがある手札です。ドローソースが不足しています。';

  return { score, stability, reason };
}
