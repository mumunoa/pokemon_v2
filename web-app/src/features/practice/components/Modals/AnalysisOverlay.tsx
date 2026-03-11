import React from 'react';
import { AiAnalysisResult } from '@/types/game';

interface AnalysisOverlayProps {
    isOpen: boolean;
    isAnalyzing: boolean;
    analysis: AiAnalysisResult | undefined;
    onClose: () => void;
    onFeedback?: (rating: 'good' | 'bad') => void;
}

export const AnalysisOverlay: React.FC<AnalysisOverlayProps> = ({
    isOpen,
    isAnalyzing,
    analysis,
    onClose,
    onFeedback
}) => {
    if (!isOpen) return null;

    /**
     * AIのテキストレスポンスから構造化データを抽出する
     */
    const parseAiResponse = (text: string) => {
        if (!text) return { accidentRate: 0, setupRate: 0, recommendedAction: '分析なし', cleanDescription: '' };

        // 正規表現で各項目を抽出
        const accidentMatch = text.match(/事故率[:：]\s*(\d+)%/);
        const setupMatch = text.match(/理想展開率[:：]\s*(\d+)%/);
        const actionMatch = text.match(/推奨アクション[:：]\s*([^\n]+)/);

        const accidentRate = accidentMatch ? parseInt(accidentMatch[1], 10) : (analysis?.accidentRate || 0);
        const setupRate = setupMatch ? parseInt(setupMatch[1], 10) : (analysis?.setupRate || 0);
        const recommendedAction = actionMatch ? actionMatch[1].trim() : (analysis?.recommendedAction || '戦略分析');

        // 本文（## 候補手より前、かつヘッダー行を除外したもの）を作成
        let cleanDescription = text.split('## 候補手')[0];
        // ヘッダー行 (--- から --- まで) や個別の抽出済み項目行を削除
        cleanDescription = cleanDescription
            .replace(/---/g, '')
            .replace(/事故率[:：].*\n?/g, '')
            .replace(/理想展開率[:：].*\n?/g, '')
            .replace(/推奨アクション[:：].*\n?/g, '')
            .replace(/# 戦略解説\n?/g, '')
            .trim();

        return { accidentRate, setupRate, recommendedAction, cleanDescription };
    };

    const { accidentRate, setupRate, recommendedAction, cleanDescription } = parseAiResponse(analysis?.description || '');

    /**
     * AIのマークダウン出力を解析し、太字(**)や見出し(#)を反映したReact要素を返します。
     */
    const renderMarkdown = (text: string) => {
        if (!text) return null;

        return text.split('\n').map((line, i) => {
            const trimmedLine = line.trim();

            // 見出し (# / ##)
            if (trimmedLine.startsWith('# ')) {
                return (
                    <h4 key={i} className="text-white font-black text-xl mt-6 mb-3 border-l-4 border-purple-500 pl-3 leading-tight">
                        {parseInlineFormatting(trimmedLine.replace('# ', ''))}
                    </h4>
                );
            }
            if (trimmedLine.startsWith('## ')) {
                return (
                    <h5 key={i} className="text-yellow-500 font-black text-base mt-6 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                        {parseInlineFormatting(trimmedLine.replace('## ', ''))}
                    </h5>
                );
            }

            // 箇条書き (- )
            if (trimmedLine.startsWith('- ')) {
                return (
                    <div key={i} className="ml-4 mb-2 flex gap-3 group">
                        <span className="text-purple-500 font-bold shrink-0 mt-0.5">•</span>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {parseInlineFormatting(trimmedLine.replace('- ', ''))}
                        </p>
                    </div>
                );
            }

            // 空行
            if (trimmedLine === '') return <div key={i} className="h-4" />;

            // 通常のテキスト
            return (
                <p key={i} className="text-slate-300 leading-relaxed text-sm mb-3">
                    {parseInlineFormatting(line)}
                </p>
            );
        });
    };

    /**
     * インライン装飾 (**太字**) を解析します
     */
    const parseInlineFormatting = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={index} className="text-white font-black bg-purple-500/10 px-1 rounded mx-0.5">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Main Modal Container */}
            <div className="relative w-full max-w-[460px] max-h-[90vh] flex flex-col bg-[#0b101c] border border-slate-800 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 fade-in duration-500">

                {/* Header Area */}
                <div className="p-6 pb-2 flex items-center justify-between border-b border-white/5 bg-slate-900/20 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-900/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-black tracking-tight leading-tight">AIコーチ・戦略分析</h2>
                            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 leading-none opacity-80">NEURAL ENGINE V2.1</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-slate-800/30 hover:bg-slate-700/50 rounded-2xl text-slate-500 hover:text-white transition-all transform active:scale-90"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-10">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/5 blur-[80px] pointer-events-none rounded-full" />

                    {isAnalyzing ? (
                        <div className="py-20 flex flex-col items-center">
                            <div className="relative w-20 h-20 mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-purple-500/10" />
                                <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 animate-pulse" />
                            </div>
                            <p className="text-white font-black text-lg animate-pulse tracking-tight">盤面をスキャン中...</p>
                            <p className="text-slate-500 text-xs mt-3">最適なプレイパスを並列計算しています</p>
                        </div>
                    ) : analysis ? (
                        <>
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Accident Rate Card */}
                                <div className="bg-[#141c2e]/50 border border-slate-800/80 p-5 rounded-[32px] relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-tight">手札事故率<br />ACCIDENT</p>
                                        <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">安定</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black italic text-green-500 leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">{accidentRate}</span>
                                        <span className="text-xl font-black text-green-500/60">%</span>
                                    </div>
                                    <div className="mt-6 h-1 bg-slate-800/80 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-all duration-[1500ms] ease-out"
                                            style={{ width: `${accidentRate}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Advantage Card */}
                                <div className="bg-[#141c2e]/50 border border-slate-800/80 p-5 rounded-[32px] relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-tight">理想展開率<br />ADVANTAGE</p>
                                        <span className="text-[9px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20 leading-none">理想的</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black italic text-blue-500 leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{setupRate}</span>
                                        <span className="text-xl font-black text-blue-500/60">%</span>
                                    </div>
                                    <div className="mt-6 h-1 bg-slate-800/80 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-[1500ms] ease-out"
                                            style={{ width: `${setupRate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Advice Card */}
                            <div className="bg-[#141c2e]/50 border border-slate-800/80 rounded-[32px] overflow-hidden">
                                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                        <p className="text-white font-black text-sm tracking-tight">推奨アクション</p>
                                    </div>
                                    <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-tighter">無料プラン</span>
                                </div>
                                <div className="p-8">
                                    <h3 className="text-white text-3xl font-black mb-8 flex relative leading-tight">
                                        <span className="text-purple-500/40 text-6xl absolute -left-6 -top-4 font-serif italic select-none">“</span>
                                        <span className="relative z-10 drop-shadow-sm">{recommendedAction}</span>
                                        <span className="text-purple-500/40 text-6xl absolute -right-2 bottom-0 font-serif italic select-none translate-y-2">”</span>
                                    </h3>

                                    <div className="prose prose-invert prose-sm max-w-none">
                                        {renderMarkdown(cleanDescription)}
                                    </div>

                                    {/* Feedback Section */}
                                    <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">この回答の評価</p>
                                        <div className="flex gap-1.5 p-1 bg-slate-900 rounded-2xl border border-white/5">
                                            <button onClick={() => onFeedback?.('good')} className="p-2.5 hover:bg-green-500/10 rounded-xl text-slate-500 hover:text-green-500 transition-all transform active:scale-90">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                                            </button>
                                            <button onClick={() => onFeedback?.('bad')} className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-500 transition-all transform active:scale-90">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79-1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pro Section (If available) */}
                            {analysis.description.includes('## 候補手') ? (
                                <div className="bg-[#1e1430]/40 border border-yellow-500/20 p-8 rounded-[40px] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-5">
                                        <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-tighter">Pro 限定インサイト</span>
                                        </div>
                                    </div>
                                    <div className="prose prose-invert prose-sm">
                                        {renderMarkdown('## 候補手' + analysis.description.split('## 候補手').slice(1).join('## 候補手'))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-[32px] relative grayscale opacity-40 group hover:opacity-60 transition-all cursor-not-allowed">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-2xl border border-yellow-500/20">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-black">候補手 (2〜3件) の分析</p>
                                                <p className="text-slate-500 text-[10px] font-bold">相手の返しのターンを考慮した分岐分析</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-yellow-600 border border-yellow-600/30 px-2.5 py-1 rounded-lg">PRO</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-20 text-center">
                            <p className="text-slate-500 italic font-bold">分析データが取得できませんでした</p>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-8 bg-slate-950/80 border-t border-white/5 flex flex-col gap-4 backdrop-blur-xl">
                    <button
                        onClick={onClose}
                        className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-[28px] shadow-xl shadow-purple-900/40 transition-all transform active:scale-95 text-lg tracking-tight"
                    >
                        閉じる
                    </button>
                    <p className="text-slate-600 text-[9px] font-bold text-center uppercase tracking-widest leading-none">
                        AI Coach Strategy Analysis v2.1 • Powered by Claude
                    </p>
                </div>
            </div>
        </div>
    );
};
