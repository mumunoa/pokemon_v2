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
import { PokemonSearch } from './PokemonSearch';

interface Props {
  data: ResumeData;
  onUpdate: (updates: Partial<ResumeData>) => void;
}

export const ResumeForm: React.FC<Props> = ({ data, onUpdate }) => {
  const toggleItem = <T extends string>(list: T[], item: T, key: keyof ResumeData) => {
    const newList = list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item];
    onUpdate({ [key]: newList });
  };

  const updateFavorite = (index: number, id: number) => {
    const newList = [...data.favoritePokemonIds];
    newList[index] = id;
    onUpdate({ favoritePokemonIds: newList });
  };

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

  return (
    <div className="space-y-10">
      {/* 1. TEMPLATE / デザイン選択 (Formerly Pokemon Selection) */}
      <section className="space-y-6">
        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">TEMPLATE / デザイン選択</label>
        
        <div className="space-y-4">
          {/* Main Pokemon Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Main Pokemon / テーマ連動ポケモン</label>
            <PokemonSearch 
              value={data.mainPokemonId} 
              onChange={id => onUpdate({ mainPokemonId: id })} 
              placeholder="テーマを決めるポケモンを入力..."
            />
          </div>

          {/* Favorite 5 Pokemon Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Favorite 5 / お気に入り (最大5匹)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3, 4].map(idx => (
                <PokemonSearch 
                  key={idx}
                  placeholder={`${idx + 1}匹目...`} 
                  value={data.favoritePokemonIds[idx]} 
                  onChange={id => updateFavorite(idx, id)} 
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trainer Info with Gender Select */}
      <section className="space-y-6">
        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">TRAINER INFO / トレーナー情報</label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Trainer Name / トレーナー名</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.trainerName}
                onChange={e => onUpdate({ trainerName: e.target.value })}
                className="flex-1 bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-colors"
                placeholder="なまえを入力..."
              />
              <div className="flex border-2 border-slate-700 rounded-xl overflow-hidden bg-slate-800">
                <button 
                  onClick={() => onUpdate({ gender: data.gender === 'male' ? 'none' : 'male' })}
                  className={`px-3 transition-colors text-lg ${data.gender === 'male' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-700'}`}
                >
                  ♂
                </button>
                <button 
                  onClick={() => onUpdate({ gender: data.gender === 'female' ? 'none' : 'female' })}
                  className={`px-3 border-l border-slate-700 transition-colors text-lg ${data.gender === 'female' ? 'bg-pink-600 text-white' : 'text-slate-500 hover:bg-slate-700'}`}
                >
                  ♀
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Region / 活動地域</label>
            <input
              type="text"
              value={data.region}
              onChange={e => onUpdate({ region: e.target.value })}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-colors"
              placeholder="カントー、リモートなど..."
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

      {/* 3. Style & Regulation Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <section className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase">PlayStyle / プレイスタイル</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PLAY_STYLE_LABELS) as PlayStyle[]).map(style => (
              <button
                key={style}
                onClick={() => toggleItem(data.playStyles, style, 'playStyles')}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${data.playStyles.includes(style) ? 'border-red-600 bg-red-600/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
              >
                {PLAY_STYLE_LABELS[style]}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Regulation / レギュレーション</label>
          <div className="space-y-2">
            {(Object.keys(REGULATION_LABELS) as Regulation[]).map(reg => (
              <button
                key={reg}
                onClick={() => toggleItem(data.regulations, reg, 'regulations')}
                className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all text-center ${data.regulations.includes(reg) ? 'border-teal-600 bg-teal-600/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
              >
                {REGULATION_LABELS[reg]}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 4. Requests & News */}
      <section className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase">Requests & News / 要望・お知らせ</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(REQUEST_ITEM_LABELS) as RequestItem[]).map(item => (
            <button
              key={item}
              onClick={() => toggleItem(data.requests, item, 'requests')}
              className={`px-3 py-2 rounded-xl border-2 text-[10px] font-bold text-left transition-all ${data.requests.includes(item) ? 'border-amber-600 bg-amber-600/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
            >
              {REQUEST_ITEM_LABELS[item]}
            </button>
          ))}
        </div>
      </section>

      {/* 5. Favorite Types (PNG Icons) */}
      <section className="space-y-4">
        <label className="text-xs font-bold text-slate-500 uppercase">Favorite Types / 好きなタイプ</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ENERGY_TYPE_NAMES) as EnergyType[]).map(type => (
            <button
              key={type}
              onClick={() => toggleItem(data.favoriteTypes, type, 'favoriteTypes')}
              className={`group relative p-2 rounded-full border-2 transition-all ${
                data.favoriteTypes.includes(type)
                  ? 'bg-white border-white scale-110 shadow-lg'
                  : 'bg-slate-800 border-slate-700 opacity-40 hover:opacity-70 grayscale'
              }`}
              title={ENERGY_TYPE_NAMES[type]}
            >
              <EnergyIcon type={type} className="w-8 h-8" />
              {data.favoriteTypes.includes(type) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] text-white">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* 6. Profile Image & Visuals with Zoom */}
      <section className="space-y-6">
        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">VISUALS / ビジュアル調整</label>
        
        <div className="bg-slate-800/50 rounded-2xl p-6 border-2 border-dashed border-slate-700 space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase">Profile Image / プロフィール画像</label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-slate-900 rounded-xl border-2 border-slate-700 overflow-hidden flex items-center justify-center">
              {data.pokemonImage ? (
                <img 
                  src={data.pokemonImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover transition-transform" 
                  style={{ transform: `translate(${data.imageConfig.x}px, ${data.imageConfig.y}px) scale(${data.imageConfig.zoom})` }}
                />
              ) : (
                <span className="text-slate-600 text-[10px] font-bold">NO IMAGE</span>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-500 cursor-pointer"
              />
              {data.pokemonImage && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>ズーム調節 (Zoom)</span>
                    <span>{Math.round(data.imageConfig.zoom * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.01" 
                    value={data.imageConfig.zoom}
                    onChange={e => onUpdate({ imageConfig: { ...data.imageConfig, zoom: parseFloat(e.target.value) }})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>左右位置 (X)</span>
                      </div>
                      <input 
                        type="range" 
                        min="-50" 
                        max="50" 
                        step="1" 
                        value={data.imageConfig.x}
                        onChange={e => onUpdate({ imageConfig: { ...data.imageConfig, x: parseInt(e.target.value) }})}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>上下位置 (Y)</span>
                      </div>
                      <input 
                        type="range" 
                        min="-50" 
                        max="50" 
                        step="1" 
                        value={data.imageConfig.y}
                        onChange={e => onUpdate({ imageConfig: { ...data.imageConfig, y: parseInt(e.target.value) }})}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-colors min-h-[120px]"
            placeholder="自己紹介や意気込みをどうぞ！"
          />
        </div>
      </section>
    </div>
  );
};
