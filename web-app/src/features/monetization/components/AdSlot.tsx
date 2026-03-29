'use client';

import React, { useEffect } from 'react';

interface AdSlotProps {
  id?: string;
  slotId?: string; // 個別の広告ユニットIDがある場合に使用
  className?: string;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  label?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ 
  id = 'ad-slot', 
  slotId,
  className = '', 
  format = 'auto',
  label = 'SPONSORED'
}) => {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('Adsbygoogle error:', e);
    }
  }, []);

  return (
    <div className={`w-full overflow-hidden my-6 ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="h-[1px] flex-1 bg-white/5" />
        <span className="text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase">
          {label}
        </span>
        <div className="h-[1px] flex-1 bg-white/5" />
      </div>

      <div 
        className={`bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center transition-all hover:bg-white/[0.04] min-h-[100px] overflow-hidden ${
          format === 'rectangle' ? 'aspect-[4/3] max-w-[336px] mx-auto' : ''
        }`}
      >
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-2970580806456149"
          data-ad-slot={slotId || ""}
          data-ad-format={format}
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  );
};
