import React, { useState } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { CardInstance } from '@/types/game';

interface Props {
    card: CardInstance;
    onClose: () => void;
}

export const CardActionModal: React.FC<Props> = ({ card: initialCard, onClose }) => {
    // Subscribe to the specific card to get live updates
    const liveCard = useGameStore(state => state.cards[initialCard.instanceId]) || initialCard;
    const { updateCardState, zones } = useGameStore();

    let currentZone = '';
    for (const [zName, cardIds] of Object.entries(zones)) {
        if (cardIds.includes(liveCard.instanceId)) {
            currentZone = zName;
            break;
        }
    }
    const isBench = currentZone.startsWith('player1-bench');
    const isHand = currentZone === 'player1-hand';
    const isStadium = currentZone === 'stadium';
    const isTool = liveCard.kinds === 'tool';

    const handleClose = () => {
        onClose();
    };

    if (isHand || isStadium || isTool) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 pb-10" onClick={handleClose}>
                <div className="relative">
                    <img src={liveCard.imageUrl} alt={liveCard.name} className="w-[85vw] max-w-[420px] rounded-[18px] shadow-[0_0_40px_rgba(0,0,0,1)] object-cover" onClick={e => e.stopPropagation()} />
                    <button className="absolute -top-12 right-0 text-white p-2 bg-slate-800/80 rounded-full hover:bg-red-500 transition-colors shadow-lg border border-slate-600" onClick={handleClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
        );
    }

    const handleAddDamage = (amount: number) => {
        updateCardState(liveCard.instanceId, { damage: Math.min(1000, Math.max(0, liveCard.damage + amount)) });
    };

    const handleClearDamage = () => {
        updateCardState(liveCard.instanceId, { damage: 0 });
    };

    const handleToggleCondition = (condition: string) => {
        const hasCondition = liveCard.specialConditions.includes(condition);
        let newConditions = [...liveCard.specialConditions];

        // Sleep, Paralysis, Confusion are mutually exclusive rotation-based conditions
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

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={handleClose}>
            <div
                className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-[320px] shadow-2xl"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside menu
            >
                <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
                    <h3 className="text-white font-bold">{liveCard.name}{liveCard.isReversed ? ' (裏面)' : ''}</h3>
                    <button className="text-slate-400 hover:text-white" onClick={handleClose}>✕</button>
                </div>

                <div className="space-y-4">
                    {/* Damage Controls */}
                    <div>
                        <p className="text-xs text-slate-400 mb-2">ダメージ ({liveCard.damage})</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleAddDamage(10)} className="bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1 rounded text-sm">+10</button>
                            <button onClick={() => handleAddDamage(50)} className="bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1 rounded text-sm">+50</button>
                            <button onClick={() => handleAddDamage(100)} className="bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1 rounded text-sm">+100</button>
                            <button onClick={() => handleAddDamage(-10)} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded text-sm">-10</button>
                            <button onClick={() => handleAddDamage(-50)} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded text-sm">-50</button>
                            <button onClick={() => handleAddDamage(-100)} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded text-sm">-100</button>
                        </div>
                        <button onClick={handleClearDamage} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded text-sm w-full mt-2">リセット</button>
                    </div>

                    {/* Ability / 特性 */}
                    {liveCard.type === 'pokemon' && (
                        <div>
                            <p className="text-xs text-slate-400 mb-2">特性</p>
                            <button
                                onClick={handleToggleAbility}
                                className={`w-full px-3 py-2 rounded text-sm font-bold border transition-colors ${liveCard.hasUsedAbility ? 'bg-red-500/80 border-red-400 text-white' : 'bg-red-900/30 border-red-900/50 text-red-300 hover:bg-red-900/50'
                                    }`}
                            >
                                特性を使用する / Use Ability
                            </button>
                        </div>
                    )}

                    {/* Status Conditions */}
                    {liveCard.type === 'pokemon' && !isBench && (
                        <div>
                            <p className="text-xs text-slate-400 mb-2">特殊状態</p>
                            <div className="grid grid-cols-2 gap-2">
                                {['poisoned:どく', 'burned:やけど', 'asleep:ねむり', 'paralyzed:マヒ', 'confused:こんらん'].map(status => {
                                    const [key, label] = status.split(':');
                                    const isActive = liveCard.specialConditions.includes(key);
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handleToggleCondition(key)}
                                            className={`px-2 py-1 rounded text-xs border ${isActive ? 'bg-purple-900 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
