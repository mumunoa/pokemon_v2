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
    // コンテナの描画・サイズ確定を待ってから広告を初期化
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          const insTag = document.getElementById(id)?.querySelector('ins.adsbygoogle');
          if (insTag && (insTag as HTMLElement).offsetWidth > 0) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } else {
            console.log(`AdSlot ${id} is not visible or has no width, skipping initialization.`);
          }
        }
      } catch (e) {
        // 静かにエラーを処理するか、デバッグ用に残す
        console.warn('Adsbygoogle init skipped:', e);
      }
    }, 500); // 待機時間を少し伸ばして確実に描画させる
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`w-full overflow-hidden my-6 ${className}`} style={{ minWidth: '250px' }}>
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
