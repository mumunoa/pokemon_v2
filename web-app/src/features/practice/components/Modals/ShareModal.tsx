import React, { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import { TextShareSheet } from '../Coach/TextShareSheet';
import { buildShareSummary } from '@/lib/share/buildShareSummary';
import { createXShareTextVariants } from '@/lib/share/xShareText';
import type { ShareScoreSummary } from '@/types/monetization';

interface Props {
  boardRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
  aiCommentary?: string;
  turnCount: number;
  currentTurnPlayer: string;
  scoreSummary?: ShareScoreSummary | null;
}

export const ShareModal: React.FC<Props> = ({ boardRef, isOpen, onClose, aiCommentary, turnCount, currentTurnPlayer, scoreSummary }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isTextShareOpen, setIsTextShareOpen] = useState(false);

  const summary = useMemo(() => scoreSummary ?? buildShareSummary({
    deckName: `ターン${turnCount}の盤面`,
    commentary: { bestActions: aiCommentary ? [{ title: aiCommentary.slice(0, 36), cons: [] }] : [] },
    fallbackSource: 'pro_coach',
  }), [scoreSummary, turnCount, aiCommentary]);

  const variants = useMemo(() => summary ? createXShareTextVariants(summary) : [], [summary]);

  useEffect(() => {
    if (!isOpen || !boardRef.current) {
      setPreviewUrl(null);
      return;
    }
    setIsLoading(true);
    setIsCopied(false);
    const timeoutId = window.setTimeout(() => {
      const element = boardRef.current;
      if (!element) return;
      html2canvas(element, { backgroundColor: '#0F172A', scale: 1.5, useCORS: true })
        .then((canvas) => {
          setPreviewUrl(canvas.toDataURL('image/png'));
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Screenshot failed:', err);
          setIsLoading(false);
        });
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, boardRef]);

  if (!isOpen) return null;

  const fallbackText = `ターン${turnCount} ${currentTurnPlayer === 'player1' ? 'プレイヤー1' : 'プレイヤー2'} の盤面を共有中 #ポケカAI #ポケカ`;
  const bestText = variants[0]?.text ?? fallbackText;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(bestText);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      alert('コピーに失敗しました。');
    }
  };

  const handleDownloadImage = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `board-turn-${turnCount}.png`;
    link.click();
  };

  const handleOpenX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(bestText)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="fixed inset-0 z-[9700] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-2xl scrollbar-hide" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Share</div>
              <h3 className="mt-1 text-xl font-black text-white">画像なし前提のテキストシェア</h3>
              <p className="mt-1 text-sm text-slate-400">Xの画像制限を前提に、120文字以内の文面を優先表示します。</p>
            </div>
            <button className="text-slate-400 hover:text-white" onClick={onClose}>閉じる</button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-100 whitespace-pre-wrap">{bestText}</div>
              <div className="mt-3 grid gap-2">
                {variants.map((variant) => (
                  <div key={variant.id} className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                    <div className="mb-1 font-bold text-slate-200">{variant.id} / {variant.length}文字</div>
                    <div>{variant.text}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button onClick={handleCopyText} className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700">{isCopied ? 'コピー済み' : '文言をコピー'}</button>
                <button onClick={handleOpenX} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500">Xで投稿</button>
                <button onClick={() => setIsTextShareOpen(true)} className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600">シェアシートを開く</button>
              </div>
            </div>
            <div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Optional board preview</div>
                <div className="mt-3 min-h-[240px] rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden">
                  {isLoading ? <div className="text-sm text-slate-500">盤面プレビューを生成中...</div> : previewUrl ? <img src={previewUrl} alt="Board preview" className="w-full h-full object-contain" /> : <div className="text-sm text-slate-500">プレビューを生成できませんでした</div>}
                </div>
                <button onClick={handleDownloadImage} disabled={!previewUrl} className="mt-4 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">盤面画像を保存</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TextShareSheet isOpen={isTextShareOpen} onClose={() => setIsTextShareOpen(false)} summary={summary} shareUrl={typeof window !== 'undefined' ? window.location.href : undefined} />
    </>
  );
};
