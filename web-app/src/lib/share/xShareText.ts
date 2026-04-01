import type { ShareScoreSummary, XShareTextVariant } from '@/types/monetization';

const MAX_X_SHARE_LENGTH = 120;
const TAGS = '#ポケカAI #ポケカ';
const APP_URL = 'https://poke-ai.app'; // または適切な URL

function compactPercent(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return `${Math.round(value)}%`;
}

function compactRank(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return `上位${Math.max(1, Math.round(value))}%`;
}

function trimToLength(text: string, limit = MAX_X_SHARE_LENGTH) {
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1))}…`;
}

export function createXShareTextVariants(summary: ShareScoreSummary): XShareTextVariant[] {
  const rank = compactRank(summary.environmentRankPercent);
  const setup = compactPercent(summary.setupRate);
  const accident = compactPercent(summary.accidentRate);

  const candidates = [
    `【ポケカAI診断】${summary.deckName}の結果は${summary.overallTier}評価！🎯 初動安定率は${setup}でした。1,000回の一人回し分析を今すぐチェック⚡️ ${APP_URL} ${TAGS}`,
    `${summary.deckName}をAIが徹底分析！${summary.overallTier}評価（上位${rank}）を獲得。事故率${accident}を克服するヒントはこちら 💡 ${APP_URL} ${TAGS}`,
  ];

  const ids: XShareTextVariant['id'][] = ['flex', 'strong', 'cta', 'warning'];

  return candidates.map((text, index) => {
    const normalized = trimToLength(text);
    return {
      id: ids[index],
      text: normalized,
      length: normalized.length,
    };
  });
}

export function pickBestShareText(summary: ShareScoreSummary): XShareTextVariant {
  const variants = createXShareTextVariants(summary);

  const sorted = [...variants].sort((a, b) => {
    const aScore = Number(a.length <= MAX_X_SHARE_LENGTH) * 1000 - a.length;
    const bScore = Number(b.length <= MAX_X_SHARE_LENGTH) * 1000 - b.length;
    return bScore - aScore;
  });

  return sorted[0];
}
