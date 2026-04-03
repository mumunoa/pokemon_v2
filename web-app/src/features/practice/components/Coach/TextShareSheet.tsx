'use client';

import React, { useMemo, useState } from 'react';
import type { ShareScoreSummary } from '@/types/monetization';
import { useShareText } from '@/hooks/useShareText';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  summary: ShareScoreSummary | null;
  shareUrl?: string;
};

export const TextShareSheet: React.FC<Props> = ({ isOpen, onClose, summary, shareUrl }) => {
  const { best, variants } = useShareText(summary);
  const [copied, setCopied] = useState(false);

  const fullText = useMemo(() => {
    if (!best) return '';
    return shareUrl ? `${best.text}\n${shareUrl}` : best.text;
  }, [best, shareUrl]);

  if (!isOpen || !summary) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleOpenX = () => {
    const encoded = encodeURIComponent(fullText);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-2xl scrollbar-hide" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Text Share</div>
            <h3 className="mt-1 text-xl font-black text-white">画像なしでシェア</h3>
          </div>
          <button className="text-slate-400 hover:text-white" onClick={onClose}>閉じる</button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-100 whitespace-pre-wrap">
          {fullText}
        </div>

        <div className="mt-4 grid gap-2">
          {variants.map((variant) => (
            <div key={variant.id} className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
              <div className="mb-1 font-bold text-slate-200">{variant.id} / {variant.length}文字</div>
              <div>{variant.text}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button onClick={handleCopy} className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700">
            {copied ? 'コピー済み' : 'コピー'}
          </button>
          <button onClick={handleOpenX} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="mr-2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            Xで投稿
          </button>
        </div>
      </div>
    </div>
  );
};
