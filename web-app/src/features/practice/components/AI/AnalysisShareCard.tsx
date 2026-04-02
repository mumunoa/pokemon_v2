import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { TextShareSheet } from '../Coach/TextShareSheet';
import { createXShareTextVariants } from '@/lib/share/xShareText';
import type { ShareScoreSummary } from '@/types/monetization';

interface Metric { label: string; rate: number; }
interface Props {
    metrics: Metric[];
    bestLine: string;
    interpretation: string;
    deckName: string;
    onClose: () => void;
}

function buildSummary(metrics: Metric[], bestLine: string, interpretation: string, deckName: string): ShareScoreSummary {
    const setupRate = Math.round((metrics.find((m) => /初動|setup/i.test(m.label))?.rate ?? 0.7) * 100);
    const accidentRate = Math.round((metrics.find((m) => /事故|accident/i.test(m.label))?.rate ?? 0.25) * 100);
    const overallScore = Math.max(0, Math.min(100, Math.round(setupRate * 0.8 + (100 - accidentRate) * 0.2)));
    const overallTier = overallScore >= 85 ? 'S' : overallScore >= 72 ? 'A' : overallScore >= 58 ? 'B' : 'C';
    return { deckName: deckName || 'デッキ', overallTier, overallScore, setupRate, accidentRate, environmentRankPercent: Math.max(1, 100 - overallScore), bestAction: bestLine, caution: interpretation, source: 'ai_analysis' };
}

export const AnalysisShareCard: React.FC<Props> = ({ metrics, bestLine, interpretation, deckName, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isTextShareOpen, setIsTextShareOpen] = useState(false);
    const summary = useMemo(() => buildSummary(metrics, bestLine, interpretation, deckName), [metrics, bestLine, interpretation, deckName]);
    const variants = useMemo(() => createXShareTextVariants(summary), [summary]);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        try {
            const canvas = await html2canvas(cardRef.current, { backgroundColor: '#020617', scale: 3, logging: false, useCORS: true });
            const link = document.createElement('a');
            link.download = `poke-ai-report-${deckName || 'deck'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to generate image:', err);
            alert('画像の生成に失敗しました');
        }
    };

    const handleCopyBestText = async () => {
        const best = variants[0]?.text;
        if (!best) return;
        try {
            await navigator.clipboard.writeText(best);
            alert('シェア文言をコピーしました');
        } catch (err) {
            console.error(err);
            alert('コピーに失敗しました');
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
                <div className="flex flex-col gap-6 max-w-full items-center my-auto min-h-min p-4">
                    <div ref={cardRef} className="w-[360px] bg-slate-950 border border-slate-800 rounded-[28px] p-6 shadow-[0_0_50px_rgba(99,102,241,0.25)] text-white shrink-0">
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Board Insight Report</div>
                        <div className="mt-2 text-2xl font-black">POKEMON AI COACH</div>
                        <div className="mt-6 text-xs text-slate-400">Target Deck</div>
                        <div className="mt-1 text-xl font-black">{deckName || 'デッキ'}</div>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {metrics.map((m, i) => (
                                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                                    <div className="text-[11px] text-slate-400">{m.label}</div>
                                    <div className={`mt-1 text-2xl font-black ${m.rate > 0.8 ? 'text-emerald-400' : m.rate > 0.6 ? 'text-amber-400' : 'text-rose-400'}`}>{Math.round(m.rate * 100)}%</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                            <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">AI Core Advice</div>
                            <div className="mt-2 text-lg font-bold leading-snug">{bestLine}</div>
                        </div>
                        <div className="mt-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{interpretation}</div>
                        <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-500 flex items-center justify-between"><span>Powered by mumunoa.com</span><span>#ポケカAI</span></div>
                    </div>

                    <div className="w-full max-w-[360px] rounded-3xl border border-slate-800 bg-slate-950/95 p-5 shrink-0">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Share Message</div>
                        <div className="mt-3">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                                {variants[0]?.text}
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                             <div className="flex gap-2">
                                <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(variants[0]?.text)}`, '_blank')} className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-500 transition-colors">Xでポスト</button>
                            </div>
                            <button onClick={handleDownload} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-500 transition-colors">レポート画像を保存</button>
                            <button onClick={onClose} className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">閉じる</button>
                        </div>
                    </div>
                </div>
            </div>
            <TextShareSheet isOpen={isTextShareOpen} onClose={() => setIsTextShareOpen(false)} summary={summary} shareUrl={typeof window !== 'undefined' ? window.location.href : undefined} />
        </>
    );
};
