"use client";

import React, { useState, useRef } from 'react';
import { ResumeData, EnergyType, PlayStyle, Regulation, RequestItem } from '../../features/resume/types';
import { ResumeForm } from '../../features/resume/components/ResumeForm';
import { ResumePreview } from '../../features/resume/components/ResumePreview';
import { toPng } from 'html-to-image';

export default function ResumePage() {
  const [data, setData] = useState<ResumeData>({
    trainerName: '',
    gender: 'none',
    region: '',
    history: '',
    playStyles: [],
    regulations: ['standard'],
    requests: [],
    favoriteTypes: [],
    favoriteDeck: '',
    freeSpace: '',
    imageConfig: { zoom: 1, x: 0, y: 0 },
    template: 'pokedex',
    favoritePokemonIds: [],
  });

  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleUpdate = (updates: Partial<ResumeData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const downloadImage = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        width: 800,
        height: 1133,
      });
      const link = document.createElement('a');
      link.download = `ポケカ履歴書-${data.trainerName || 'trainer'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white">
            ポケカ履歴書メーカー
          </h1>
          <p className="text-slate-400 text-sm md:text-base">自分だけの特別な履歴書で、最高のポケカ仲間を見つけよう。</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* PC Left / Mobile Top: Preview Area */}
          <div className="lg:col-span-12 xl:col-span-5 lg:sticky lg:top-8 space-y-4 order-1">
            <h2 className="text-xl font-bold flex items-center gap-2 px-2">
              <span className="w-2 h-6 bg-red-600 rounded-full"></span>
              PREVIEW
            </h2>
            
            <div 
              className="overflow-hidden rounded-3xl border-4 border-slate-800 bg-white relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-auto flex flex-col items-center"
            >
              <div className="w-full bg-slate-100/30 overflow-hidden flex justify-center p-4">
                {/* Responsive scaling: Dynamic calculation based on container width if possible, but tailwind scale is fine for now with better breakpoints */}
                <div className="scale-[0.38] xs:scale-[0.45] sm:scale-[0.55] md:scale-[0.65] lg:scale-[0.42] xl:scale-[0.52] 2xl:scale-[0.65] origin-top transition-transform duration-500 ease-in-out
                  mb-[-700px] xs:mb-[-620px] sm:mb-[-510px] md:mb-[-400px] lg:mb-[-650px] xl:mb-[-540px] 2xl:mb-[-390px]">
                  <ResumePreview data={data} ref={previewRef} />
                </div>
              </div>
            </div>
            <p className="text-center text-[10px] font-black tracking-widest text-slate-500 uppercase">High-Resolution Image: 800 x 1133 px</p>
          </div>

          {/* PC Right / Mobile Bottom: Form Area */}
          <div className="lg:col-span-12 xl:col-span-7 bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm order-2">
            <ResumeForm data={data} onUpdate={handleUpdate} />
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={downloadImage}
                disabled={isExporting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {isExporting ? '生成中...' : '画像を保存する'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
