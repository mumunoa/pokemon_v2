import React, { useState } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { useDeckHistory } from '@/hooks/useDeckHistory';
import { useAuth } from '@/hooks/useAuth';
import { PlayerId } from '@/types/game';

interface Props {
    onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
    const {
        displayMode,
        setDisplayMode,
        loadDeckFromCode,
        player1Deck,
        player2Deck,
        initializeDeck
    } = useGameStore();

    const { isPro } = useAuth();
    const { history, addDeck, updateDeckName, togglePin, removeDeck } = useDeckHistory();

    const [editingName, setEditingName] = useState<{ id: string, name: string } | null>(null);

    const [deckCodes, setDeckCodes] = useState<Record<PlayerId, string>>({
        player1: '',
        player2: ''
    });

    const sampleDecks = [
        { name: 'ドラパルトexデッキ', code: 'NNnNgn-BArOp8-9NL6gn' },
        { name: 'タケルライコexデッキ', code: '5F515V-z9mey2-5ffbkV' },
        { name: 'メガルカリオexデッキ', code: 'MEp2yX-7wFGpK-RyMppM' }
    ];
    const [loading, setLoading] = useState<Record<PlayerId, boolean>>({
        player1: false,
        player2: false
    });
    const [errors, setErrors] = useState<Record<PlayerId, string | null>>({
        player1: null,
        player2: null
    });

    const handleLoadDeck = async (playerId: PlayerId, isSample: boolean = false) => {
        const code = deckCodes[playerId].trim();
        if (!code) return;

        setLoading(prev => ({ ...prev, [playerId]: true }));
        setErrors(prev => ({ ...prev, [playerId]: null }));

        try {
            const result = await loadDeckFromCode(playerId, code);
            if (!result.success) {
                setErrors(prev => ({ ...prev, [playerId]: result.error || '不明なエラー' }));
            } else if (!isSample) {
                addDeck(code);
            }
        } finally {
            setLoading(prev => ({ ...prev, [playerId]: false }));
        }
    };

    const handleStartGame = () => {
        if (player1Deck.length === 0 && player2Deck.length === 0) return;
        initializeDeck(player1Deck, player2Deck);
        onClose();
    };

    const p1Count = player1Deck.reduce((s, c) => s + c.count, 0);
    const p2Count = player2Deck.reduce((s, c) => s + c.count, 0);

    const modes: { id: 'text' | 'compact' | 'local-image', label: string, labelEn: string, description: string }[] = [
        /*
                {
                    id: 'text',
                    label: 'テキストモード',
                    labelEn: 'Text Mode',
                    description: 'カード名とHPのみの超軽量表示です。'
                },
        */
        {
            id: 'compact',
            label: 'コンパクトモード',
            labelEn: 'Compact Mode',
            description: '基本は自作UIで、詳細確認時のみ画像を考慮する標準設定です。'
        },
        {
            id: 'local-image',
            label: '画像表示モード',
            labelEn: 'Image Mode',
            description: 'すべてのカード画像を通常通り表示します。'
        },
    ];

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-[440px] shadow-2xl animate-in fade-in zoom-in duration-200 my-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                    <h3 className="text-xl text-white font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                        設定 / Settings
                    </h3>
                    <button className="text-slate-500 hover:text-white transition-colors p-1" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Deck Import Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                            <label className="text-sm font-bold text-slate-200">デッキ読み込み / Load Decks</label>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {(['player1', 'player2'] as PlayerId[]).map((pid) => (
                                <div key={pid} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            {pid === 'player1' ? 'プレイヤー 1' : 'プレイヤー 2'}
                                        </span>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${(pid === 'player1' ? p1Count : p2Count) > 0
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-slate-700 text-slate-500'
                                            }`}>
                                            {(pid === 'player1' ? p1Count : p2Count)} 枚
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id={`input-${pid}`}
                                            placeholder="デッキコード"
                                            value={deckCodes[pid]}
                                            onChange={(e) => setDeckCodes(prev => ({ ...prev, [pid]: e.target.value }))}
                                            autoFocus={pid === 'player1'}
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-700"
                                        />
                                        <button
                                            onClick={() => handleLoadDeck(pid)}
                                            disabled={loading[pid] || !deckCodes[pid].trim()}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${loading[pid] || !deckCodes[pid].trim()
                                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-500 text-white active:scale-95'
                                                }`}
                                        >
                                            {loading[pid] ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : '読込'}
                                        </button>
                                    </div>

                                    {/* Sample Decks */}
                                    <div className="flex flex-wrap gap-1.5 px-1 mt-1">
                                        <span className="text-[9px] text-slate-500 w-full mb-0.5">サンプルデッキを試す:</span>
                                        {sampleDecks.map(sd => (
                                            <button
                                                key={sd.code}
                                                onClick={() => {
                                                    setDeckCodes(prev => ({ ...prev, [pid]: sd.code }));
                                                    // Use a temporary function to call handleLoadDeck with the current pid
                                                    setTimeout(() => {
                                                        const currentInput = document.getElementById(`input-${pid}`) as HTMLInputElement;
                                                        if (currentInput) {
                                                            currentInput.value = sd.code;
                                                            handleLoadDeck(pid, true);
                                                        }
                                                    }, 0);
                                                }}
                                                className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700 transition-colors"
                                            >
                                                {sd.name}
                                            </button>
                                        ))}
                                    </div>
                                    {errors[pid] && (
                                        <p className="text-red-400 text-[10px] px-1">{errors[pid]}</p>
                                    )}
                                    {/* Advanced Deck History */}
                                    {history.length > 0 && (
                                        <div className="mt-3 space-y-2 border-t border-slate-700/50 pt-3">
                                            <div className="flex justify-between items-center px-1">
                                                <p className="text-[10px] text-slate-500 font-medium">保存されたデッキ ({history.length}/{isPro ? '20' : '4'})</p>
                                                {!isPro && history.length >= 4 && (
                                                    <span className="text-[9px] text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                        <span className="text-xs shrink-0">✨</span>PROで20件まで保存可能
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                                {history.map((deckCodeInfo, idx) => (
                                                    <div
                                                        key={`${pid}-hist-${idx}-${deckCodeInfo.code}`}
                                                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-colors group cursor-pointer ${deckCodes[pid] === deckCodeInfo.code ? 'bg-blue-900/40 border-blue-500/50' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-700'
                                                            }`}
                                                        onClick={() => {
                                                            if (editingName?.id !== deckCodeInfo.code) {
                                                                setDeckCodes(prev => ({ ...prev, [pid]: deckCodeInfo.code }));
                                                            }
                                                        }}
                                                    >
                                                        {isPro && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); togglePin(deckCodeInfo.code); }}
                                                                className={`p-1 rounded transition-all shrink-0 ${deckCodeInfo.pinned ? 'text-yellow-400 opacity-100' : 'text-slate-500 hover:text-slate-300 opacity-40 hover:opacity-100'}`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={deckCodeInfo.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5" /><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5M15 10.5h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2" /></svg>
                                                            </button>
                                                        )}
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <span className="text-[11px] font-bold text-slate-200 truncate pr-4">
                                                                {deckCodeInfo.name || "名称未設定デッキ"}
                                                            </span>
                                                            <span className="text-[9px] text-slate-500 font-mono tracking-widest leading-none mt-0.5">{deckCodeInfo.code}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newName = window.prompt("デッキ名を入力してください", deckCodeInfo.name || "");
                                                                if (newName !== null) {
                                                                    updateDeckName(deckCodeInfo.code, newName.trim() || "名称未設定デッキ");
                                                                }
                                                            }}
                                                            className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg transition-all opacity-40 hover:opacity-100 shrink-0 hover:bg-blue-400/10"
                                                            title="名前を変更"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeDeck(deckCodeInfo.code); }}
                                                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all opacity-40 hover:opacity-100 shrink-0"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleStartGame}
                            disabled={p1Count === 0 && p2Count === 0}
                            className={`w-full mt-4 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${p1Count === 0 && p2Count === 0
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 border border-blue-500 active:scale-[0.98]'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 3l14 9-14 9V3z"></path></svg>
                            読み込んだデッキで対戦開始
                        </button>
                    </section>

                    {/* Display Mode Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                            <label className="text-sm font-bold text-slate-200">表示モード / Display Mode</label>
                        </div>
                        <div className="space-y-3">
                            {modes.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setDisplayMode(mode.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${displayMode === mode.id
                                        ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600 text-slate-400'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1.5">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold ${displayMode === mode.id ? 'text-white' : 'text-slate-300'}`}>
                                                {mode.label}
                                            </span>
                                            <span className="text-[10px] opacity-50 uppercase tracking-wider font-medium">
                                                {mode.labelEn}
                                            </span>
                                        </div>
                                        {displayMode === mode.id && (
                                            <div className="bg-blue-500 rounded-full p-1 shadow-lg shadow-blue-500/30">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-[11px] leading-relaxed transition-colors ${displayMode === mode.id ? 'text-blue-100/80' : 'text-slate-500'}`}>
                                        {mode.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
                    {/* Support & Legal Links */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <a 
                            href="https://ofuse.me/mumunoa" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[11px] font-bold rounded-lg border border-orange-500/20 transition-all"
                        >
                            ❤️ 応援する (OFUSE)
                        </a>
                        <a 
                            href="https://x.com/mumunoa_tcg" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold rounded-lg border border-white/10 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                            公式X
                        </a>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 underline-offset-4">
                        <a href="mailto:support@mumunoa.com" className="hover:text-slate-300 hover:underline">お問い合わせ</a>
                        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                        <a href="/terms" className="hover:text-slate-300 hover:underline">利用規約</a>
                        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                        <a href="/privacy-policy" className="hover:text-slate-300 hover:underline">プライバシー</a>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-3.5 rounded-xl transition-all border border-slate-700 active:scale-[0.98] shadow-lg shadow-black/20"
                    >
                        閉じる / Close
                    </button>
                </div>
            </div>
        </div>
    );
};
