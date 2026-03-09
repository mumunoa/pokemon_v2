import React, { useState } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { CardInstance, ZoneType } from '@/types/game';
import { Card } from './Card';

export type PopupState = {
    zone: ZoneType;
    viewMode?: 'top-5' | 'top-7' | 'all' | 'prizes';
} | null;

interface Props {
    state: PopupState;
    onClose: () => void;
    onSelectCard?: (card: CardInstance) => void;
}

export const ZonePopupModal: React.FC<Props> = ({ state, onClose, onSelectCard }) => {
    const { cards, zones, drawCards, shuffleDeck, moveCard, updateCardState } = useGameStore();
    const [isPrizesRevealed, setIsPrizesRevealed] = useState(false);
    const [deckViewMode, setDeckViewMode] = useState<'hidden' | 'top-5' | 'top-7' | 'all'>('hidden');
    const [isShuffling, setIsShuffling] = useState(false);

    if (!state) return null;

    const zoneCards = zones[state.zone].map(id => cards[id]).filter(Boolean) as CardInstance[];

    let displayCards = [...zoneCards];
    /* Top card is last in the array normally (since push adds to bottom/end), so to show top card on the left, we reverse it. */
    displayCards.reverse();

    // Specific Action Handlers
    const handleDrawFromPrizes = (count: number) => {
        const owner = state.zone.startsWith('player1') ? 'player1' : 'player2';
        const prizes = zones[`${owner}-prizes` as ZoneType];
        const drawn = prizes.slice(-count).reverse();
        drawn.forEach(cardId => {
            updateCardState(cardId, { isReversed: false });
            moveCard(cardId, `${owner}-prizes` as ZoneType, `${owner}-hand` as ZoneType);
        });
        if (zones[`${owner}-prizes` as ZoneType].length <= count) {
            alert(owner === 'player1' ? 'プレイヤー1の勝利！' : 'プレイヤー2の勝利！');
        }
        onClose();
    };

    const handleShufflePrizes = () => {
        // Since shuffleDeck is specific to deck, we do a manual move for prizes here or add a shuffleZone action
        // For simplicity, we just use a local trick or add a new store action later.
        alert('サイドのシャッフルは現在開発中です。');
    };

    const handleShuffleDeck = () => {
        const owner = state.zone.startsWith('player1') ? 'player1' : 'player2';
        setIsShuffling(true);
        shuffleDeck(owner);
        setTimeout(() => {
            setIsShuffling(false);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 touch-none overscroll-none" onClick={onClose}>
            <div
                className="bg-slate-900 border-2 border-slate-600 rounded-xl p-6 w-[95%] max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overscroll-none"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Context Controls */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                        {state.zone === 'player1-deck' && '山札'}
                        {state.zone === 'player1-trash' && 'トラッシュ'}
                        {state.zone === 'player1-prizes' && 'サイド'}
                    </h2>

                    {state.zone !== 'player1-deck' && (
                        <button className="text-slate-400 hover:text-white font-bold text-xl px-4" onClick={onClose}>✕</button>
                    )}
                </div>

                {/* Specific Zone Toolbars */}
                {state.zone.endsWith('-prizes') && (
                    <div className="flex flex-wrap gap-2 mb-4 bg-slate-800 p-2 rounded">
                        <button className="bg-green-700 hover:bg-green-600 text-white rounded shadow font-bold border border-green-500 transition-colors responsive-btn" onClick={() => setIsPrizesRevealed(!isPrizesRevealed)}>
                            {isPrizesRevealed ? 'カードを裏にする' : 'カードを表にする'}
                        </button>
                        <button className="bg-slate-700 hover:bg-slate-600 text-white rounded shadow font-bold border border-slate-500 transition-colors responsive-btn" onClick={handleShufflePrizes}>シャッフルする</button>
                        <div className="ml-auto flex gap-2">
                            <button className="bg-green-700 hover:bg-green-600 text-white rounded shadow font-bold border border-green-500 transition-colors responsive-btn" onClick={() => handleDrawFromPrizes(1)}>1枚取る</button>
                            <button className="bg-green-700 hover:bg-green-600 text-white rounded shadow font-bold border border-green-500 transition-colors responsive-btn" onClick={() => handleDrawFromPrizes(2)}>2枚取る</button>
                            <button className="bg-green-700 hover:bg-green-600 text-white rounded shadow font-bold border border-green-500 transition-colors responsive-btn" onClick={() => handleDrawFromPrizes(3)}>3枚取る</button>
                        </div>
                    </div>
                )}

                {state.zone.endsWith('-deck') && (
                    <div className="flex flex-wrap gap-2 mb-4 bg-slate-800 p-2 rounded items-center">
                        <button className={`responsive-btn rounded shadow font-bold border transition-colors ${deckViewMode === 'top-5' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-700 border-slate-500 text-slate-200'}`} onClick={() => setDeckViewMode(deckViewMode === 'top-5' ? 'hidden' : 'top-5')}>上5枚見る</button>
                        <button className={`responsive-btn rounded shadow font-bold border transition-colors ${deckViewMode === 'top-7' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-700 border-slate-500 text-slate-200'}`} onClick={() => setDeckViewMode(deckViewMode === 'top-7' ? 'hidden' : 'top-7')}>上7枚見る</button>
                        <button className={`responsive-btn rounded shadow font-bold border transition-colors ${deckViewMode === 'all' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-700 border-slate-500 text-slate-200'}`} onClick={() => setDeckViewMode(deckViewMode === 'all' ? 'hidden' : 'all')}>山札全て見る</button>

                        <div className="h-6 w-px bg-slate-600 mx-2"></div>

                        <button className={`bg-blue-700 hover:bg-blue-600 text-white rounded shadow font-bold border border-blue-500 transition-colors responsive-btn ${isShuffling ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={handleShuffleDeck} disabled={isShuffling}>シャッフル</button>
                        <button className={`bg-green-700 hover:bg-green-600 text-white rounded shadow font-bold border border-green-500 transition-colors responsive-btn ${isShuffling ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => {
                            const owner = state.zone.startsWith('player1') ? 'player1' : 'player2';
                            drawCards(owner, 1);
                            onClose();
                        }} disabled={isShuffling}>1枚ドロー</button>
                    </div>
                )}

                {/* Horizontal Scrollable Card Area */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar touch-pan-x overscroll-contain">
                    <div className="flex space-x-4 min-items-center h-[280px] p-4">
                        {displayCards.length === 0 && <p className="text-slate-500 italic m-auto">カードがありません</p>}

                        {displayCards.map((card, index) => {
                            // Determine face down logic based on zone suffix
                            let isFaceDown = card.isReversed;
                            if (state.zone.endsWith('-prizes')) isFaceDown = !isPrizesRevealed;
                            if (state.zone.endsWith('-trash')) isFaceDown = false;
                            if (state.zone.endsWith('-deck')) {
                                isFaceDown = true;
                                if (deckViewMode === 'all') isFaceDown = false;
                                if (deckViewMode === 'top-5' && index < 5) isFaceDown = false;
                                if (deckViewMode === 'top-7' && index < 7) isFaceDown = false;
                            }

                            const shuffleTransform = isShuffling
                                ? `translateY(${Math.random() * 40 - 20}px) translateX(${Math.random() * 40 - 20}px) rotate(${Math.random() * 20 - 10}deg)`
                                : 'none';

                            return (
                                <div key={card.instanceId}
                                    className="flex-shrink-0 relative transition-transform duration-150 ease-in-out"
                                    style={{ transform: shuffleTransform }}>
                                    <div className="absolute -top-6 w-full text-center text-slate-400 text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="touch-auto" style={{ touchAction: 'pan-x' }}>
                                        <Card
                                            card={{ ...card, isReversed: isFaceDown }}
                                            style={{
                                                width: 'clamp(100px, 25vw, 150px)',
                                                height: 'calc(clamp(100px, 25vw, 150px) * 1.4)',
                                                fontSize: 'clamp(10px, 2.5vw, 14px)'
                                            }}
                                            disableDrag={isFaceDown}
                                            onClick={() => !isFaceDown && onSelectCard && onSelectCard(card)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
