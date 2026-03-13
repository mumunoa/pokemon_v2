import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { StructuredLog, CardInstance } from '@/types/game';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const getActionIcon = (actionType: string) => {
    switch (actionType) {
        case 'game_initialize': return '🎮';
        case 'move_card': return '🔄';
        case 'attach_energy': return '⚡';
        case 'detach_energy': return '🗑️';
        case 'draw_cards': return '🎴';
        case 'discard_hand_and_draw': return '♻️';
        case 'shuffle_hand_and_draw': return '🌪️';
        case 'judge_man': return '⚖️';
        case 'return_hand_to_deck': return '📥';
        case 'end_turn': return '⏱️';
        default: return '📝';
    }
};

const formatLogMessage = (log: StructuredLog, cards: Record<string, CardInstance>) => {
    const pName = log.playerId === 'player1' ? 'P1' : 'P2';
    const cardName = log.cardInstanceId ? cards[log.cardInstanceId]?.name : null;

    switch (log.actionType) {
        case 'game_initialize':
            return `ゲーム開始 (デッキP1: ${log.payload?.deckCounts?.player1}枚, P2: ${log.payload?.deckCounts?.player2}枚)`;
        case 'move_card':
            return cardName 
                ? `${cardName}を移動 (${log.sourceZone} ➡️ ${log.targetZone})`
                : `カードを移動 (${log.sourceZone} ➡️ ${log.targetZone})`;
        case 'attach_energy':
            const targetPokemon = log.payload?.pokemonId ? cards[log.payload.pokemonId as string]?.name : 'ポケモン';
            return cardName ? `${targetPokemon}に${cardName}をつける` : 'エネルギーをつける';
        case 'detach_energy':
            return cardName ? `${cardName}をトラッシュ` : 'エネルギーをトラッシュ';
        case 'draw_cards':
            return `${pName}が ${log.payload?.count}枚 引く`;
        case 'discard_hand_and_draw':
            return `${pName}が手札をトラッシュし、${log.payload?.count}枚引く`;
        case 'shuffle_hand_and_draw':
            return `${pName}が手札を山札に戻し、${log.payload?.count}枚引く`;
        case 'judge_man':
            return `ジャッジマン (お互い4枚引く)`;
        case 'return_hand_to_deck':
            return `${pName}が手札を山札に戻す`;
        case 'end_turn':
            return `ターン終了 ➡️ ${log.payload?.nextPlayer === 'player1' ? 'P1' : 'P2'}の番 (Turn ${log.payload?.nextTurnCount})`;
        default:
            return `${log.actionType} を実行`;
    }
};

export const LogSidePanel: React.FC<Props> = ({ isOpen, onClose }) => {
    const { structuredLogs, cards } = useGameStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [structuredLogs, isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-y-0 right-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-[5000] flex flex-col animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    行動履歴 / Log
                </h3>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700"
            >
                {structuredLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
                        履歴がありません
                    </div>
                ) : (
                    structuredLogs.map((log, i) => {
                        const isTurn = log.actionType === 'end_turn';
                        const message = formatLogMessage(log, cards);
                        const icon = getActionIcon(log.actionType);

                        return (
                            <div
                                key={log.id}
                                className={`text-[12px] p-2.5 rounded-lg border leading-relaxed transition-all ${isTurn
                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-100 font-bold mt-4'
                                        : 'bg-slate-800/40 border-slate-700/50 text-slate-200'
                                    }`}
                            >
                                <div className="flex gap-2 items-start">
                                    <span className="text-slate-500 text-[10px] shrink-0 font-mono mt-0.5 w-4">{i + 1}</span>
                                    <span className="shrink-0 text-sm">{icon}</span>
                                    <div className="flex-1 drop-shadow-sm">
                                        <span className={log.cardInstanceId ? "text-yellow-100 font-medium" : ""}>
                                            {message}
                                        </span>
                                        {/* Optional Payload Debug view for advanced tracking */}
                                        {log.actionType === 'move_card' && (
                                            <div className="text-[9px] text-slate-500 mt-1 font-mono">
                                                ID: {log.baseCardId}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <p className="text-[10px] text-slate-400 text-center flex flex-col gap-1">
                    <span>※ AI向け構造化ログを表示しています</span>
                    <span className="text-slate-600">このデータがAIの分析基盤になります</span>
                </p>
            </div>
        </div>
    );
};
