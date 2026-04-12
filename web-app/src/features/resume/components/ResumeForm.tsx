"use client";

import React from 'react';
import { 
  ResumeData, 
  PLAY_STYLE_LABELS, 
  REGULATION_LABELS, 
  REQUEST_ITEM_LABELS, 
  ENERGY_TYPE_NAMES,
  PlayStyle,
  Regulation,
  RequestItem,
  EnergyType
} from '../types';
import { EnergyIcon } from '../assets/EnergyIcons';

interface Props {
  data: ResumeData;
  onUpdate: (updates: Partial<ResumeData>) => void;
}

export const ResumeForm: React.FC<Props> = ({ data, onUpdate }) => {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ pokemonImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleItem = <T extends string>(list: T[], item: T, key: keyof ResumeData) => {
    const newList = list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item];
    onUpdate({ [key]: newList });
  };

  return (
    <div className="space-y-10">
      {/* Template Selection */}
      <section className="space-y-4">
        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">TEMPLATE / デザイン選択</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onUpdate({ template: 'pokedex' })}
            className={`py-3 px-4 rounded-xl border-2 transition-all font-bold ${data.template === 'pokedex' ? 'border-red-500 bg-red-500/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
          >
            図鑑風 (2D Clean)
          </button>
          <button
            onClick={() => onUpdate({ template: 'sar' })}
            className={`py-3 px-4 rounded-xl border-2 transition-all font-bold ${data.template === 'sar' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
          >
            SAR風 (Vibrant)
          </button>
        </div>
      </section>

      {/* Main Info */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Trainer Name / トレーナー名</label>
            <input
              type="text"
              value={data.trainerName}
              onChange={e => onUpdate({ trainerName: e.target.value })}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-colors"
              placeholder="なまえ"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Region / 活動地域</label>
            <input
              type="text"
              value={data.region}
              onChange={e => onUpdate({ region: e.target.value })}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-colors"
              placeholder="カントー / 東京都 など"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Pokeca History / ポケカ歴</label>
          <input
            type="text"
            value={data.history}
            onChange={e => onUpdate({ history: e.target.value })}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-colors"
            placeholder="1年、第1弾から、など"
          />
        </div>
      </section>

      {/* Multi-Select Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <section className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase">PlayStyle / プレイスタイル</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PLAY_STYLE_LABELS) as PlayStyle[]).map(style => (
              <button
                key={style}
                onClick={() => toggleItem(data.playStyles, style, 'playStyles')}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${data.playStyles.includes(style) ? 'border-red-500 bg-red-500/10 text-white' : 'border-slate-800 text-slate-500'}`}
              >
                {PLAY_STYLE_LABELS[style]}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Regulation / レギュレーション</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(REGULATION_LABELS) as Regulation[]).map(reg => (
              <button
                key={reg}
                onClick={() => toggleItem(data.regulations, reg, 'regulations')}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${data.regulations.includes(reg) ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-800 text-slate-500'}`}
              >
                {REGULATION_LABELS[reg]}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase">Requests & News / 要望・お知らせ</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(REQUEST_ITEM_LABELS) as RequestItem[]).map(item => (
            <button
              key={item}
              onClick={() => toggleItem(data.requests, item, 'requests')}
              className={`px-3 py-2 rounded-lg border-2 text-[10px] font-bold text-left transition-all ${data.requests.includes(item) ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-slate-800 text-slate-500'}`}
            >
              {REQUEST_ITEM_LABELS[item]}
            </button>
          ))}
        </div>
      </section>

      {/* Favorite Types */}
      <section className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase">Favorite Types / 好きなタイプ</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ENERGY_TYPE_NAMES) as EnergyType[]).map(type => (
            <button
              key={type}
              onClick={() => toggleItem(data.favoriteTypes, type, 'favoriteTypes')}
              className={`p-2 rounded-full border-2 transition-all ${data.favoriteTypes.includes(type) ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 grayscale'}`}
              title={ENERGY_TYPE_NAMES[type]}
            >
              <EnergyIcon type={type} className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          ))}
        </div>
      </section>

      {/* Texts & Final Visual */}
      <section className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Favorite Deck / 好きなデッキ</label>
          <input
            type="text"
            value={data.favoriteDeck}
            onChange={e => onUpdate({ favoriteDeck: e.target.value })}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-colors"
            placeholder="リザードンex など"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Free Space / フリースペース</label>
          <textarea
            value={data.freeSpace}
            onChange={e => onUpdate({ freeSpace: e.target.value })}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-colors min-h-[80px]"
            placeholder="自由に記述してください"
          />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Upload Sprite / 推しポケモンのドット絵</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="poke-upload"
              className="hidden"
            />
            <label
              htmlFor="poke-upload"
              className="bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 rounded-xl px-6 py-4 cursor-pointer transition-all flex-1 text-center font-bold text-sm text-slate-400"
            >
              2Dドット絵（画像）をアップロード
            </label>
            {data.pokemonImage && (
              <img src={data.pokemonImage} alt="Preview" className="w-16 h-16 object-contain border-2 border-slate-700 rounded-lg bg-slate-800" />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
