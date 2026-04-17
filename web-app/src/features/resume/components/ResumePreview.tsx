"use client";

import React, { forwardRef } from 'react';
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
import { POKEMON_DATA, getPokemonImageUrl, TYPE_COLORS } from '../pokemonData';

interface Props {
  data: ResumeData;
}

export const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  // メインポケモンの情報を取得してテーマカラーを決定
  const mainPoke = POKEMON_DATA.find(p => p.id === data.mainPokemonId);
  const themeColor = mainPoke ? TYPE_COLORS[mainPoke.type] || TYPE_COLORS.default : TYPE_COLORS.default;
  const headerImg = data.mainPokemonId ? getPokemonImageUrl(data.mainPokemonId) : null;

  return (
    <div 
      ref={ref} 
      className="relative bg-[#f8fafc] overflow-hidden select-none shadow-2xl"
      style={{
        width: '800px',
        height: '1133px',
        backgroundColor: '#f8fafc',
        fontFamily: "'Outfit', 'Inter', 'DotGothic16', sans-serif",
        backgroundImage: `
          radial-gradient(circle at 0% 0%, ${themeColor}05 0%, transparent 50%),
          radial-gradient(circle at 100% 100%, ${themeColor}05 0%, transparent 50%),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d1d5db' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M30 5a25 25 0 1 0 0 50 25 25 0 0 0 0-50zm0 4a21 21 0 0 1 20.9 20H39a9 9 0 0 0-18 0H9.1A21 21 0 0 1 30 9zm0 42a21 21 0 0 1-20.9-20H21a9 9 0 0 0 18 0h11.9A21 21 0 0 1 30 51zm0-25a4 4 0 1 1 0 8 4 4 0 0 1 0-8z'/%3E%3C/g%3E%3C/svg%3E")
        `,
      }}
    >
      {/* Google Font Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
      `}} />

      {/* Header Bar: Dynamic and Deep */}
      <div 
        className="pt-6 pb-6 px-12 flex items-center justify-between relative overflow-hidden shadow-xl" 
        style={{ 
          background: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`,
          borderBottom: `4px solid ${themeColor}`
        }}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 rounded-full" style={{ backgroundColor: themeColor }}></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 flex flex-col items-start gap-1">
          <h1 className="text-white text-6xl font-black tracking-tighter italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            ポケカ <span style={{ color: themeColor }}>履歴書</span>
          </h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-8 h-[1px] bg-slate-700"></span>
            Trainer Profile Document
            <span className="w-8 h-[1px] bg-slate-700"></span>
          </p>
        </div>

        {headerImg && (
          <div className="relative z-10 w-44 h-44 -mr-10 -mb-16 mt-[-40px] drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)] transform transition-transform duration-700 scale-125 hover:scale-130">
            <img src={headerImg} alt="Main Pokemon" className="w-full h-full object-contain" crossOrigin="anonymous" />
          </div>
        )}
      </div>

      <div className="p-8 space-y-4">
        {/* Upper Row: Profile & Info */}
        <div className="flex gap-8">
          <div className="relative">
            <div 
              className="w-[260px] h-[260px] bg-white border-[6px] shadow-2xl flex items-center justify-center relative overflow-hidden rounded-[2.5rem]" 
              style={{ borderColor: themeColor }}
            >
              <div className="absolute inset-0 bg-slate-50 opacity-50"></div>
              {data.pokemonImage ? (
                <img 
                  src={data.pokemonImage} 
                  alt="User" 
                  className="w-full h-full object-cover relative z-10" 
                  style={{ transform: `translate(${data.imageConfig.x}px, ${data.imageConfig.y}px) scale(${data.imageConfig.zoom})` }}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="text-slate-200 font-black text-4xl relative z-10">NO IMAGE</div>
              )}
            </div>
            {mainPoke && (
              <div className="absolute bottom-4 right-4 bg-white p-2.5 rounded-full shadow-xl border-4" style={{ borderColor: themeColor }}>
                <EnergyIcon type={mainPoke.type} className="w-10 h-10" />
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            <div className="space-y-2">
              <Label theme={themeColor}>TRAINER NAME</Label>
              <div className="bg-white/70 backdrop-blur-md border-b-4 rounded-2xl p-4 min-h-[72px] flex items-center justify-between text-3xl font-black shadow-lg" style={{ borderBottomColor: themeColor }}>
                <span className="truncate pr-4 text-slate-800 tracking-tight">{data.trainerName || '---'}</span>
                {data.gender !== 'none' && (
                  <span className={`text-3xl font-bold flex-shrink-0 animate-pulse ${data.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
                    {data.gender === 'male' ? '♂' : '♀'}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <InfoBox label="活動地域" value={data.region} theme={themeColor} compact />
               <InfoBox label="ポケカ歴" value={data.history} theme={themeColor} compact />
            </div>

            <SectionBox label="プレイスタイル" theme={themeColor}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-1">
                {(Object.keys(PLAY_STYLE_LABELS) as PlayStyle[]).map(style => (
                  <CheckItem key={style} label={PLAY_STYLE_LABELS[style]} checked={data.playStyles.includes(style)} theme={themeColor} />
                ))}
              </div>
            </SectionBox>
          </div>
        </div>

        {/* Middle Row: Favorite & Regulation */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3">
             <SectionBox label="好きなポケモン" theme={themeColor}>
                <div className="flex justify-between items-center py-2 h-[72px] gap-3">
                  {[0,1,2,3,4].map(idx => {
                    const pid = data.favoritePokemonIds[idx];
                    const url = pid ? getPokemonImageUrl(pid) : null;
                    return (
                      <div key={idx} className="flex-1 h-full bg-slate-50/50 border-2 border-slate-100 flex items-center justify-center rounded-2xl relative overflow-hidden group shadow-inner">
                         {url ? (
                           <img src={url} alt="poke" className="w-full h-full object-contain p-1 drop-shadow-md transition-all duration-300 group-hover:scale-125 group-hover:rotate-6" crossOrigin="anonymous" />
                         ) : (
                           <div className="w-full h-full bg-slate-100/30 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>
             </SectionBox>
          </div>
          <div className="col-span-2">
             <SectionBox label="レギュレーション" theme={themeColor}>
                <div className="flex flex-col justify-center h-[76px] space-y-1.5">
                  {(['standard', 'extra', 'hall'] as Regulation[]).map(reg => (
                    <CheckItem key={reg} label={REGULATION_LABELS[reg]} checked={data.regulations.includes(reg)} theme={themeColor} small />
                  ))}
                </div>
             </SectionBox>
          </div>
        </div>

        {/* Lower Row */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2">
            <SectionBox label="お知らせ" theme={themeColor}>
               <div className="space-y-1 py-1">
                  {(Object.keys(REQUEST_ITEM_LABELS) as RequestItem[]).map(item => (
                    <CheckItem key={item} label={REQUEST_ITEM_LABELS[item]} checked={data.requests.includes(item)} theme={themeColor} small />
                  ))}
               </div>
            </SectionBox>
          </div>
          <div className="col-span-3 flex flex-col gap-6">
            <SectionBox label="好きなタイプ" theme={themeColor}>
               <div className="flex items-center justify-center h-[56px]">
                 <div className="grid grid-cols-6 gap-x-3 gap-y-2 py-1 justify-items-center w-full">
                    {(Object.keys(ENERGY_TYPE_NAMES) as EnergyType[]).map(type => (
                      <div key={type} className={`relative p-1 rounded-full transition-all duration-300 shadow-sm ${data.favoriteTypes.includes(type) ? 'bg-white scale-110 -rotate-12 shadow-md' : 'opacity-10 grayscale'} flex items-center justify-center`}>
                        <EnergyIcon type={type} className="w-7 h-7" />
                      </div>
                    ))}
                 </div>
               </div>
            </SectionBox>
            
            <SectionBox label="好きなデッキ" theme={themeColor}>
               <div className="py-1 text-2xl font-black text-slate-800 flex items-center h-[40px] truncate tracking-tight">
                 {data.favoriteDeck || '---'}
               </div>
            </SectionBox>
          </div>
        </div>

        {/* Bottom: Free Space */}
        <div className="h-[120px]">
          <SectionBox label="フリースペース" theme={themeColor}>
             <div className="py-1 text-[13px] font-bold leading-relaxed whitespace-pre-wrap text-slate-700 h-full overflow-hidden italic">
               {data.freeSpace || '最高のポケカ仲間を見つけよう！対戦・雑談大歓迎です！'}
             </div>
          </SectionBox>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-12 flex items-center gap-4 opacity-30">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: themeColor }}></div>
          <p className="text-[10px] font-black italic tracking-widest text-slate-900 uppercase">Pokeca Resume x AI Coach</p>
        </div>
        <p className="text-[7px] font-bold text-slate-700 leading-tight max-w-[300px]">
          ※本サービスはファンが制作した非公式ツールです。画像・意匠の著作権、知的財産権は株式会社ポケモン等に帰属します。
        </p>
      </div>
      <div className="absolute bottom-6 right-12 opacity-30 text-right">
        <p className="text-[9px] font-black tracking-widest text-slate-900">© MUMUNOA AI COACH SYSTEM 2024</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
      `}} />
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';

// Sub-components for clean architecture
const Label = ({ children, theme }: { children: React.ReactNode, theme: string }) => (
  <div className="text-white text-[9px] font-black px-3 py-1 rounded-full inline-block shadow-md tracking-[0.2em]" style={{ backgroundColor: theme }}>
    {children}
  </div>
);

const InfoBox = ({ label, value, theme, compact = false }: { label: string, value: string, theme: string, compact?: boolean }) => (
  <div className="space-y-2">
    <Label theme={theme}>{label.toUpperCase()}</Label>
    <div className={`bg-white/70 backdrop-blur-md border-l-4 rounded-xl p-3 ${compact ? 'min-h-[56px] text-lg' : 'min-h-[60px] text-xl'} font-black shadow-md truncate overflow-hidden text-slate-800`} style={{ borderLeftColor: theme }}>
      {value || '---'}
    </div>
  </div>
);

const SectionBox = ({ label, children, theme }: { label: string, children: React.ReactNode, theme: string }) => (
  <div className="h-full flex flex-col gap-2">
    <Label theme={theme}>{label.toUpperCase()}</Label>
    <div className="bg-white/70 backdrop-blur-md border border-slate-100 rounded-3xl p-4 flex-1 shadow-xl relative overflow-hidden" style={{ borderTop: `4px solid ${theme}` }}>
      <div className="absolute top-0 left-0 w-full h-1 opacity-20" style={{ background: `linear-gradient(to right, transparent, ${theme}, transparent)` }}></div>
      {children}
    </div>
  </div>
);

const CheckItem = ({ label, checked, theme, small = false }: { label: string, checked: boolean, theme: string, small?: boolean }) => (
  <div className={`flex items-center gap-3 ${small ? 'text-[11px]' : 'text-[13px]'} font-black text-slate-700 transition-opacity ${!checked && 'opacity-40'}`}>
    <div className={`flex-shrink-0 w-5 h-5 border-2 rounded-lg flex items-center justify-center transition-all duration-300 ${checked ? 'shadow-md scale-110' : 'bg-slate-50 border-slate-200'}`} style={{ borderColor: checked ? theme : '#e2e8f0', backgroundColor: checked ? 'white' : 'transparent' }}>
       {checked && (
         <div className="w-2.5 h-2.5 rounded-full shadow-inner animate-pulse" style={{ backgroundColor: theme }}></div>
       )}
    </div>
    <span className="truncate tracking-tight">{label}</span>
  </div>
);
