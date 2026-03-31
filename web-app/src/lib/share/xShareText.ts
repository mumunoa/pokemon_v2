import type { ShareScoreSummary, XShareTextVariant } from '@/types/monetization';

const MAX_X_SHARE_LENGTH = 120;
const TAGS = '#ポケカAI #ポケカ';

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
    `診断:${summary.deckName} ${summary.overallTier} 初動${setup}${rank ? ` ${rank}` : ''} ${TAGS}`,
    `${summary.deckName}は${summary.overallTier}評価。事故率${accident}。${TAGS}`,
    `${summary.deckName}の最善手:${summary.bestAction ?? '要確認'} ${TAGS}`,
    `${summary.deckName} 改善点:${summary.caution ?? '細部調整'} ${TAGS}`,
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
