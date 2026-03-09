import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { CardInstance } from '@/types/game';

export const getEnergyIcon = (energyName: string) => {
    // Map energy names to the design_rules files
    if (energyName.includes('雷')) return '/assets/symbols/lightning.png';
    if (energyName.includes('草')) return '/assets/symbols/grass.png';
    if (energyName.includes('炎')) return '/assets/symbols/fire.png';
    if (energyName.includes('水')) return '/assets/symbols/water.png';
    if (energyName.includes('超')) return '/assets/symbols/psychic.png';
    if (energyName.includes('闘')) return '/assets/symbols/fighting.png';
    if (energyName.includes('悪')) return '/assets/symbols/darkness.png';
    if (energyName.includes('鋼')) return '/assets/symbols/metal.png';
    if (energyName.includes('ドラゴン')) return '/assets/symbols/dragon.png';
    return '/assets/symbols/colorless.png';
};

const AttachedEnergyIcon: React.FC<{ energyId: string, zIndex: number }> = ({ energyId, zIndex }) => {
    const { cards } = useGameStore();
    const energyCard = cards[energyId];

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: energyId,
        data: { card: energyCard },
        disabled: !energyCard,
    });

    if (!energyCard) return null;

    const dndStyle = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 9999 : zIndex,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="w-5 h-5 rounded-full border border-white bg-white/50 shadow-md flex-shrink-0 relative overflow-hidden"
            style={dndStyle}
            onClick={(e) => e.stopPropagation()}
        >
            <img src={getEnergyIcon(energyCard.name)} alt={energyCard.name} className="w-full h-full object-cover mix-blend-multiply pointer-events-none" />
        </div>
    );
};

interface CardProps {
    card: CardInstance;
    style?: React.CSSProperties; // Custom styles (e.g., offsets in hand/deck)
    className?: string; // Additional classes
    onClick?: (card: CardInstance) => void;
    disableDrag?: boolean;
    isOverlay?: boolean;
    zoneName?: string;
    forcedTransform?: string;
}

export const Card: React.FC<CardProps> = ({ card, style = {}, className = '', onClick, disableDrag = false, isOverlay = false, zoneName, forcedTransform }) => {
    const { cards, displayMode } = useGameStore();
    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
        id: card.instanceId,
        data: { card },
        disabled: disableDrag,
    });

    const { isOver, setNodeRef: setDroppableRef } = useDroppable({
        id: card.instanceId,
        data: card,
        disabled: card.type !== 'pokemon', // Only Pokemon can act as droppables for Energy/Tools
    });

    // Combine refs so we can drag AND drop on the card
    const setNodeRef = (node: HTMLElement | null) => {
        setDraggableRef(node);
        setDroppableRef(node);
    };

    let bgColor = '#475569'; // default slate
    if (card.type === 'pokemon') bgColor = '#eab308'; // yellow for pokemon
    else if (card.type === 'energy') bgColor = '#3b82f6'; // blue for energy
    else if (card.type === 'trainer') bgColor = '#ef4444'; // red for trainer

    const isBench = zoneName && zoneName.startsWith('player1-bench');
    const showConditions = !isBench && card.specialConditions && card.specialConditions.length > 0;

    // Image visibility logic based on displayMode
    const shouldShowImage = displayMode === 'local-image';
    const bgImageUrl = (card.isReversed)
        ? 'https://www.pokemon-card.com/assets/images/card_images/back.png'
        : (shouldShowImage ? card.imageUrl : 'none');

    let finalTransform = '';

    // 1. Drag offset (global screen space, so must be leftmost)
    if (transform && !isOverlay) {
        finalTransform += `translate3d(${transform.x}px, ${transform.y}px, 0) `;
    }

    // 2. Zone positioning/stacking layout (e.g. translateY for bench/active, rotate for prizes)
    if (style.transform) {
        finalTransform += style.transform + ' ';
    }

    // 3. Face-down flip
    if (card.isReversed && !forcedTransform) {
        finalTransform += 'rotateY(180deg) ';
    }

    // 4. Status condition rotation (e.g. Asleep -> -90deg, Confused -> -180deg)
    if (forcedTransform) {
        finalTransform += forcedTransform;
    }

    const mergedStyle = { ...style };
    delete mergedStyle.transform;

    const dndStyle: React.CSSProperties = {
        zIndex: isDragging ? 999 : style.zIndex,
        opacity: isDragging && !isOverlay ? 0 : 1, // Make original completely hidden when dragging
        cursor: isDragging ? 'grabbing' : 'grab',
        backgroundImage: bgImageUrl !== 'none' ? `url(${bgImageUrl})` : 'none',
        backgroundColor: bgImageUrl === 'none' ? bgColor : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px black',
        padding: '4px',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '4px',
        boxShadow: isOver ? '0 0 0 4px #eab308' : '0 2px 4px rgba(0,0,0,0.3)',
        ...mergedStyle, // Spread mergedStyle here so it can override position, etc.
        transform: finalTransform || undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={dndStyle}
            {...listeners}
            {...attributes}
            className={`card ${className} active:brightness-90 transition-all duration-75 overflow-hidden`}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(card);
            }}
        >
            {/* Compact/Text Mode Info Overlay */}
            {(displayMode === 'text' || (displayMode === 'compact' && bgImageUrl === 'none')) && (
                <div className={`w-full h-full flex flex-col items-center justify-between py-1 ${card.isReversed ? 'scale-x-[-1]' : ''}`}>
                    <div className="text-[min(10px,2vw)] leading-tight px-1 break-words">
                        {card.isReversed ? '裏面' : card.name}
                    </div>
                    {!card.isReversed && card.type === 'pokemon' && (
                        <div className="bg-black/40 px-1 rounded text-[min(8px,1.5vw)]">
                            HP {card.hp || '???'}
                        </div>
                    )}
                </div>
            )}

            {/* Visual Overlays for Game State (HP, Damage, etc.) */}
            {card.hasUsedAbility && (
                <div className="absolute top-1 right-1 bg-red-600 text-white text-[max(6px,0.8vw)] font-bold px-1 rounded shadow pointer-events-none z-[70]">
                    USED
                </div>
            )}

            {/* Special Condition Markers */}
            {showConditions && (
                <div className="absolute bottom-1 right-1 flex flex-wrap-reverse gap-0.5 justify-end w-[60%] pointer-events-none z-[70]">
                    {card.specialConditions.includes('poisoned') && <div className="w-[min(12px,2vw)] h-[min(12px,2vw)] bg-fuchsia-600 rounded-full border border-white shadow-sm pointer-events-none" title="どく"></div>}
                    {card.specialConditions.includes('burned') && <div className="w-[min(12px,2vw)] h-[min(12px,2vw)] bg-orange-500 rounded-full border border-white shadow-sm pointer-events-none" title="やけど"></div>}
                    {card.specialConditions.includes('asleep') && <div className="w-[min(12px,2vw)] h-[min(12px,2vw)] bg-blue-500 rounded-full border border-white shadow-sm pointer-events-none" title="ねむり"></div>}
                    {card.specialConditions.includes('paralyzed') && <div className="w-[min(12px,2vw)] h-[min(12px,2vw)] bg-yellow-400 rounded-full border border-white shadow-sm pointer-events-none" title="マヒ"></div>}
                    {card.specialConditions.includes('confused') && <div className="w-[min(12px,2vw)] h-[min(12px,2vw)] bg-emerald-500 rounded-full border border-white shadow-sm pointer-events-none" title="こんらん"></div>}
                </div>
            )}

            {card.damage > 0 && (
                <div className="card-overlay highlight pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="damage-counter bg-red-600/90 text-white rounded-full w-[60%] aspect-square flex items-center justify-center text-[min(20px,4vw)] font-bold border-[3px] border-white shadow-2xl z-10">{card.damage}</div>
                </div>
            )}

            {/* Attached Energy Indicators */}
            {card.attachedEnergyIds?.length > 0 && (
                <div className="absolute -bottom-2 -left-2 flex flex-wrap gap-0.5 z-[60]" style={{ pointerEvents: 'auto' }}>
                    {card.attachedEnergyIds.map((eid: string, idx: number) => (
                        <AttachedEnergyIcon key={`${eid}-${idx}`} energyId={eid} zIndex={60 + idx} />
                    ))}
                </div>
            )}
        </div>
    );
};
