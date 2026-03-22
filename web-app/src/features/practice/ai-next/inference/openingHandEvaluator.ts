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
  if (board.turn === 0 || (board.turn === 1 && !board.active)) {
    if (basicCountInHand === 0) {
      reason = '【引き直し（マリガン）】手札にバトル場へ出せる「たねポケモン」が存在しません。ルールに基づき手札をすべて山札に戻して引き直す必要があります。相手に追加ドローの選択権を与えてしまいますが、現状を変えられる機会と捉えましょう。';
    } else if (score >= 70) {
      reason = '【理想的な初期手札】ドローソースと盤面形成札が揃っています。理想盤面（システムポケモンの着地とアタッカーのエネ加速）を作る要求値を満たせます。相手のバトル場（アーキタイプ）を予測し、狩られにくい「たねポケモン」か、最悪倒されてもよい壁ポケモンをバトル場に出してください。';
    } else if (score >= 45) {
      reason = '【標準的な初期手札】最低限の展開は見込めますが、後続に不安が残ります。トップドローへの依存度を下げるため、バトル場には「逃げエネが軽い」「または倒されてもサイドレースに影響しにくい非ルール」のポケモンを置き、主力アタッカーはベンチで安全に育成することを優先しましょう。';
    } else {
      reason = '【事故リスク（ドロー欠損）】手札にドローサポートや展開札がなく、次ターンに「何もできない」危険性があります。この盤面で最も重要なのは「被弾を最小限にしてトップの解決札を待つ」ことです。倒されても良いポケモンを前に出し、手札のエネルギーやアイテムは安易に消費せず、ドローに繋がるカードを引いたときのリソースとして温存してください。';
    }
  } else {
    if (score >= 70) {
      reason = '【安定盤面】序盤の要求値をクリアしています。先攻なら次のターンの進化・手札干渉・攻撃準備を。後攻なら相手のシステムポケモンを早い段階で潰す（ボスの指令など）マクロ戦略を意識してください。';
    } else if (score >= 45) {
      reason = '【平均的盤面】展開は可能ですが、リソースに余裕がありません。山札圧縮（不要札サーチ）を優先してドローの質を高め、キーカードを引く確率の最大化に努めましょう。';
    } else {
      reason = '【致命的な手札事故】初動札が全くありません。無闇にカードを使って手札を減らすと、次の復帰ができなくなります。手札干渉サポートを引いた時のバリューを残すためにも、現状のリソースは温存してエンドし、相手の息切れや自分のトップ解決に賭けるのがプロのセオリーです。';
    }
  }

  return { score, stability, reason };
}
