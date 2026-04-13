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

interface Props {
  data: ResumeData;
}

export const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  return (
    <div 
      ref={ref} 
      className="relative bg-[#e5e7eb] overflow-hidden select-none shadow-2xl"
      style={{
        width: '800px',
        height: '1133px', // A4-ish ratio
        fontFamily: "'Inter', 'DotGothic16', sans-serif",
        // CSS pattern for Monster Ball background
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d1d5db' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M20 3a17 17 0 1 0 0 34 17 17 0 0 0 0-34zm0 2a15 15 0 0 1 14.9 14H25a5 5 0 0 0-10 0H5.1A15 15 0 0 1 20 5zm0 30a15 15 0 0 1-14.9-14H15a5 5 0 0 0 10 0h9.9A15 15 0 0 1 20 35zm0-20a3 3 0 1 1 0 6 3 3 0 0 1 0-6z'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Header Bar */}
      <div className="bg-[#1f2937] py-6 px-10 flex items-end justify-between border-b-8 border-black">
        <h1 className="text-white text-5xl font-black tracking-tighter">ポケカ履歴書</h1>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest pb-1">Profile for Pokemon-Card Trainers</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Upper: Visual & Basic Info */}
        <div className="flex gap-6">
          <div className="w-[300px] h-[340px] bg-[#d1d5db] border-4 border-white shadow-inner flex items-center justify-center relative overflow-hidden">
            {data.pokemonImage ? (
              <img src={data.pokemonImage} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="text-white font-black text-4xl opacity-50">NO IMAGE</div>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <InfoBox label="トレーナーネーム" value={data.trainerName} />
            <div className="grid grid-cols-2 gap-4">
              <InfoBox label="活動地域" value={data.region} />
              <InfoBox label="ポケカ歴" value={data.history} />
            </div>
          </div>
        </div>

        {/* Middle: PlayStyle & Regulation */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3">
             <SectionBox label="プレイスタイル">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-1">
                  {(Object.keys(PLAY_STYLE_LABELS) as PlayStyle[]).map(style => (
                    <CheckItem key={style} label={PLAY_STYLE_LABELS[style]} checked={data.playStyles.includes(style)} />
                  ))}
                </div>
             </SectionBox>
          </div>
          <div className="col-span-2">
             <SectionBox label="レギュレーション">
                <div className="space-y-2 py-1">
                  {(Object.keys(REGULATION_LABELS) as Regulation[]).map(reg => (
                    <CheckItem key={reg} label={REGULATION_LABELS[reg]} checked={data.regulations.includes(reg)} />
                  ))}
                </div>
             </SectionBox>
          </div>
        </div>

        {/* Lower: Requests & News / Types / Deck */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2">
            <SectionBox label="要望＆お知らせ">
               <div className="space-y-1.5 py-1">
                  {(Object.keys(REQUEST_ITEM_LABELS) as RequestItem[]).map(item => (
                    <CheckItem key={item} label={REQUEST_ITEM_LABELS[item]} checked={data.requests.includes(item)} small />
                  ))}
               </div>
            </SectionBox>
          </div>
          <div className="col-span-3 space-y-6">
            <SectionBox label="好きなタイプ">
               <div className="grid grid-cols-4 gap-2 py-2">
                  {(Object.keys(ENERGY_TYPE_NAMES) as EnergyType[]).map(type => (
                    <div key={type} className="flex items-center gap-1 opacity-90">
                      <div className={`w-3 h-3 rounded-sm border border-slate-400 ${data.favoriteTypes.includes(type) ? 'bg-black' : 'bg-white'}`}></div>
                      <EnergyIcon type={type} className="w-6 h-6" />
                    </div>
                  ))}
               </div>
            </SectionBox>
            <SectionBox label="好きなデッキ">
               <div className="py-1 text-lg font-bold min-h-[50px]">{data.favoriteDeck || '---'}</div>
            </SectionBox>
          </div>
        </div>

        {/* Bottom: Free Space */}
        <SectionBox label="フリースペース">
           <div className="py-2 text-sm font-medium leading-relaxed min-h-[120px] whitespace-pre-wrap">
             {data.freeSpace || '自由にご記入ください。'}
           </div>
        </SectionBox>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-4 right-8 opacity-40 text-right">
        <p className="text-[10px] font-black italic">MUMUNOA AI COACH - GENERATIVE RESUME SYSTEM</p>
      </div>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';

// Sub-components for clean architecture
const InfoBox = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-1">
    <div className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-t-lg inline-block">{label}</div>
    <div className="bg-white border-2 border-slate-300 rounded-b-lg rounded-r-lg p-3 min-h-[56px] flex items-center text-xl font-black">
      {value || '---'}
    </div>
  </div>
);

const SectionBox = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="h-full">
    <div className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-t-lg inline-block">{label}</div>
    <div className="bg-white border-2 border-slate-300 rounded-b-lg rounded-r-lg p-3 min-h-[60px] shadow-sm">
      {children}
    </div>
  </div>
);

const CheckItem = ({ label, checked, small = false }: { label: string, checked: boolean, small?: boolean }) => (
  <div className={`flex items-center gap-2 ${small ? 'text-[10px]' : 'text-xs'} font-bold text-slate-700`}>
    <div className={`flex-shrink-0 w-4 h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center transition-colors ${checked ? 'bg-black border-black' : 'bg-white'}`}>
       {checked && (
         <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
         </svg>
       )}
    </div>
    <span className="truncate">{label}</span>
  </div>
);
