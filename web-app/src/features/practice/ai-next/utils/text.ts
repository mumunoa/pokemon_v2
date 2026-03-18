import { CardInstance } from '@/types/game';
import { SectionInferenceInput } from '../domain/types';

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

export function includesAny(text: string, patterns: string[]): boolean {
  const normalized = normalizeText(text);
  return patterns.some((pattern) => normalized.includes(normalizeText(pattern)));
}

export function includesAll(text: string, patterns: string[]): boolean {
  const normalized = normalizeText(text);
  return patterns.every((pattern) => normalized.includes(normalizeText(pattern)));
}

export function parseRetreatValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const digits = String(value).replace(/[^0-9]/g, '');
  if (!digits) return null;
  return Number(digits);
}

export function uniqueItems<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function getSectionTexts(card: any): SectionInferenceInput[] {
  const sections: SectionInferenceInput[] = [];
  const cardId = card.id || card.cardId || 'unknown';
  const cardName = card.name || 'unknown';

  if (Array.isArray(card.ability)) {
    card.ability.forEach((a: any) => {
      if (a.text) sections.push({ cardId, cardName, text: a.text, source: 'ability' });
    });
  }

  if (Array.isArray(card.support)) {
    card.support.forEach((s: any) => {
      if (s.text) sections.push({ cardId, cardName, text: s.text, source: 'support' });
    });
  }

  if (Array.isArray(card.rules)) {
    card.rules.forEach((r: any) => {
      if (r.text) sections.push({ cardId, cardName, text: r.text, source: 'rule' });
    });
  }

  if (Array.isArray(card.attacks)) {
    card.attacks.forEach((a: any) => {
      if (a.text) sections.push({ cardId, cardName, text: a.text, source: 'attack' });
    });
  }

  if (Array.isArray(card.energy)) {
    card.energy.forEach((e: any) => {
      if (e.text) sections.push({ cardId, cardName, text: e.text, source: 'energy' });
    });
  }

  return sections;
}

export function getMergedCardText(card: any): string {
  return getSectionTexts(card)
    .map((section) => section.text)
    .filter(Boolean)
    .join('\n');
}
