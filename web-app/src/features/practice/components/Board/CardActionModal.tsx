import React, { useState } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { CardInstance } from '@/types/game';

interface Props {
    card: CardInstance;
    onClose: () => void;
}

export const CardActionModal: React.FC<Props> = ({ card: initialCard, onClose }) => {
    const liveCard = useGameStore(state => state.cards[initialCard.instanceId]) || initialCard;
    const { updateCardState, zones } = useGameStore();
    const [isFlipped, setIsFlipped] = useState(false);

    let currentZone = '';
    for (const [zName, cardIds] of Object.entries(zones)) {
        if (cardIds.includes(liveCard.instanceId)) {
            currentZone = zName;
            break;
        }
    }
    const isBench = currentZone.startsWith('player1-bench') || currentZone.startsWith('player2-bench');
    const isField = isBench || currentZone.endsWith('-active');

    const handleClose = () => {
        onClose();
    };

    const handleAddDamage = (amount: number) => {
        updateCardState(liveCard.instanceId, { damage: Math.min(1000, Math.max(0, liveCard.damage + amount)) });
    };

    const handleClearDamage = () => {
        updateCardState(liveCard.instanceId, { damage: 0 });
    };

    const handleToggleCondition = (condition: string) => {
        const hasCondition = liveCard.specialConditions.includes(condition);
        let newConditions = [...liveCard.specialConditions];
        if (['asleep', 'paralyzed', 'confused'].includes(condition)) {
            newConditions = newConditions.filter(c => !['asleep', 'paralyzed', 'confused'].includes(c));
        }
        if (hasCondition) {
            newConditions = newConditions.filter(c => c !== condition);
        } else {
            newConditions.push(condition);
        }
        updateCardState(liveCard.instanceId, { specialConditions: newConditions });
    };

    const handleToggleAbility = () => {
        updateCardState(liveCard.instanceId, { hasUsedAbility: !liveCard.hasUsedAbility });
    };

    // All face-up cards should basically be enlargable. Reversed (back) cards stay back.
    const showImageFull = !isField || isFlipped;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={handleClose}>
            {/* Flip Container */}
            <div className="relative w-[320px] h-[450px]" style={{ perspective: '1000px' }} onClick={e => e.stopPropagation()}>

                {/* Close Button (Top right outside) */}
                <button className="absolute -top-12 -right-4 text-white p-2 bg-slate-800 rounded-full hover:bg-red-500 transition-colors z-[101]" onClick={handleClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Flip Icon (Always fixed top-right within frame area) */}
                {isField && (
                    <button
                        className="absolute top-4 right-4 text-blue-400 p-2 bg-slate-900/80 rounded-full hover:bg-blue-600 hover:text-white transition-all z-[10001] shadow-xl border border-blue-500/30"
                        onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
                    </button>
                )}

                <div className="w-full h-full relative transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

                    {/* Front: Image (or Back if reversed) */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-700">
                        <img
                            src={liveCard.isReversed ? 'https://www.pokemon-card.com/assets/images/card_images/back.png' : liveCard.imageUrl}
                            alt={liveCard.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Back: Controls (Only for Field Cards) */}
                    {isField && (
                        <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-slate-800 border-2 border-slate-600 p-5 shadow-2xl overflow-y-auto" style={{ transform: 'rotateY(180deg)' }}>
                            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
                                <h3 className="text-white font-bold">{liveCard.name}</h3>
                                <button className="text-slate-400 hover:text-white" onClick={() => setIsFlipped(false)}>戻る</button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">ダメージ ({liveCard.damage})</p>
                                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                                        {[10, 50, 100, -10, -50, -100].map(val => (
                                            <button key={val} onClick={() => handleAddDamage(val)} className={`px-2 py-1.5 rounded font-bold border ${val > 0 ? 'bg-red-900/40 border-red-800/50 text-red-200' : 'bg-blue-900/40 border-blue-800/50 text-blue-200'}`}>
                                                {val > 0 ? `+${val}` : val}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={handleClearDamage} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded text-xs w-full mt-2">リセット</button>
                                </div>

                                {liveCard.type === 'pokemon' && (
                                    <div>
                                        <p className="text-xs text-slate-400 mb-2">特性 / 能力</p>
                                        <button onClick={handleToggleAbility} className={`w-full px-3 py-2 rounded text-xs font-bold border transition-colors ${liveCard.hasUsedAbility ? 'bg-red-500/80 border-red-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                                            特性を使用する
                                        </button>
                                    </div>
                                )}

                                {liveCard.type === 'pokemon' && !isBench && (
                                    <div>
                                        <p className="text-xs text-slate-400 mb-2">特殊状態</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {['poisoned:どく', 'burned:やけど', 'asleep:ねむり', 'paralyzed:マヒ', 'confused:こんらん'].map(status => {
                                                const [key, label] = status.split(':');
                                                const isActive = liveCard.specialConditions.includes(key);
                                                return (
                                                    <button key={key} onClick={() => handleToggleCondition(key)} className={`px-2 py-1.5 rounded text-[10px] border ${isActive ? 'bg-purple-900 border-purple-500 text-white shadow-lg shadow-purple-900/50' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) || (
                                        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                            <p className="text-[10px] text-slate-500 italic">ベンチのポケモンには特殊状態は適用されません。</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .backface-hidden {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
            `}</style>
        </div>
    );
};
