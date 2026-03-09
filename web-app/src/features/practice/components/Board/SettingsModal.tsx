import React, { useState } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
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

    const [deckCodes, setDeckCodes] = useState<Record<PlayerId, string>>({
        player1: '',
        player2: ''
    });
    const [loading, setLoading] = useState<Record<PlayerId, boolean>>({
        player1: false,
        player2: false
    });
    const [errors, setErrors] = useState<Record<PlayerId, string | null>>({
        player1: null,
        player2: null
    });

    const handleLoadDeck = async (playerId: PlayerId) => {
        const code = deckCodes[playerId].trim();
        if (!code) return;

        setLoading(prev => ({ ...prev, [playerId]: true }));
        setErrors(prev => ({ ...prev, [playerId]: null }));

        try {
            const result = await loadDeckFromCode(playerId, code);
            if (!result.success) {
                setErrors(prev => ({ ...prev, [playerId]: result.error || '不明なエラー' }));
            }
        } finally {
            setLoading(prev => ({ ...prev, [playerId]: false }));
        }
    };

    const handleStartGame = () => {
        if (player1Deck.length === 0 && player1Deck.length === 0) return;
        initializeDeck(player1Deck, player2Deck);
        onClose();
    };

    const p1Count = player1Deck.reduce((s, c) => s + c.count, 0);
    const p2Count = player2Deck.reduce((s, c) => s + c.count, 0);

    const modes: { id: 'text' | 'compact' | 'local-image', label: string, labelEn: string, description: string }[] = [
        {
            id: 'text',
            label: 'テキストモード',
            labelEn: 'Text Mode',
            description: 'カード名とHPのみの超軽量表示です。'
        },
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
                                            placeholder="デッキコード"
                                            value={deckCodes[pid]}
                                            onChange={(e) => setDeckCodes(prev => ({ ...prev, [pid]: e.target.value }))}
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-700"
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
                                    {errors[pid] && (
                                        <p className="text-red-400 text-[10px] px-1">{errors[pid]}</p>
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

                <div className="mt-8 pt-6 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-slate-700 active:scale-[0.98]"
                    >
                        閉じる / Close
                    </button>
                </div>
            </div>
        </div>
    );
};
