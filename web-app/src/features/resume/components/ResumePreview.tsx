"use client";

import React, { forwardRef } from 'react';
import { 
  ResumeData, 
  PLAY_STYLE_LABELS, 
  REGULATION_LABELS, 
  REQUEST_ITEM_LABELS, 
  ENERGY_TYPE_NAMES 
} from '../types';
import { EnergyIcon } from '../assets/EnergyIcons';

interface Props {
  data: ResumeData;
}

export const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  // Styles for the 1200x675 container
  const containerStyle: React.CSSProperties = {
    width: '1200px',
    height: '675px',
    position: 'absolute',
    top: '0',
    left: '0',
    display: 'flex',
    overflow: 'hidden',
    backgroundColor: '#0f172a', // Default slate-950
    transform: 'scale(0.5)', // Match the preview container's scale if needed, but html-to-image handles original size
    transformOrigin: 'top left',
  };

  const isPokedex = data.template === 'pokedex';

  return (
    <div 
      ref={ref} 
      style={isPokedex ? pokedexStyle : sarStyle}
      className="select-none"
    >
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 w-full h-full flex p-10 gap-8">
        {/* Left Column: Visuals & Profile */}
        <div className="w-1/3 flex flex-col gap-6">
          <div className={`relative aspect-square rounded-2xl border-4 ${isPokedex ? 'border-red-600' : 'border-white/30'} bg-slate-800/80 overflow-hidden flex items-center justify-center`}>
            {data.pokemonImage ? (
              <img src={data.pokemonImage} alt="Pokemon" className="w-[80%] h-[80%] object-contain pixel-art shadow-2xl" />
            ) : (
              <div className="text-slate-500 font-bold text-center p-4">PUSH POKEMON<br/>HERE</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[10px] font-black tracking-widest text-center py-1">
              {isPokedex ? 'POKEDEX ID: #001' : 'SAR SPECIAL ART'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] text-red-500 font-black tracking-[0.2em]">TRAINER NAME</div>
            <div className="text-4xl font-black italic tracking-tighter truncate leading-tight">
              {data.trainerName || 'TRAINER'}
            </div>
            <div className="flex gap-2">
              <span className="bg-slate-100 text-slate-900 px-2 py-0.5 text-[10px] font-black rounded uppercase">{data.region || 'REGION UNKNOWN'}</span>
              <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-black rounded uppercase">PRE-RELEASE VER.</span>
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-700 pb-1">Pokeca History / 歴</div>
            <div className="text-lg font-bold">{data.history || '---'}</div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            {/* PlayStyles */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                Play Style
              </div>
              <div className="flex flex-wrap gap-2">
                {data.playStyles.length > 0 ? data.playStyles.map(s => (
                  <span key={s} className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-md text-xs font-bold text-white shadow-sm">
                    {PLAY_STYLE_LABELS[s]}
                  </span>
                )) : <span className="text-slate-600 text-xs">---</span>}
              </div>
            </div>

            {/* Regulations */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                Regulation
              </div>
              <div className="flex flex-wrap gap-2">
                {data.regulations.length > 0 ? data.regulations.map(r => (
                  <span key={r} className="bg-teal-950/30 border border-teal-800 text-teal-300 px-3 py-1 rounded-md text-xs font-bold shadow-sm">
                    {REGULATION_LABELS[r]}
                  </span>
                )) : <span className="text-slate-600 text-xs">---</span>}
              </div>
            </div>
          </div>

          {/* Requests */}
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                Requests & News
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data.requests.length > 0 ? data.requests.map(r => (
                <div key={r} className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <span className="w-1.5 h-1.5 bg-amber-500 rotate-45"></span>
                  {REQUEST_ITEM_LABELS[r]}
                </div>
              )) : <div className="text-slate-600 text-xs col-span-2">---</div>}
            </div>
          </div>

          {/* Types */}
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
              Favorite Types
            </div>
            <div className="flex gap-2">
              {data.favoriteTypes.length > 0 ? data.favoriteTypes.map(t => (
                <div key={t} className="bg-slate-800 p-1.5 rounded-full border border-slate-700 shadow-lg" title={ENERGY_TYPE_NAMES[t]}>
                  <EnergyIcon type={t} className="w-7 h-7" />
                </div>
              )) : <div className="text-slate-600 text-xs">---</div>}
            </div>
          </div>

          {/* Deck & FreeSpace */}
          <div className="mt-auto grid grid-cols-1 gap-4">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
               <div className="text-[10px] text-red-500 font-black tracking-widest mb-1 uppercase">Favorite Deck</div>
               <div className="text-lg font-black tracking-tight underline decoration-red-600 decoration-2 underline-offset-4">{data.favoriteDeck || '---'}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex-1 min-h-[100px]">
               <div className="text-[10px] text-slate-400 font-black tracking-widest mb-2 uppercase flex items-center justify-between">
                 <span>Trainer Memo</span>
                 <span className="text-[8px] opacity-30 tracking-tight italic">AI COACH CO. RESUME SYSTEM</span>
               </div>
               <div className="text-sm font-medium leading-relaxed text-slate-300">
                {data.freeSpace || '自由にご記入ください。'}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark / Logo */}
      <div className="absolute top-10 right-10 flex items-center gap-3 opacity-40">
        <div className="flex flex-col items-end">
          <div className="text-[8px] font-black uppercase tracking-tighter">Powered by</div>
          <div className="text-sm font-black italic tracking-tighter leading-none">MUMUNOA AI</div>
        </div>
        <div className="w-10 h-10 border-2 border-white rounded-lg flex items-center justify-center font-black text-xs italic">AI</div>
      </div>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';

// CSS Design Objects
const pokedexStyle: React.CSSProperties = {
  width: '1200px',
  height: '675px',
  backgroundColor: '#0f172a',
  backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)',
  backgroundSize: '30px 30px',
  position: 'relative',
  color: 'white',
  fontFamily: "'DotGothic16', 'Inter', sans-serif",
  // No 3D shadows here - keeping it 2D and clean
};

const sarStyle: React.CSSProperties = {
  width: '1200px',
  height: '675px',
  backgroundColor: '#1e1b4b',
  backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
  position: 'relative',
  color: 'white',
  fontFamily: "'Inter', sans-serif",
  boxShadow: 'inset 0 0 100px rgba(129, 140, 248, 0.2)',
};
