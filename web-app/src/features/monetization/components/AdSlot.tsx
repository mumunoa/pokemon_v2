'use client';

import React from 'react';

interface AdSlotProps {
  id?: string;
  className?: string;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  label?: string;
}

/**
 * 広告表示用のスロットコンポーネント。
 * Google AdSense 等のスクリプトを挿入するための枠を提供します。
 */
export const AdSlot: React.FC<AdSlotProps> = ({ 
  id = 'ad-slot', 
  className = '', 
  format = 'auto',
  label = 'SPONSORED'
}) => {
  return (
    <div className={`w-full overflow-hidden my-6 ${className}`}>
      {/* 広告ラベル */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="h-[1px] flex-1 bg-white/5" />
        <span className="text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase">
          {label}
        </span>
        <div className="h-[1px] flex-1 bg-white/5" />
      </div>

      {/* 広告プレースホルダ（審査通過後に AdSense コードをここに配置） */}
      <div 
        id={id}
        className={`bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center transition-all hover:bg-white/[0.04] ${
          format === 'rectangle' ? 'aspect-[4/3] max-w-[336px] mx-auto' : 
          format === 'vertical' ? 'min-h-[600px] w-full' :
          format === 'horizontal' ? 'min-h-[100px] w-full' : 'min-h-[250px] w-full'
        }`}
      >
        <div className="text-center p-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 mx-auto mb-3">
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="M7 8h10"/><path d="M7 12h10"/><path d="M7 16h6"/>
          </svg>
          <p className="text-xs text-slate-600 font-medium">AdSense Placeholder</p>
          <p className="text-[10px] text-slate-700 mt-1">審査通過後に広告が配信されます</p>
        </div>
      </div>
    </div>
  );
};
