import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

interface Props {
    boardRef: React.RefObject<HTMLDivElement | null>;
    isOpen: boolean;
    onClose: () => void;
    aiCommentary?: string;
    turnCount: number;
    currentTurnPlayer: string;
}

export const ShareModal: React.FC<Props> = ({ boardRef, isOpen, onClose, aiCommentary, turnCount, currentTurnPlayer }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isOpen && boardRef.current) {
            setIsLoading(true);
            setIsCopied(false);
            
            // Wait slightly for any animations to finish
            setTimeout(() => {
                if (!boardRef.current) return;
                
                html2canvas(boardRef.current, {
                    backgroundColor: '#0F172A', // slate-950
                    scale: 1.5, // slightly higher res
                    useCORS: true, 
                    allowTaint: true,
                }).then(canvas => {
                    const dataUrl = canvas.toDataURL('image/png');
                    setPreviewUrl(dataUrl);
                    setIsLoading(false);
                }).catch(err => {
                    console.error('Screenshot failed:', err);
                    setIsLoading(false);
                });
            }, 300);
        } else {
            setPreviewUrl(null);
        }
    }, [isOpen, boardRef]);

    if (!isOpen) return null;

    const buildShareText = () => {
        let text = `この盤面、あなたならどう動く？🤔\n【ターン${turnCount}：${currentTurnPlayer === 'player1' ? 'プレイヤー1' : 'プレイヤー2'}の番】\n\n`;
        
        if (aiCommentary) {
            text += `💬 プロコーチAIの解答:\n「${aiCommentary.substring(0, 100)}${aiCommentary.length > 100 ? '...' : ''}」\n\n`;
            text += `👇リンクから実際の盤面を見て、あなたの考えを試そう！\n`;
        } else {
            text += `👇ポケカAIプロコーチはどう動くのか？リンクから解答を見る！\n`;
        }
        
        const shareUrl = window.location.href; // In future, add ?board=xxx
        text += `${shareUrl}\n\n#ポケカ #ポケモンカード #ポケカAI #PTCG`;
        return text;
    };

    const handleCopyAndShare = async () => {
        const text = buildShareText();
        try {
            // Text copy
            await navigator.clipboard.writeText(text);

            // Try image copy if supported and we have image
            if (previewUrl && navigator.clipboard && navigator.clipboard.write) {
                try {
                    const res = await fetch(previewUrl);
                    const blob = await res.blob();
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                } catch (e) {
                    console.warn('Image clipboard not supported, only text copied.', e);
                }
            }
            
            setIsCopied(true);
            
            // Open X (Twitter) Intent
            // Since we copied image directly to clipboard to bypass twitter not supporting image via URL.
            // Text is also in clipboard, but we can pass text via URL anyway.
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
            
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (e) {
            console.error('Clipboard copy failed:', e);
            alert('コピーに失敗しました。');
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                    <h3 className="text-xl text-white font-black flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                            <polyline points="16 6 12 2 8 6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                        盤面をX(Twitter)にシェア
                    </h3>
                    <button className="text-slate-500 hover:text-white transition-colors" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-950 rounded-xl overflow-hidden min-h-[160px] flex items-center justify-center border border-slate-800 relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                <span className="text-slate-500 text-xs font-bold">スクリーンショットを生成中...</span>
                            </div>
                        ) : previewUrl ? (
                            <img src={previewUrl} alt="Board Preview" className="w-full h-auto object-contain max-h-[300px]" />
                        ) : (
                            <span className="text-slate-500 text-sm">プレビューを生成できませんでした</span>
                        )}
                        <div className="absolute inset-0 ring-1 ring-inset ring-slate-800/50 rounded-xl pointer-events-none"></div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 font-sans border border-slate-700">
                        <p className="whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-bold">
                            {buildShareText()}
                        </p>
                    </div>

                    <div className="bg-blue-900/30 border border-blue-500/50 text-blue-200 text-[11px] p-3 rounded-lg flex gap-2 items-start">
                        <span className="text-base shrink-0">💡</span>
                        <p className="leading-relaxed">
                            X(Twitter)への画像自動添付はブラウザ制限によりできないため、<strong>ボタンを押すと画像とテキストがクリップボードにコピーされます。</strong> そのままXの投稿画面で「貼り付け(Paste)」を行ってください。
                        </p>
                    </div>

                    {isCopied ? (
                        <div className="w-full bg-green-600 border border-green-500 text-white font-bold py-3 px-4 rounded-xl text-center shadow-lg animate-in slide-in-from-bottom-2">
                            ✓ コピー完了！Xを開きます...
                        </div>
                    ) : (
                        <button 
                            disabled={isLoading}
                            onClick={handleCopyAndShare}
                            className={`w-full font-bold py-3 px-4 rounded-xl shadow-xl transition-all active:scale-[0.98] mt-2 flex justify-center items-center gap-2 ${
                                isLoading 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-900/40 border border-blue-500'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                            コピーしてX(Twitter)を開く
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
