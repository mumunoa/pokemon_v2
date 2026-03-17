
import { CardInstance } from '@/types/game';

/**
 * Text processing utilities for AI inference.
 */

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
}

export type SectionInferenceInput = {
    cardId: string;
    cardName: string;
    text: string;
    source: "ability" | "support" | "rule" | "attack" | "energy";
};

export function getSectionTexts(card: any): SectionInferenceInput[] {
    const sections: SectionInferenceInput[] = [];
    const cardId = card.id || card.cardId || 'unknown';
    const cardName = card.name || 'unknown';

    if (Array.isArray(card.ability)) {
        card.ability.forEach((a: any) => {
            if (a.text) sections.push({ cardId, cardName, text: a.text, source: "ability" });
        });
    }

    if (Array.isArray(card.support)) {
        card.support.forEach((s: any) => {
            if (s.text) sections.push({ cardId, cardName, text: s.text, source: "support" });
        });
    }

    if (Array.isArray(card.rules)) {
        card.rules.forEach((r: any) => {
            if (r.text) sections.push({ cardId, cardName, text: r.text, source: "rule" });
        });
    }

    if (Array.isArray(card.attacks)) {
        card.attacks.forEach((a: any) => {
            if (a.text) sections.push({ cardId, cardName, text: a.text, source: "attack" });
        });
    }

    if (Array.isArray(card.energy)) {
        card.energy.forEach((e: any) => {
            if (e.text) sections.push({ cardId, cardName, text: e.text, source: "energy" });
        });
    }

    return sections;
}
