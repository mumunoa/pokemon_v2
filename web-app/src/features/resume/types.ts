export type PlayStyle = 'beginner' | 'enjoy' | 'serious' | 'collection';
export type Regulation = 'standard' | 'extra' | 'hall';
export type RequestItem = 'battle' | 'tournament' | 'chat' | 'advice' | 'youtube' | 'blog' | 'event' | 'remote';
export type EnergyType = 'grass' | 'fire' | 'water' | 'lightning' | 'psychic' | 'fighting' | 'darkness' | 'metal' | 'dragon' | 'colorless' | 'fairy';

export interface ResumeData {
  trainerName: string;
  region: string;
  history: string;
  playStyles: PlayStyle[];
  regulations: Regulation[];
  requests: RequestItem[];
  favoriteTypes: EnergyType[];
  favoriteDeck: string;
  freeSpace: string;
  pokemonImage?: string; // Data URL
  template: 'sar' | 'pokedex';
}

export const PLAY_STYLE_LABELS: Record<PlayStyle, string> = {
  beginner: '初心者',
  enjoy: 'エンジョイ',
  serious: '真剣勝負',
  collection: 'コレクション',
};

export const REGULATION_LABELS: Record<Regulation, string> = {
  standard: 'スタンダード',
  extra: 'エクストラ',
  hall: '殿堂',
};

export const REQUEST_ITEM_LABELS: Record<RequestItem, string> = {
  battle: '対戦したい',
  tournament: '大会に参加したい',
  chat: '雑談したい',
  advice: 'アドバイスがほしい',
  youtube: 'Youtubeやってます',
  blog: 'ブログやってます',
  event: '交流会開催します',
  remote: 'リモート対戦できます',
};

export const ENERGY_TYPE_NAMES: Record<EnergyType, string> = {
  grass: '草',
  fire: '炎',
  water: '水',
  lightning: '雷',
  psychic: '超',
  fighting: '闘',
  darkness: '悪',
  metal: '鋼',
  dragon: '龍',
  colorless: '無',
  fairy: 'フェアリー',
};
